import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./components/ui/ui.css";
import "./components/layout/AppShell.css";
import { captureSrcParam } from "./db/db";
import { startSyncListeners } from "./db/sync";
import { initMotionPreference } from "./lib/motion";
import { App } from "./App";

initMotionPreference();
captureSrcParam();
startSyncListeners();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemen #root tidak ditemukan.");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
