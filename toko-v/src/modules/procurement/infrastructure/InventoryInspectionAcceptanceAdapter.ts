import {
  InventoryInspectionAcceptancePort,
  ReceiveAcceptedInspectionInput,
} from "../application/ports/InventoryInspectionAcceptancePort";
import { TransactionContext } from "../application/ports/TransactionRunner";
import { InventoryProcurementPort } from "../application/ports/InventoryProcurementPort";

export class InventoryInspectionAcceptanceAdapter
  implements InventoryInspectionAcceptancePort {
  constructor(
    private readonly inventoryProcurementPort: InventoryProcurementPort,
  ) { }

  async receiveAcceptedItems(
    input: ReceiveAcceptedInspectionInput,
    _transaction: TransactionContext,
  ): Promise<void> {
    await this.inventoryProcurementPort.receiveProcurementStock({
      items: input.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        reason: "PROCUREMENT_RECEIVE",
        referenceId: input.purchaseOrderId,
      })),
    });
  }
}