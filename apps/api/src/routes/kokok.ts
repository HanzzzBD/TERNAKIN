import crypto from "node:crypto";
import { Router, type Response } from "express";
import {
  checkKokokOutputSafety,
  detectUnsafeUserAsk,
  jawabanPenjagaCakupan,
  periksaCakupanPertanyaan,
  jawabanCadanganAman,
  kokokObrolanRequestSchema,
  kokokTriaseRequestSchema,
  kokokTriaseResponseSchema,
  tujuanRujukanUntukUrgensi,
  type GalatApi,
  type KokokObrolanRequest,
  type KokokObrolanResponse,
  type KokokTriaseRequest,
  type KokokTriaseResponse,
  type RingkasanKasus,
  type SumberPanduan,
  type UrgensiKokok,
} from "@ternakin/shared";
import { PANDUAN_BAHAYA_TINGGI } from "../adapters/mockLlm.js";
import { balasObrolanCadangan } from "../adapters/obrolanCadangan.js";
import type {
  GuidelineChunk,
  GuidelineRetriever,
  KategoriObrolan,
  LlmAdapter,
} from "../adapters/types.js";
import type { DatabaseContext } from "../db/database.js";
import { catatPemakaianLlm, hashSingkatUntukLog, hitungPemakaianHariIni } from "../lib/llmGuard.js";
import { logger } from "../lib/logger.js";
import { AWALAN_AKUN, kunciPemilik } from "../lib/pemilik.js";
import { llmLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

const PENAFIAN_KOKOK =
  "Bukan diagnosis medis dan tidak memberi dosis obat. Untuk pemeriksaan langsung dan pengobatan, konsultasikan dengan dokter hewan, puskeswan, atau penyuluh peternakan.";

export interface KokokRouterDeps {
  dbCtx: DatabaseContext;
  llmAdapter: LlmAdapter;
  guidelineRetriever: GuidelineRetriever;
  dailyLlmLimit: number;
}

/** Pemilik untuk batas harian dan riwayat: akun bila sudah masuk, lalu perangkat, lalu alamat IP. */
function ambilPerangkatId(
  res: Response,
  bodyPerangkatId: string | undefined,
  headerVal: string | undefined,
  ip: string,
): string {
  return kunciPemilik(res, bodyPerangkatId, headerVal) ?? `ip:${ip}`;
}

function petakanSumber(guidelines: readonly GuidelineChunk[]): SumberPanduan[] {
  return guidelines.map((g) => ({
    id: g.id,
    judul: g.judul,
    sumber: g.sumber,
    versi: g.versi,
    ringkasanKutipan: g.ringkasanKutipan,
  }));
}

function susunRingkasanKasus(body: KokokTriaseRequest, urgensi: UrgensiKokok): RingkasanKasus {
  const ctx = body.konteksKandang;
  return {
    kandang: ctx?.namaKandang?.trim() || "Kandang petelur",
    jenisAyam: ctx?.jenisAyam ?? "petelur",
    umurMinggu: ctx?.umurMinggu ?? null,
    populasiEkor: ctx?.jumlahEkor ?? null,
    lokasi: ctx?.lokasi?.trim() || null,
    gejala: body.gejala,
    sejakKapan: body.sejakKapan?.trim() || "Belum disebutkan",
    peringatan7Hari: ctx?.peringatan7Hari ?? [],
    urgensi,
  };
}

function deteksiUrgensiBahayaAwal(
  gejala: string,
  guidelines: readonly GuidelineChunk[],
): UrgensiKokok {
  const polaTinggi =
    /\b(?:mati mendadak|kematian mendadak|banyak mati|leher terpuntir|kejang|lumpuh|jengger biru|kebiruan|sesak berat)\b/i;
  if (polaTinggi.test(gejala) || PANDUAN_BAHAYA_TINGGI.has(guidelines[0]?.id ?? "")) {
    return "tinggi";
  }
  return "sedang";
}

function simpanRiwayatRingkas(
  dbCtx: DatabaseContext,
  perangkatId: string,
  respons: KokokTriaseResponse,
): void {
  const ringkasanTersimpan = `${respons.ringkasanKasus.kandang} (${respons.ringkasanKasus.jenisAyam}) — urgensi ${respons.urgensi}${respons.tidakTahu ? " [di luar panduan]" : ""}${respons.terfilter ? " [terfilter]" : ""}`;
  const sumberDipakai = JSON.stringify(respons.sumber.map((s) => s.id));

  dbCtx.db
    .prepare(
      `INSERT INTO percakapan_kokok
         (id, pengguna_id, perangkat_id, ringkasan, urgensi, sumber_dipakai, dibuat_pada)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      respons.id,
      perangkatId.startsWith(AWALAN_AKUN) ? perangkatId.slice(AWALAN_AKUN.length) : null,
      perangkatId,
      ringkasanTersimpan,
      respons.urgensi,
      sumberDipakai,
      respons.dibuatPada,
    );
}

export function createKokokRouter(deps: KokokRouterDeps): Router {
  const router = Router();

  /**
   * Jawaban untuk pesan yang dijaga (minta obat, praktik berbahaya, di luar topik, dll.):
   * ditulis AI dengan arahan kategori agar terasa menanggapi pesan, lalu disaring. Bila AI tidak
   * tersedia (mock) atau jawabannya ditolak filter, pakai jawaban tetap yang aman.
   */
  const tulisJawabanAman = async (
    pesan: string,
    kategori: KategoriObrolan,
    panduan: readonly GuidelineChunk[],
    cadangan: string,
  ): Promise<{ jawaban: string; tokenMasuk: number; tokenKeluar: number }> => {
    const hasil = await deps.llmAdapter.ngobrol({
      pesan,
      riwayat: [],
      konteks: "aplikasi",
      kategori,
      panduan,
    });
    const aman = checkKokokOutputSafety("", [], hasil.balasan).aman;
    return {
      jawaban: aman && hasil.sumber !== "mock" ? hasil.balasan : cadangan,
      tokenMasuk: hasil.tokenMasuk,
      tokenKeluar: hasil.tokenKeluar,
    };
  };

  // Sesuai SDD: POST /v1/kokok/triase — triase gejala unggas berbasis panduan (RAG) dan filter keselamatan.
  router.post("/triase", llmLimiter, validate(kokokTriaseRequestSchema), async (req, res, next) => {
    try {
      const body = req.body as KokokTriaseRequest;
      const perangkatId = ambilPerangkatId(
        res,
        body.perangkatId,
        req.header("x-device-id"),
        req.ip ?? "lokal",
      );

      // Jangan mencatat isi teks mentah peternak di log; catat panjang dan hash singkat saja.
      logger.info(
        {
          rute: "/v1/kokok/triase",
          panjang: body.gejala.length,
          hash: hashSingkatUntukLog(body.gejala.toLowerCase()),
        },
        "Permintaan triase Kokok diterima",
      );

      const pemakaianHariIni = hitungPemakaianHariIni(deps.dbCtx.db, perangkatId);
      if (pemakaianHariIni >= deps.dailyLlmLimit) {
        const galat: GalatApi = {
          kode: "BATAS_HARIAN_LLM",
          pesan:
            "Batas pertanyaan ke Kokok hari ini sudah tercapai. Anda masih bisa membaca riwayat tanya sebelumnya, lalu coba lagi besok atau langsung hubungi penyuluh/dokter hewan.",
        };
        res.status(429).json(galat);
        return;
      }

      const id = crypto.randomUUID();
      const dibuatPada = new Date().toISOString();

      // 0. Penjaga cakupan: praktik berbahaya, kesehatan manusia, keuangan, dan topik di luar
      //    unggas tidak ditriase. Langkah & urgensi tetap dari penjaga; kalimat jawaban ditulis AI
      //    dengan arahan kategori (cadangan: jawaban tetap).
      const cakupan = periksaCakupanPertanyaan(body.gejala);
      if (cakupan.kategori !== "boleh") {
        const penjaga = jawabanPenjagaCakupan(cakupan.kategori);
        logger.info(
          { rute: "/v1/kokok/triase", kategori: cakupan.kategori },
          "Pertanyaan Kokok di luar cakupan dijawab penjaga",
        );
        const ditulis = await tulisJawabanAman(body.gejala, cakupan.kategori, [], penjaga.jawaban);
        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi: penjaga.urgensi,
          jawaban: ditulis.jawaban,
          alasanUrgensi: penjaga.alasanUrgensi,
          tujuanRujukan:
            cakupan.kategori === "praktik_berbahaya" ? tujuanRujukanUntukUrgensi("tinggi") : null,
          panduanUmum: penjaga.panduanUmum,
          sumber: [],
          ringkasanKasus: susunRingkasanKasus(body, penjaga.urgensi),
          // Di luar topik = di luar pedoman (bukan disaring); kategori lain = disaring penjaga.
          tidakTahu: cakupan.kategori === "di_luar_topik",
          terfilter: cakupan.kategori !== "di_luar_topik",
          catatanFilter: penjaga.catatanFilter,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });
        catatPemakaianLlm(
          deps.dbCtx.db,
          perangkatId,
          "/v1/kokok/triase",
          ditulis.tokenMasuk,
          ditulis.tokenKeluar,
        );
        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      /** Panduan tidak membahas keluhan ini: Kokok mengaku tidak tahu dan merujuk ke ahli. */
      const kirimTidakTahu = () => {
        const urgensi: UrgensiKokok = "sedang";
        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi,
          jawaban:
            "Maaf, Bapak/Ibu, panduan Kokok belum membahas keluhan seperti ini, jadi Kokok tidak mau menebak. Sebaiknya tunjukkan kondisi ayam langsung ke penyuluh peternakan, puskeswan, atau dokter hewan.",
          alasanUrgensi:
            "Pedoman kami belum mencakup ini. Karena kondisi tidak tercakup di pedoman yang tersedia, sebaiknya konsultasikan langsung kepada penyuluh peternakan, puskeswan, atau dokter hewan.",
          tujuanRujukan: tujuanRujukanUntukUrgensi(urgensi),
          panduanUmum: [
            "Jika ada ayam yang tampak sakit atau berubah perilaku, pisahkan sementara ke area terpisah untuk diamati.",
            "Catat gejala yang terlihat, jumlah ekor terdampak, perubahan pakan/telur, serta kapan gejala mulai muncul.",
            "Kirimkan ringkasan kasus di bawah ini ke penyuluh peternakan, puskeswan, atau dokter hewan setempat untuk arahan yang tepat.",
          ],
          sumber: [],
          ringkasanKasus: susunRingkasanKasus(body, urgensi),
          tidakTahu: true,
          terfilter: false,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });
        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
      };

      // 4 potongan: panduan triase + dokumen pengetahuan peternakan yang paling relevan.
      const guidelines = await deps.guidelineRetriever.search(body.gejala, 4);
      const sumber = petakanSumber(guidelines);
      const deteksi = detectUnsafeUserAsk(body.gejala);

      // 1. Jika pengguna meminta dosis obat atau diagnosis pasti, tolak dengan jawaban cadangan aman.
      if (deteksi.mintaDosis || deteksi.mintaDiagnosis) {
        const alasanTolak = deteksi.mintaDosis
          ? "Permintaan dosis atau takaran obat ditolak sesuai aturan keselamatan Kokok."
          : "Permintaan diagnosis pasti ditolak sesuai aturan keselamatan Kokok.";
        const urgensiAwal = deteksiUrgensiBahayaAwal(body.gejala, guidelines);
        const cadangan = jawabanCadanganAman(urgensiAwal, alasanTolak);
        const ditulis = await tulisJawabanAman(
          body.gejala,
          deteksi.mintaDosis ? "minta_obat" : "minta_diagnosis",
          guidelines,
          deteksi.mintaDosis
            ? "Kokok tidak boleh memberi nama obat, dosis, atau takaran, karena salah obat atau salah takaran bisa membahayakan ayam dan menimbulkan resistensi. Obat dan dosisnya perlu ditentukan dokter hewan setelah melihat ayamnya langsung."
            : "Kokok tidak bisa memastikan penyakit, karena banyak penyakit ayam gejalanya mirip. Kepastian penyakit perlu pemeriksaan dokter hewan atau laboratorium; Kokok bantu dengan langkah aman sambil menunggu.",
        );

        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi: cadangan.urgensi,
          jawaban: ditulis.jawaban,
          alasanUrgensi: cadangan.alasanUrgensi,
          tujuanRujukan: cadangan.tujuanRujukan,
          panduanUmum: cadangan.panduanUmum,
          sumber,
          ringkasanKasus: susunRingkasanKasus(body, cadangan.urgensi),
          tidakTahu: false,
          terfilter: true,
          catatanFilter: cadangan.catatanFilter,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });

        catatPemakaianLlm(deps.dbCtx.db, perangkatId, "/v1/kokok/triase", 0, 0);
        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      // 2. Jika tidak ada panduan relevan di basis data, katakan tidak tahu dengan urgensi sedang.
      if (guidelines.length === 0) {
        catatPemakaianLlm(deps.dbCtx.db, perangkatId, "/v1/kokok/triase", 0, 0);
        kirimTidakTahu();
        return;
      }

      // 3. Panggil adapter LLM hanya berdasarkan potongan panduan, lalu saring keluarannya.
      const hasilLlm = await deps.llmAdapter.triageKokok(
        {
          gejala: body.gejala,
          sejakKapan: body.sejakKapan,
          peringatan7Hari: body.konteksKandang?.peringatan7Hari ?? [],
        },
        guidelines,
      );

      catatPemakaianLlm(
        deps.dbCtx.db,
        perangkatId,
        "/v1/kokok/triase",
        hasilLlm.tokenMasuk,
        hasilLlm.tokenKeluar,
      );

      // AI menilai panduan yang ditemukan tidak membahas keluhan ini: jangan memaksakan jawaban.
      if (hasilLlm.diLuarPanduan) {
        kirimTidakTahu();
        return;
      }

      const hasilFilter = checkKokokOutputSafety(
        hasilLlm.alasanUrgensi,
        hasilLlm.panduanUmum,
        hasilLlm.jawaban,
      );

      if (!hasilFilter.aman) {
        logger.warn(
          { rute: "/v1/kokok/triase", alasan: hasilFilter.alasan },
          "Keluaran LLM Kokok ditolak filter keselamatan",
        );
        const cadangan = jawabanCadanganAman(
          hasilLlm.urgensi,
          hasilFilter.alasan ?? "Keluaran mengandung konten yang tidak aman.",
        );
        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi: cadangan.urgensi,
          alasanUrgensi: cadangan.alasanUrgensi,
          tujuanRujukan: cadangan.tujuanRujukan,
          panduanUmum: cadangan.panduanUmum,
          sumber,
          ringkasanKasus: susunRingkasanKasus(body, cadangan.urgensi),
          tidakTahu: false,
          terfilter: true,
          catatanFilter: cadangan.catatanFilter,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });

        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
        id,
        urgensi: hasilLlm.urgensi,
        jawaban: hasilLlm.jawaban,
        alasanUrgensi: hasilLlm.alasanUrgensi,
        tujuanRujukan: tujuanRujukanUntukUrgensi(hasilLlm.urgensi),
        panduanUmum: hasilLlm.panduanUmum,
        sumber,
        ringkasanKasus: susunRingkasanKasus(body, hasilLlm.urgensi),
        tidakTahu: false,
        terfilter: false,
        penafian: PENAFIAN_KOKOK,
        isUjiCoba: true,
        dibuatPada,
      });

      simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
      res.status(200).json(respons);
    } catch (err) {
      next(err);
    }
  });

  /** Kategori pesan obrolan: bahaya & permintaan obat dikenali dulu, sisanya diserahkan ke AI. */
  const kategoriObrolan = (pesan: string): KategoriObrolan => {
    const cakupan = periksaCakupanPertanyaan(pesan).kategori;
    if (cakupan === "praktik_berbahaya" || cakupan === "kesehatan_manusia") return cakupan;
    const deteksi = detectUnsafeUserAsk(pesan);
    if (deteksi.mintaDosis) return "minta_obat";
    if (deteksi.mintaDiagnosis) return "minta_diagnosis";
    return cakupan;
  };

  // POST /v1/kokok/obrolan — obrolan bebas dengan Kokok (popup & aplikasi). Semua balasan ditulis
  // AI dengan penjaga boleh/jangan; balasan cadangan dipakai bila AI tidak tersedia atau ditolak.
  router.post(
    "/obrolan",
    llmLimiter,
    validate(kokokObrolanRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as KokokObrolanRequest;
        const perangkatId = ambilPerangkatId(
          res,
          body.perangkatId,
          req.header("x-device-id"),
          req.ip ?? "lokal",
        );

        logger.info(
          {
            rute: "/v1/kokok/obrolan",
            panjang: body.pesan.length,
            hash: hashSingkatUntukLog(body.pesan.toLowerCase()),
          },
          "Pesan obrolan Kokok diterima",
        );

        if (hitungPemakaianHariIni(deps.dbCtx.db, perangkatId) >= deps.dailyLlmLimit) {
          const galat: GalatApi = {
            kode: "BATAS_HARIAN_LLM",
            pesan:
              "Kokok sudah banyak mengobrol hari ini. Coba lagi besok, atau hubungi penyuluh/dokter hewan bila ada keluhan mendesak.",
          };
          res.status(429).json(galat);
          return;
        }

        const kategori = kategoriObrolan(body.pesan);
        // Dokumen pengetahuan dicari untuk semua pesan kecuali yang dijaga khusus, agar pertanyaan
        // pakan/kandang yang tidak dikenali penjaga tetap dijawab berdasar dokumen.
        const cariDokumen = kategori === "boleh" || kategori === "di_luar_topik";
        const panduan = cariDokumen ? await deps.guidelineRetriever.search(body.pesan, 4) : [];
        const input = {
          pesan: body.pesan,
          riwayat: body.riwayat,
          konteks: body.konteks,
          kategori,
          panduan,
        };

        let hasil = await deps.llmAdapter.ngobrol(input);
        catatPemakaianLlm(
          deps.dbCtx.db,
          perangkatId,
          "/v1/kokok/obrolan",
          hasil.tokenMasuk,
          hasil.tokenKeluar,
        );

        let terfilter = false;
        const cek = checkKokokOutputSafety("", [], hasil.balasan);
        if (!cek.aman) {
          logger.warn(
            { rute: "/v1/kokok/obrolan", alasan: cek.alasan },
            "Balasan obrolan Kokok disaring",
          );
          hasil = balasObrolanCadangan(input);
          terfilter = true;
        }

        const respons: KokokObrolanResponse = {
          balasan: hasil.balasan,
          aksi: hasil.aksi,
          urgensi: hasil.urgensi,
          sumber: hasil.urgensi !== null ? petakanSumber(panduan) : [],
          sumberJawaban: hasil.sumber === "mock" ? "cadangan" : "llm",
          terfilter:
            terfilter ||
            (kategori !== "boleh" && kategori !== "di_luar_topik" && kategori !== "keuangan"),
        };
        res.status(200).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
