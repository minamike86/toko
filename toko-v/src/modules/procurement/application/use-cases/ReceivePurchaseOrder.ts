import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { ReceivePurchaseOrderInput } from "../dto/ReceivePurchaseOrderInput";
import { InventoryProcurementPort } from "../ports/InventoryProcurementPort";
import { PurchaseOrderDto } from "../dto/PurchaseOrderDto";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";
import { NotFoundError } from "@/shared/errors/ApplicationError";

const PROCUREMENT_ALLOWED_ROLES = {
  ADMIN: "ADMIN",
  WAREHOUSE: "WAREHOUSE",
} as const;

export class ReceivePurchaseOrder {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly inventoryPort: InventoryProcurementPort,
  ) {}

  async execute(
    input: ReceivePurchaseOrderInput,
    actor: ActorContext,
  ): Promise<PurchaseOrderDto> {
    AuthorizationGuard.assertActorExists(actor);
    AuthorizationGuard.assertRole(actor, [
      PROCUREMENT_ALLOWED_ROLES.ADMIN,
      PROCUREMENT_ALLOWED_ROLES.WAREHOUSE,
    ]);

    const order = await this.purchaseOrderRepository.findById(
      input.purchaseOrderId,
    );

    if (!order) {
      throw new NotFoundError("PurchaseOrder", input.purchaseOrderId);
    }

    order.assertCanBeReceived();

    await this.inventoryPort.receivePurchaseStock(
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
}
