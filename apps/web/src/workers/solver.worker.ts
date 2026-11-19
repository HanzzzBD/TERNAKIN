import { optimizeFeed, type OptimizeFeedOptions, type PakanHitungResult } from "@ternakin/shared";

self.onmessage = (event: MessageEvent<OptimizeFeedOptions>) => {
  const hasil: PakanHitungResult = optimizeFeed(event.data);
  self.postMessage(hasil);
};
