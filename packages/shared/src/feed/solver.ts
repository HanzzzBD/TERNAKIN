import type {
  BahanMaster,
  KebutuhanGiziItem,
  KekuranganGizi,
  KomposisiItem,
  PakanHitungRequest,
  PakanHitungResult,
  PemenuhanGiziItem,
  SaranBahanTambahan,
} from "../index.js";

const EPS = 1e-9;
const TOL_FEAS = 1e-4;
const MAX_PIVOTS = 2000;
const BATCH_KG = 100;

interface LinearConstraint {
  coeffs: number[];
  sense: "<=" | ">=" | "=";
  rhs: number;
}

interface LpResult {
  status: "optimal" | "infeasible" | "unbounded";
  values: number[];
  objective: number;
}

function pivot(tableau: number[][], pivotRow: number, pivotCol: number): void {
  const row = tableau[pivotRow];
  if (!row) return;
  const pivotVal = row[pivotCol] ?? 0;
  const cols = row.length;

  for (let j = 0; j < cols; j++) {
    row[j] = (row[j] ?? 0) / pivotVal;
  }

  for (let i = 0; i < tableau.length; i++) {
    if (i === pivotRow) continue;
    const target = tableau[i];
    if (!target) continue;
    const factor = target[pivotCol] ?? 0;
    if (Math.abs(factor) <= EPS) continue;
    for (let j = 0; j < cols; j++) {
      target[j] = (target[j] ?? 0) - factor * (row[j] ?? 0);
    }
  }
}

function runSimplex(
  tableau: number[][],
  basis: number[],
  numCols: number,
): "optimal" | "unbounded" {
  const objRowIndex = tableau.length - 1;
  const numRows = objRowIndex;

  for (let iter = 0; iter < MAX_PIVOTS; iter++) {
    const objRow = tableau[objRowIndex];
    if (!objRow) return "optimal";

    // Aturan Bland: pilih kolom terkecil dengan biaya tereduksi negatif.
    let enterCol = -1;
    for (let j = 0; j < numCols; j++) {
      if ((objRow[j] ?? 0) < -EPS) {
        enterCol = j;
        break;
      }
    }
    if (enterCol === -1) {
      return "optimal";
    }

    let leaveRow = -1;
    let minRatio = Number.POSITIVE_INFINITY;
    for (let r = 0; r < numRows; r++) {
      const row = tableau[r];
      if (!row) continue;
      const a = row[enterCol] ?? 0;
      if (a <= EPS) continue;
      const rhs = Math.max(0, row[numCols] ?? 0);
      const ratio = rhs / a;
      const currentBasic = basis[r] ?? Number.MAX_SAFE_INTEGER;
      const bestBasic =
        leaveRow === -1 ? Number.MAX_SAFE_INTEGER : (basis[leaveRow] ?? Number.MAX_SAFE_INTEGER);
      if (
        ratio < minRatio - EPS ||
        (Math.abs(ratio - minRatio) <= EPS && currentBasic < bestBasic)
      ) {
        minRatio = ratio;
        leaveRow = r;
      }
    }

    if (leaveRow === -1) {
      return "unbounded";
    }

    pivot(tableau, leaveRow, enterCol);
    basis[leaveRow] = enterCol;
  }

  return "optimal";
}

export function solveLinearProgram(costs: number[], rawConstraints: LinearConstraint[]): LpResult {
  const n = costs.length;
  const constraints: LinearConstraint[] = rawConstraints.map((c) => {
    if (c.rhs >= 0) {
      return { coeffs: [...c.coeffs], sense: c.sense, rhs: c.rhs };
    }
    const flippedSense: "<=" | ">=" | "=" = c.sense === "<=" ? ">=" : c.sense === ">=" ? "<=" : "=";
    return {
      coeffs: c.coeffs.map((v) => -v),
      sense: flippedSense,
      rhs: -c.rhs,
    };
  });

  const m = constraints.length;
  let nextCol = n;
  const slackOrSurplusCols: Array<{ row: number; col: number; sign: number }> = [];
  const artificialCols: Array<{ row: number; col: number }> = [];
  const basis: number[] = new Array<number>(m).fill(-1);

  for (let r = 0; r < m; r++) {
    const c = constraints[r];
    if (!c) continue;
    if (c.sense === "<=") {
      const col = nextCol++;
      slackOrSurplusCols.push({ row: r, col, sign: 1 });
      basis[r] = col;
    } else if (c.sense === ">=") {
      const surplusCol = nextCol++;
      slackOrSurplusCols.push({ row: r, col: surplusCol, sign: -1 });
      const artCol = nextCol++;
      artificialCols.push({ row: r, col: artCol });
      basis[r] = artCol;
    } else {
      const artCol = nextCol++;
      artificialCols.push({ row: r, col: artCol });
      basis[r] = artCol;
    }
  }

  const totalCols = nextCol;
  const artSet = new Set(artificialCols.map((a) => a.col));
  const tableau: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(totalCols + 1).fill(0),
  );

  for (let r = 0; r < m; r++) {
    const c = constraints[r];
    const row = tableau[r];
    if (!c || !row) continue;
    for (let j = 0; j < n; j++) {
      row[j] = c.coeffs[j] ?? 0;
    }
    row[totalCols] = c.rhs;
  }

  for (const s of slackOrSurplusCols) {
    const row = tableau[s.row];
    if (row) row[s.col] = s.sign;
  }
  for (const a of artificialCols) {
    const row = tableau[a.row];
    if (row) row[a.col] = 1;
  }

  // Fase I: minimalkan jumlah variabel artifisial.
  if (artificialCols.length > 0) {
    const objRow = tableau[m];
    if (objRow) {
      for (const a of artificialCols) {
        objRow[a.col] = 1;
      }
      for (let r = 0; r < m; r++) {
        const bCol = basis[r] ?? -1;
        if (!artSet.has(bCol)) continue;
        const row = tableau[r];
        if (!row) continue;
        for (let j = 0; j <= totalCols; j++) {
          objRow[j] = (objRow[j] ?? 0) - (row[j] ?? 0);
        }
      }
    }

    runSimplex(tableau, basis, totalCols);
    const phase1Obj = -(tableau[m]?.[totalCols] ?? 0);
    if (phase1Obj > TOL_FEAS) {
      return { status: "infeasible", values: new Array<number>(n).fill(0), objective: 0 };
    }

    // Keluarkan variabel artifisial bernilai 0 yang masih tersisa di basis.
    for (let r = 0; r < m; r++) {
      const bCol = basis[r] ?? -1;
      if (!artSet.has(bCol)) continue;
      const row = tableau[r];
      if (!row) continue;
      let pivotCol = -1;
      for (let j = 0; j < totalCols; j++) {
        if (artSet.has(j)) continue;
        if (Math.abs(row[j] ?? 0) > EPS) {
          pivotCol = j;
          break;
        }
      }
      if (pivotCol !== -1) {
        pivot(tableau, r, pivotCol);
        basis[r] = pivotCol;
      }
    }
  }

  // Fase II: bangun tableau tanpa kolom artifisial dan optimalkan biaya asli.
  const keptCols: number[] = [];
  const oldToNewCol = new Map<number, number>();
  for (let j = 0; j < totalCols; j++) {
    if (!artSet.has(j)) {
      oldToNewCol.set(j, keptCols.length);
      keptCols.push(j);
    }
  }

  const p2Rows: number[][] = [];
  const p2Basis: number[] = [];
  for (let r = 0; r < m; r++) {
    const oldBasic = basis[r] ?? -1;
    if (artSet.has(oldBasic)) continue; // Baris redundan
    const newBasic = oldToNewCol.get(oldBasic);
    const oldRow = tableau[r];
    if (newBasic === undefined || !oldRow) continue;
    const newRow = new Array<number>(keptCols.length + 1).fill(0);
    for (let k = 0; k < keptCols.length; k++) {
      const oldCol = keptCols[k] ?? 0;
      newRow[k] = oldRow[oldCol] ?? 0;
    }
    newRow[keptCols.length] = oldRow[totalCols] ?? 0;
    p2Rows.push(newRow);
    p2Basis.push(newBasic);
  }

  const p2Cols = keptCols.length;
  const p2Obj = new Array<number>(p2Cols + 1).fill(0);
  for (let j = 0; j < n; j++) {
    const mapped = oldToNewCol.get(j);
    if (mapped !== undefined) {
      p2Obj[mapped] = costs[j] ?? 0;
    }
  }

  // Eliminasi biaya variabel basis dari baris tujuan.
  for (let r = 0; r < p2Rows.length; r++) {
    const bCol = p2Basis[r] ?? -1;
    const row = p2Rows[r];
    if (!row || bCol < 0) continue;
    const coeff = p2Obj[bCol] ?? 0;
    if (Math.abs(coeff) <= EPS) continue;
    for (let j = 0; j <= p2Cols; j++) {
      p2Obj[j] = (p2Obj[j] ?? 0) - coeff * (row[j] ?? 0);
    }
  }

  p2Rows.push(p2Obj);
  const status = runSimplex(p2Rows, p2Basis, p2Cols);
  if (status === "unbounded") {
    return { status: "unbounded", values: new Array<number>(n).fill(0), objective: 0 };
  }

  const values = new Array<number>(n).fill(0);
  for (let r = 0; r < p2Basis.length; r++) {
    const col = p2Basis[r] ?? -1;
    const originalCol = keptCols[col];
    if (originalCol !== undefined && originalCol < n) {
      const val = p2Rows[r]?.[p2Cols] ?? 0;
      values[originalCol] = val < EPS ? 0 : val;
    }
  }

  // Validasi akhir terhadap semua batasan asli.
  for (const c of constraints) {
    let lhs = 0;
    for (let j = 0; j < n; j++) {
      lhs += (c.coeffs[j] ?? 0) * (values[j] ?? 0);
    }
    if (c.sense === "<=" && lhs > c.rhs + TOL_FEAS) {
      return { status: "infeasible", values: new Array<number>(n).fill(0), objective: 0 };
    }
    if (c.sense === ">=" && lhs < c.rhs - TOL_FEAS) {
      return { status: "infeasible", values: new Array<number>(n).fill(0), objective: 0 };
    }
    if (c.sense === "=" && Math.abs(lhs - c.rhs) > TOL_FEAS) {
      return { status: "infeasible", values: new Array<number>(n).fill(0), objective: 0 };
    }
  }

  let objective = 0;
  for (let j = 0; j < n; j++) {
    objective += (costs[j] ?? 0) * (values[j] ?? 0);
  }

  return { status: "optimal", values, objective };
}

function hitungRentangZat(
  bahanDipilih: BahanMaster[],
  zatGizi: string,
): { minTercapai: number; maxTercapai: number } {
  const isi = bahanDipilih.map((b) => ({
    kadar: b.nutrisi[zatGizi] ?? 0,
    minP: b.batasMinPersen,
    maxP: b.batasMaksPersen,
  }));

  const hitungEkstrem = (urutan: "naik" | "turun"): number => {
    const terurut = [...isi].sort((a, b) =>
      urutan === "turun" ? b.kadar - a.kadar : a.kadar - b.kadar,
    );
    let sisa = BATCH_KG;
    let total = 0;
    const pakai = terurut.map((item) => {
      const dasar = Math.min(item.minP, sisa);
      sisa -= dasar;
      total += dasar * item.kadar;
      return dasar;
    });
    for (let i = 0; i < terurut.length && sisa > EPS; i++) {
      const item = terurut[i];
      if (!item) continue;
      const ruang = Math.max(0, item.maxP - (pakai[i] ?? 0));
      const tambah = Math.min(ruang, sisa);
      sisa -= tambah;
      total += tambah * item.kadar;
    }
    return total / BATCH_KG;
  };

  return {
    minTercapai: hitungEkstrem("naik"),
    maxTercapai: hitungEkstrem("turun"),
  };
}

function bangunBatasan(
  bahanDipilih: BahanMaster[],
  kebutuhan: KebutuhanGiziItem[],
): LinearConstraint[] {
  const n = bahanDipilih.length;
  const constraints: LinearConstraint[] = [
    {
      coeffs: new Array<number>(n).fill(1),
      sense: "=",
      rhs: BATCH_KG,
    },
  ];

  for (let i = 0; i < n; i++) {
    const b = bahanDipilih[i];
    if (!b) continue;
    if (b.batasMinPersen > 0) {
      const coeffs = new Array<number>(n).fill(0);
      coeffs[i] = 1;
      constraints.push({ coeffs, sense: ">=", rhs: b.batasMinPersen });
    }
    if (b.batasMaksPersen < BATCH_KG) {
      const coeffs = new Array<number>(n).fill(0);
      coeffs[i] = 1;
      constraints.push({ coeffs, sense: "<=", rhs: b.batasMaksPersen });
    }
  }

  for (const k of kebutuhan) {
    const coeffs = bahanDipilih.map((b) => b.nutrisi[k.zatGizi] ?? 0);
    if (k.batasMin !== null) {
      constraints.push({ coeffs, sense: ">=", rhs: k.batasMin * BATCH_KG });
    }
    if (k.batasMaks !== null) {
      constraints.push({ coeffs, sense: "<=", rhs: k.batasMaks * BATCH_KG });
    }
  }

  return constraints;
}

function sarankanBahanTambahan(
  zatBermasalah: KekuranganGizi[],
  idDipilih: Set<string>,
  katalogBahan: BahanMaster[],
): SaranBahanTambahan[] {
  const kandidat = katalogBahan.filter((b) => !idDipilih.has(b.id));
  const saran: Array<SaranBahanTambahan & { skor: number }> = [];

  for (const b of kandidat) {
    const membantu: string[] = [];
    for (const z of zatBermasalah) {
      const kadar = b.nutrisi[z.zatGizi] ?? 0;
      if (z.alasan === "kurang" && kadar > z.batasTarget) {
        membantu.push(z.label);
      } else if (z.alasan === "berlebih" && kadar < z.batasTarget) {
        membantu.push(z.label);
      } else if (z.alasan === "bentrok" && kadar >= z.batasTarget) {
        membantu.push(z.label);
      }
    }
    if (membantu.length > 0) {
      saran.push({ bahanId: b.id, nama: b.nama, membantuZat: membantu, skor: membantu.length });
    }
  }

  return saran
    .sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama, "id"))
    .slice(0, 3)
    .map(({ bahanId, nama, membantuZat }) => ({ bahanId, nama, membantuZat }));
}

export interface OptimizeFeedOptions {
  request: PakanHitungRequest;
  katalogBahan: BahanMaster[];
  kebutuhanGizi: KebutuhanGiziItem[];
  catatanData: string;
  isDemo: boolean;
}

export function optimizeFeed(options: OptimizeFeedOptions): PakanHitungResult {
  const { request, katalogBahan, kebutuhanGizi, catatanData, isDemo } = options;
  const petaBahan = new Map(katalogBahan.map((b) => [b.id, b]));

  const bahanDipilih: BahanMaster[] = [];
  const hargaPerKg: number[] = [];
  const idDipilih = new Set<string>();

  for (const item of request.bahan) {
    if (idDipilih.has(item.bahanId)) continue;
    const master = petaBahan.get(item.bahanId);
    if (!master) continue;
    idDipilih.add(item.bahanId);
    bahanDipilih.push(master);
    hargaPerKg.push(item.hargaPerKg);
  }

  const targetGizi = kebutuhanGizi.filter(
    (k) => k.jenisAyam === request.jenisAyam && k.fase === request.fase,
  );

  if (bahanDipilih.length === 0 || targetGizi.length === 0) {
    return {
      status: "tak_layak",
      jenisAyam: request.jenisAyam,
      fase: request.fase,
      pesan: "Data bahan atau target gizi untuk fase ini belum tersedia.",
      zatBermasalah: [],
      saranBahan: [],
      statusSolver: "tak_layak",
      catatanData,
      isDemo,
    };
  }

  const constraints = bangunBatasan(bahanDipilih, targetGizi);
  const lp = solveLinearProgram(hargaPerKg, constraints);

  if (lp.status === "optimal") {
    const komposisi: KomposisiItem[] = bahanDipilih
      .map((b, idx) => {
        const kg = lp.values[idx] ?? 0;
        const harga = hargaPerKg[idx] ?? 0;
        return {
          bahanId: b.id,
          nama: b.nama,
          persentase: Math.round(kg * 100) / 100,
          kgPer100Kg: Math.round(kg * 100) / 100,
          hargaPerKg: harga,
          subtotalPer100Kg: Math.round(kg * harga),
        };
      })
      .filter((item) => item.kgPer100Kg > 0.005)
      .sort((a, b) => b.kgPer100Kg - a.kgPer100Kg);

    const totalBiayaPer100Kg = Math.round(lp.objective);
    const biayaPerKg = Math.round(lp.objective / BATCH_KG);

    const pemenuhanGizi: PemenuhanGiziItem[] = targetGizi.map((k) => {
      let totalZat = 0;
      for (let i = 0; i < bahanDipilih.length; i++) {
        const b = bahanDipilih[i];
        if (!b) continue;
        totalZat += (b.nutrisi[k.zatGizi] ?? 0) * (lp.values[i] ?? 0);
      }
      const nilai = Math.round((totalZat / BATCH_KG) * 100) / 100;
      const penuhiMin = k.batasMin === null || nilai >= k.batasMin - 0.01;
      const penuhiMaks = k.batasMaks === null || nilai <= k.batasMaks + 0.01;
      return {
        zatGizi: k.zatGizi,
        label: k.label,
        satuan: k.satuan,
        nilai,
        batasMin: k.batasMin,
        batasMaks: k.batasMaks,
        terpenuhi: penuhiMin && penuhiMaks,
        sumber: k.sumber,
      };
    });

    const selisihPerKg =
      request.biayaSekarangPerKg !== undefined
        ? Math.round(request.biayaSekarangPerKg - biayaPerKg)
        : undefined;

    return {
      status: "layak",
      jenisAyam: request.jenisAyam,
      fase: request.fase,
      komposisi,
      totalBiayaPer100Kg,
      biayaPerKg,
      selisihPerKg,
      pemenuhanGizi,
      statusSolver: "optimal",
      catatanData,
      isDemo,
    };
  }

  // Diagnosis penyebab tak layak secara deterministik.
  const zatBermasalah: KekuranganGizi[] = [];
  for (const k of targetGizi) {
    const { minTercapai, maxTercapai } = hitungRentangZat(bahanDipilih, k.zatGizi);
    if (k.batasMin !== null && maxTercapai < k.batasMin - 0.01) {
      zatBermasalah.push({
        zatGizi: k.zatGizi,
        label: k.label,
        satuan: k.satuan,
        alasan: "kurang",
        batasTarget: k.batasMin,
        nilaiTercapai: Math.round(maxTercapai * 100) / 100,
      });
    } else if (k.batasMaks !== null && minTercapai > k.batasMaks + 0.01) {
      zatBermasalah.push({
        zatGizi: k.zatGizi,
        label: k.label,
        satuan: k.satuan,
        alasan: "berlebih",
        batasTarget: k.batasMaks,
        nilaiTercapai: Math.round(minTercapai * 100) / 100,
      });
    }
  }

  // Bila tiap zat sendiri tampak terjangkau tetapi kombinasinya bentrok, cek relaksasi satu per satu.
  if (zatBermasalah.length === 0) {
    for (const k of targetGizi) {
      const tanpaSatu = targetGizi.filter((item) => item.zatGizi !== k.zatGizi);
      const coba = solveLinearProgram(hargaPerKg, bangunBatasan(bahanDipilih, tanpaSatu));
      if (coba.status === "optimal") {
        zatBermasalah.push({
          zatGizi: k.zatGizi,
          label: k.label,
          satuan: k.satuan,
          alasan: "bentrok",
          batasTarget: k.batasMin ?? k.batasMaks ?? 0,
        });
      }
    }
  }

  const totalBatasMaks = bahanDipilih.reduce((acc, b) => acc + b.batasMaksPersen, 0);
  const saranBahan = sarankanBahanTambahan(zatBermasalah, idDipilih, katalogBahan);

  const pesan =
    totalBatasMaks < BATCH_KG
      ? "Bahan ini belum cukup memenuhi kebutuhan gizi karena batas pemakaian maksimal bahan yang dipilih belum mencapai 100%. Tambahkan bahan pakan lain."
      : "Bahan ini belum cukup memenuhi kebutuhan gizi.";

  return {
    status: "tak_layak",
    jenisAyam: request.jenisAyam,
    fase: request.fase,
    pesan,
    zatBermasalah,
    saranBahan,
    statusSolver: "tak_layak",
    catatanData,
    isDemo,
  };
}
