import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/fondasi.css";
import { initMotionPreference } from "./lib/motion";
import { App } from "./App";

initMotionPreference();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Elemen #root tidak ditemukan.");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
