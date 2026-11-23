import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { KhususPeternak } from "./components/akun/KhususPeternak";
import { WajibMasuk } from "./components/akun/WajibMasuk";
import { captureSrcParam } from "./db/db";
import { CatatanPage } from "./pages/CatatanPage";
import { FondasiPage } from "./pages/FondasiPage";
import { InvestasiDetailPage } from "./pages/InvestasiDetailPage";
import { InvestasiPage } from "./pages/InvestasiPage";
import { KokokPage } from "./pages/KokokPage";
import { LandingPage } from "./pages/LandingPage";
import { MasukPage } from "./pages/MasukPage";
import { PakanPage } from "./pages/PakanPage";
import { PeternakPage } from "./pages/PeternakPage";
import { PrivasiPage } from "./pages/PrivasiPage";
import { ProfilPage } from "./pages/ProfilPage";
import { TokoPage } from "./pages/TokoPage";

// Halaman /dev/komponen hanya dimuat saat pengembangan; dihapus otomatis dari build produksi.
const DevKomponenPage = import.meta.env.DEV ? lazy(() => import("./pages/dev/KomponenPage")) : null;

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    captureSrcParam();
    if (typeof window !== "undefined" && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location.pathname, location.search, location.hash]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privasi" element={<PrivasiPage />} />
        <Route path="/app/masuk" element={<MasukPage />} />
        {/* Semua fitur aplikasi wajib masuk; tamu dialihkan ke /app/masuk?lanjut=... */}
        <Route element={<WajibMasuk />}>
          <Route
            path="/app"
            element={
              <KhususPeternak alihkanPengguna>
                <FondasiPage />
              </KhususPeternak>
            }
          />
          <Route
            path="/app/pakan"
            element={
              <KhususPeternak>
                <PakanPage />
              </KhususPeternak>
            }
          />
          <Route
            path="/app/catatan"
            element={
              <KhususPeternak>
                <CatatanPage />
              </KhususPeternak>
            }
          />
          <Route path="/app/profil" element={<ProfilPage />} />
          <Route path="/app/tanya" element={<KokokPage />} />
          <Route
            path="/app/toko"
            element={
              <KhususPeternak>
                <TokoPage />
              </KhususPeternak>
            }
          />
          <Route path="/app/investasi" element={<InvestasiPage />} />
          <Route path="/app/investasi/:id" element={<InvestasiDetailPage />} />
          <Route path="/app/peternak" element={<PeternakPage />} />
        </Route>
        {DevKomponenPage && (
          <Route
            path="/dev/komponen"
            element={
              <Suspense fallback={null}>
                <DevKomponenPage />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
