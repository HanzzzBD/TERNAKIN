import { optimizeFeed, type OptimizeFeedOptions, type PakanHitungResult } from "@ternakin/shared";

/**
 * Menjalankan solver LP di Web Worker agar antarmuka tidak tersendat pada ponsel murah,
 * dengan fallback langsung saat Worker tidak tersedia (misalnya di lingkungan tes jsdom).
 */
export function runFeedSolver(options: OptimizeFeedOptions): Promise<PakanHitungResult> {
  if (typeof Worker === "undefined") {
    return Promise.resolve(optimizeFeed(options));
  }

  return new Promise((resolve) => {
    try {
      const worker = new Worker(new URL("../workers/solver.worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (event: MessageEvent<PakanHitungResult>) => {
        worker.terminate();
        resolve(event.data);
      };

      worker.onerror = () => {
        worker.terminate();
        resolve(optimizeFeed(options));
      };

      worker.postMessage(options);
    } catch {
      resolve(optimizeFeed(options));
    }
  });
}
