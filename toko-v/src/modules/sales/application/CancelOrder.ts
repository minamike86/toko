import { EntityId } from "@/shared/value-objects/EntityId";
import { NotFoundError } from "@/shared/errors/ApplicationError";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import { ActorContext } from "@/shared/system/types/actor-context";

import { OrderRepository } from "../domain/OrderRepository";
import { OrderStatus } from "../domain/OrderStatus";

import { InventoryService } from "@/modules/inventory/application/InventoryService";

import { AuditTrail } from "@/shared/audit/AuditTrail";
import { Logger } from "@/shared/logging/Logger";

export type CancelOrderInput = {
  orderId: string;
  actor: ActorContext;
};

export type CancelOrderResult = {
  orderId: string;
  status: string;
};

type Deps = {
  orderRepo: OrderRepository;
  inventoryService: InventoryService;
  auditTrail?: AuditTrail;
  logger?: Logger;
};

export class CancelOrder {
  constructor(private readonly deps: Deps) { }

  async execute(input: CancelOrderInput): Promise<CancelOrderResult> {
    const actor = AuthorizationGuard.assertAuthorized(input.actor, ["ADMIN", "SALES"]);

    const useCaseName = "CancelOrder";
    const orderId = EntityId.of(input.orderId);

    this.safeLog("info", "use case started", {
      useCase: useCaseName,
      entity: "Order",
      entityId: orderId.toString(),
      actorId: actor.actorId,
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
          variantId: item.variantId.toString(),
          quantity: item.quantity.get(),
          reason: "CANCEL_ORDER",
          referenceId: order.id.toString(),
        })),
      );
    }

    try {
      await this.deps.auditTrail?.record({
        action: "ORDER_CANCELED",
        entity: "Order",
        entityId: order.id.toString(),
        metadata: {
          previousStatus,
          actorId: actor.actorId,
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
      actorId: actor.actorId,
    });

    return {
      orderId: order.id.toString(),
      status: order.getStatus(),
    };
  }

  private safeLog(
    level: "info" | "warn" | "error",
    message: string,
    context: Record<string, string | undefined>,
  ) {
    try {
      this.deps.logger?.[level](message, context);
    } catch {
      // logging failure MUST NOT break business flow
    }
  }
}