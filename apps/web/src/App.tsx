import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { CatatanPage } from "./pages/CatatanPage";
import { FondasiPage } from "./pages/FondasiPage";
import { KokokPage } from "./pages/KokokPage";
import { LandingPage } from "./pages/LandingPage";
import { PakanPage } from "./pages/PakanPage";
import { PrivasiPage } from "./pages/PrivasiPage";
import { ProfilPage } from "./pages/ProfilPage";
import { TokoPage } from "./pages/TokoPage";

// Halaman /dev/komponen hanya dimuat saat pengembangan; dihapus otomatis dari build produksi.
const DevKomponenPage = import.meta.env.DEV ? lazy(() => import("./pages/dev/KomponenPage")) : null;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privasi" element={<PrivasiPage />} />
        <Route path="/app" element={<FondasiPage />} />
        <Route path="/app/pakan" element={<PakanPage />} />
        <Route path="/app/catatan" element={<CatatanPage />} />
        <Route path="/app/profil" element={<ProfilPage />} />
        <Route path="/app/tanya" element={<KokokPage />} />
        <Route path="/app/toko" element={<TokoPage />} />
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
