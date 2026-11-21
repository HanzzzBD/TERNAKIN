// Diimpor PERTAMA di server.ts: import ES dijalankan lebih dulu, jadi env harus dimuat
// sebagai efek samping import, sebelum modul lain (mis. logger) membaca process.env.
import { muatEnv } from "./muatEnv.js";

muatEnv();
