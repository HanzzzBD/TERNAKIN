import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { FondasiPage } from "./pages/FondasiPage";
import { ModulSegeraPage } from "./pages/ModulSegeraPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FondasiPage />} />
        <Route path="/app" element={<FondasiPage />} />
        <Route path="/app/pakan" element={<ModulSegeraPage namaModul="Penyusun pakan" />} />
        <Route path="/app/catatan" element={<ModulSegeraPage namaModul="Catatan harian" />} />
        <Route path="/app/tanya" element={<ModulSegeraPage namaModul="Kokok" />} />
        <Route path="/app/toko" element={<ModulSegeraPage namaModul="Toko mitra" />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
