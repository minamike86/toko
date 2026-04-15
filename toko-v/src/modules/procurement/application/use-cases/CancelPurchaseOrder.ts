import { NotFoundError } from "@/shared/errors/ApplicationError";
import { AuthorizationGuard } from "@/shared/system/application/AuthorizationGuard";
import type { ActorContext } from "@/shared/system/types/actor-context";

import { PurchaseOrderRepository } from "@/modules/procurement/domain/PurchaseOrderRepository";

export type CancelPurchaseOrderInput = {
  purchaseOrderId: string;
  actor: ActorContext;
};

export type CancelPurchaseOrderResult = {
  purchaseOrderId: string;
  status: string;
  canceledAt: Date;
  canceledBy: string;
};

type Deps = {
  purchaseOrderRepo: PurchaseOrderRepository;
};

export class CancelPurchaseOrder {
  constructor(private readonly deps: Deps) { }

  async execute(
    input: CancelPurchaseOrderInput,
  ): Promise<CancelPurchaseOrderResult> {
    const actor = AuthorizationGuard.assertAuthorized(input.actor, ["ADMIN"]);

    const purchaseOrder =
      await this.deps.purchaseOrderRepo.findById(input.purchaseOrderId);

    if (!purchaseOrder) {
      throw new NotFoundError("PurchaseOrder", input.purchaseOrderId);
    }

    const canceledAt = new Date();

    purchaseOrder.cancel({
      canceledAt,
      canceledBy: actor.actorId,
    });

    await this.deps.purchaseOrderRepo.save(purchaseOrder);

    return {
      purchaseOrderId: purchaseOrder.id,
      status: purchaseOrder.status,
      canceledAt: purchaseOrder.canceledAt!,
      canceledBy: purchaseOrder.canceledBy!,
    };
  }
}