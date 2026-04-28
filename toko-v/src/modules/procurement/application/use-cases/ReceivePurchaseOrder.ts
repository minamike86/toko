import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";
import { PurchaseOrder } from "@/modules/procurement/domain/PurchaseOrder";
import { PurchaseOrderDto } from "../dto/PurchaseOrderDto";
import { ReceivePurchaseOrderInput } from "../dto/ReceivePurchaseOrderInput";
import {
  InventoryProcurementPort,
  ReceiveProcurementStockInput,
  ReceiveProcurementStockItem,
} from "../ports/InventoryProcurementPort";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { UserRole } from "@/modules/user/domain/UserRole";
import type {
  NormalizeProcurementItemInput,
  NormalizeProcurementItemResult,
} from "@/shared/application/unit-normalization/procurement-unit-normalization.types";
import type { ProcurementUnitNormalizationPort } from "@/shared/application/unit-normalization/procurement-unit-normalization.port";

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
    totalTransactionQuantity: order.totalQuantity,
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

function toNormalizationInput(
  purchaseOrderId: string,
  item: PurchaseOrder["items"][number],
): NormalizeProcurementItemInput {
  return {
    variantId: item.variantId,
    transactionUnit: item.unitSnapshot,
    transactionQuantity: item.quantity,
    referenceId: purchaseOrderId,
  };
}

function toReceiveProcurementStockItem(
  item: NormalizeProcurementItemResult,
): ReceiveProcurementStockItem {
  return {
    variantId: item.variantId,
    quantity: item.canonicalQuantity,
    reason: "PROCUREMENT_RECEIVE",
    referenceId: item.referenceId,
  };
}

function toReceiveProcurementStockInput(
  items: ReadonlyArray<NormalizeProcurementItemResult>,
): ReceiveProcurementStockInput {
  return {
    items: items.map(toReceiveProcurementStockItem),
  };
}

export class ReceivePurchaseOrder {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly normalizationPort: ProcurementUnitNormalizationPort,
    private readonly inventoryProcurementPort: InventoryProcurementPort,
  ) { }

  async execute(input: ReceivePurchaseOrderInput): Promise<PurchaseOrderDto> {
    const actor = AuthorizationGuard.assertAuthorized(input.actor, [
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

    const normalizedItems: NormalizeProcurementItemResult[] = [];

    for (const item of order.items) {
      const normalizedItem = await this.normalizationPort.normalizeProcurementItem(
        toNormalizationInput(order.id, item),
      );

      normalizedItems.push(normalizedItem);
    }

    await this.inventoryProcurementPort.receiveProcurementStock(
      toReceiveProcurementStockInput(normalizedItems),
    );

    order.receive({
      receivedAt: input.receivedAt ?? new Date(),
      receivedBy: actor.actorId,
    });

    await this.purchaseOrderRepository.save(order);

    return toDto(order);
  }
}