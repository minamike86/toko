import { PurchaseItem } from "@/modules/procurement/domain/PurchaseItem";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { SupplierRepository } from "@/modules/procurement/domain/SupplierRepository";
import { CreatePurchaseOrderInput } from "../dto/CreatePurchaseOrderInput";
import { PurchaseOrderDto } from "../dto/PurchaseOrderDto";
import { CatalogSnapshotPort } from "../ports/CatalogSnapshotPort";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/ApplicationError";
import { ActorContext } from "@/shared/system/types/actor-context";

const PROCUREMENT_ALLOWED_ROLES = {
  ADMIN: "ADMIN",
  WAREHOUSE: "WAREHOUSE",
} as const;

export class CreatePurchaseOrder {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly catalogSnapshotPort: CatalogSnapshotPort,
  ) { }

  async execute(
    input: CreatePurchaseOrderInput,
    actor: ActorContext,
  ): Promise<PurchaseOrderDto> {
    AuthorizationGuard.assertActorExists(actor);
    AuthorizationGuard.assertRole(actor, [
      PROCUREMENT_ALLOWED_ROLES.ADMIN,
      PROCUREMENT_ALLOWED_ROLES.WAREHOUSE,
    ]);

    if (input.items.length === 0) {
      throw new ValidationError("PURCHASE_ORDER_ITEMS_EMPTY");
    }

    const supplier = await this.supplierRepository.findById(input.supplierId);

    if (!supplier) {
      throw new NotFoundError("Supplier", input.supplierId);
    }

    supplier.assertCanBeUsedForNewPurchaseOrder();

    const variantIds = input.items.map((item) => item.variantId);
    const uniqueVariantIds = [...new Set(variantIds)];

    if (uniqueVariantIds.length !== variantIds.length) {
      throw new ConflictError("DUPLICATE_PURCHASE_ORDER_VARIANT");
    }

    const snapshots =
      await this.catalogSnapshotPort.getVariantsByIds(uniqueVariantIds);

    const snapshotMap = new Map(
      snapshots.map((snapshot) => [snapshot.variantId, snapshot]),
    );

    for (const item of input.items) {
      const snapshot = snapshotMap.get(item.variantId);

      if (!snapshot) {
        throw new NotFoundError("CatalogVariant", item.variantId);
      }

      if (!snapshot.isActive) {
        throw new ConflictError("CATALOG_VARIANT_INACTIVE");
      }
    }

    const purchaseOrderId = this.purchaseOrderRepository.nextId();

    const purchaseItems = input.items.map((item) => {
      const snapshot = snapshotMap.get(item.variantId);

      if (!snapshot) {
        throw new NotFoundError("CatalogVariant", item.variantId);
      }

      return PurchaseItem.create({
        id: this.purchaseOrderRepository.nextItemId(),
        purchaseOrderId,
        productId: snapshot.productId,
        variantId: snapshot.variantId,
        productNameSnapshot: snapshot.productName,
        variantNameSnapshot: snapshot.variantName,
        unitSnapshot: snapshot.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
      });
    });

    const order = PurchaseOrder.create({
      id: purchaseOrderId,
      supplierId: supplier.id,
      items: purchaseItems,
      createdAt: new Date(),
      createdBy: actor.actorId,
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