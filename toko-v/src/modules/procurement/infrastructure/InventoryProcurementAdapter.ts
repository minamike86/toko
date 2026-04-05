import { InventoryProcurementPort, ReceiveProcurementStockRequest } from "@/modules/procurement/application/ports/InventoryProcurementPort";
import { ReceivePurchaseStock } from "@/modules/inventory/application/ReceivePurchaseStock";
import { ActorContext } from "@/shared/system/types/actor-context";

export class InventoryProcurementAdapter implements InventoryProcurementPort {
  constructor(
    private readonly receivePurchaseStockUseCase: ReceivePurchaseStock,
    private readonly actor: ActorContext,
  ) {}

  async receivePurchaseStock(
    requests: ReceiveProcurementStockRequest[],
  ): Promise<void> {
    await this.receivePurchaseStockUseCase.execute(
      requests.map((req) => ({
        ...req,
        actor: this.actor,
      })),
    );
  }
}
