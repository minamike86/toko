import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";

import { OrderRepository } from "../domain/OrderRepository";
import { OrderStatus } from "../domain/OrderStatus";

import {
  InventoryService,
} from "@/modules/inventory/application/InventoryService";

import { AuditTrail } from "@/shared/audit/AuditTrail";
import { Logger } from "@/shared/logging/Logger";

/**
 * ======================
 * Types
 * ======================
 */

export type CancelOrderInput = {
  orderId: string;
  canceledBy: string; // metadata audit, disiapkan
};

export type CancelOrderResult = {
  orderId: string;
  status: string;
};

type Deps = {
  orderRepo: OrderRepository;
  inventoryService: InventoryService;
  auditTrail?: AuditTrail;
  logger?: Logger; // OPTIONAL
};

/**
 * ======================
 * Use Case
 * ======================
 */


export class CancelOrder {
  constructor(private readonly deps: Deps) {}

  async execute(input: CancelOrderInput): Promise<CancelOrderResult> {
    const useCaseName = "CancelOrder";
    const orderId = EntityId.of(input.orderId);

    this.safeLog("info", "use case started", {
      useCase: useCaseName,
      entity: "Order",
      entityId: orderId.toString(),
      actorId: input.canceledBy,
    });

    const order = await this.deps.orderRepo.findById(orderId);
    if (!order) {
      this.safeLog("warn", "order not found", {
        useCase: useCaseName,
        entity: "Order",
        entityId: orderId.toString(),
      });
      throw new NotFoundError("Order", orderId.toString());
    }

    const previousStatus = order.getStatus();

    order.cancel();
    await this.deps.orderRepo.save(order);

    if (
      previousStatus === OrderStatus.PAID ||
      previousStatus === OrderStatus.ON_CREDIT
    ) {
      await this.deps.inventoryService.returnStock(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity.get(),
          reason: "CANCEL_ORDER",
          referenceId: order.id.toString(),
        }))
      );
    }

    // Audit side effect
    try {
      await this.deps.auditTrail?.record({
        action: "ORDER_CANCELED",
        entity: "Order",
        entityId: order.id.toString(),
        metadata: {
          previousStatus,
          canceledBy: input.canceledBy,
        },
        occurredAt: new Date(),
      });
    } catch {
      // ignored
    }

    this.safeLog("info", "use case succeeded", {
      useCase: useCaseName,
      entity: "Order",
      entityId: order.id.toString(),
      actorId: input.canceledBy,
    });

    return {
      orderId: order.id.toString(),
      status: order.getStatus(),
    };
  }

  /**
   * ======================
   * Logging helper (NON-BLOCKING)
   * ======================
   */
  private safeLog(
    level: "info" | "warn" | "error",
    message: string,
    context: Record<string, string | undefined>
  ) {
    try {
      this.deps.logger?.[level](message, context);
    } catch {
      // logging failure MUST NOT break business flow
    }
  }
}