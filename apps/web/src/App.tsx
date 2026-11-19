import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { FondasiPage } from "./pages/FondasiPage";
import { ModulSegeraPage } from "./pages/ModulSegeraPage";
import { PakanPage } from "./pages/PakanPage";

// Halaman /dev/komponen hanya dimuat saat pengembangan; dihapus otomatis dari build produksi.
const DevKomponenPage = import.meta.env.DEV ? lazy(() => import("./pages/dev/KomponenPage")) : null;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FondasiPage />} />
        <Route path="/app" element={<FondasiPage />} />
        <Route path="/app/pakan" element={<PakanPage />} />
        <Route path="/app/catatan" element={<ModulSegeraPage namaModul="Catatan harian" />} />
        <Route path="/app/tanya" element={<ModulSegeraPage namaModul="Kokok" />} />
        <Route path="/app/toko" element={<ModulSegeraPage namaModul="Toko mitra" />} />
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
