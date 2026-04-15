import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderDto } from "../dto/PurchaseOrderDto";
import { ReceivePurchaseOrderInput } from "../dto/ReceivePurchaseOrderInput";
import { InventoryProcurementPort } from "../ports/InventoryProcurementPort";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { UserRole } from "@/modules/user/domain/UserRole";



function toDto(order: PurchaseOrder): PurchaseOrderDto {
  return {
    id: order.id,
    supplierId: order.supplierId,
    status: order.status,
    createdAt: order.createdAt,
    createdBy: order.createdBy,
    receivedAt: order.receivedAt,
    receivedBy: order.receivedBy,
    canceledAt: order.canceledAt,
    canceledBy: order.canceledBy,
    totalQuantity: order.totalQuantity,
    totalCost: order.totalCost,
    items: order.items.map((item) => ({
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      productId: item.productId,
      variantId: item.variantId,
      productNameSnapshot: item.productNameSnapshot,
      variantNameSnapshot: item.variantNameSnapshot,
      unitSnapshot: item.unitSnapshot,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotalCost: item.subtotalCost,
    })),
  };
}

export class ReceivePurchaseOrder {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly inventoryProcurementPort: InventoryProcurementPort,
  ) { }

  async execute(
    input: ReceivePurchaseOrderInput,
    actorParam: ActorContext,
  ): Promise<PurchaseOrderDto> {
    const actor = AuthorizationGuard.assertAuthorized(actorParam, [
      UserRole.ADMIN,
      UserRole.WAREHOUSE,
    ]);

    const order = await this.purchaseOrderRepository.findById(
      input.purchaseOrderId,
    );

    if (!order) {
      throw new NotFoundError("PurchaseOrder", input.purchaseOrderId);
    }

    order.assertCanBeReceived();

    // CRITICAL CONTRACT:
    // inventory dieksekusi dulu
    // flow non-atomic
    // bila inventory sukses tapi save gagal, stok tetap bertambah
    await this.inventoryProcurementPort.receivePurchaseStock(
      order.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        reason: "PURCHASE_RECEIVE",
        referenceId: order.id,
      })),
    );

    order.receive({
      receivedAt: input.receivedAt ?? new Date(),
      receivedBy: actor.actorId,
    });

    await this.purchaseOrderRepository.save(order);

    return toDto(order);
  }
}