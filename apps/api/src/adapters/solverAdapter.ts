import { optimizeFeed, type PakanHitungRequest, type PakanHitungResult } from "@ternakin/shared";
import { getReferensiData, type DatabaseContext } from "../db/database.js";
import type { SolverAdapter } from "./types.js";

export class SharedSolverAdapter implements SolverAdapter {
  constructor(
    private readonly dbCtx: DatabaseContext,
    private readonly staleDays: number,
  ) {}

  async optimize(request: PakanHitungRequest): Promise<PakanHitungResult> {
    const ref = getReferensiData(this.dbCtx, this.staleDays);
    return optimizeFeed({
      request,
      katalogBahan: ref.bahan,
      kebutuhanGizi: ref.kebutuhanGizi,
      catatanData: ref.catatanData,
      isDemo: ref.isDemo,
    });
  }
}
