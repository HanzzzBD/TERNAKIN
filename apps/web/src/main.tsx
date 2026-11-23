import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./components/ui/ui.css";
import "./components/layout/AppShell.css";
import { captureSrcParam } from "./db/db";
import { startSyncListeners } from "./db/sync";
import { muatAkun } from "./lib/akun";
import { initMotionPreference } from "./lib/motion";
import { pasangPenjagaSesi } from "./lib/penjagaSesi";
import { App } from "./App";

// Dipasang sebelum pemanggilan API pertama (sinkron dan muatAkun).
pasangPenjagaSesi();
initMotionPreference();
captureSrcParam();
startSyncListeners();
void muatAkun();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemen #root tidak ditemukan.");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
