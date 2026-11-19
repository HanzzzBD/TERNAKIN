import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { FondasiPage } from "./pages/FondasiPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FondasiPage />} />
        <Route path="/app" element={<FondasiPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
