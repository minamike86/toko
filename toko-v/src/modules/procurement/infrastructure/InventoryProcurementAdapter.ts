import type {
  InventoryProcurementPort,
  ReceiveProcurementStockInput,
} from "@/modules/procurement/application/ports/InventoryProcurementPort";
import {
  ReceiveStock,
  type ReceiveStockRequest,
} from "@/modules/inventory/application/ReceiveStock";
import type { ActorContext } from "@/shared/system/types/actor-context";

export class InventoryProcurementAdapter implements InventoryProcurementPort {
  constructor(
    private readonly receiveStockUseCase: ReceiveStock,
    private readonly defaultActor: ActorContext,
  ) { }

  async receiveProcurementStock(
    input: ReceiveProcurementStockInput,
  ): Promise<void> {
    for (const item of input.items) {
      const request: ReceiveStockRequest = {
        variantId: item.variantId,
        quantity: item.quantity,
        reason: item.reason,
        referenceId: item.referenceId,
      };

      await this.receiveStockUseCase.execute(request, this.defaultActor);
    }
  }
}