import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import {
  ReceivingInspectionNotFoundError,
} from "../../domain/ReceivingInspectionErrors";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { CompleteReceivingInspectionInput } from "../dto/CompleteReceivingInspectionInput";
import { CompleteReceivingInspectionResult } from "../dto/CompleteReceivingInspectionResult";
import { InspectionFlowPolicy } from "../ports/InspectionFlowPolicy";
import { assertReceivingInspectionActorAllowed } from "./ReceivingInspectionAuthorization";
import {
  InspectionFlowNotEnabledError,
  PurchaseOrderNotFoundError,
  PurchaseOrderNotInspectableError,
} from "./ReceivingInspectionApplicationErrors";

export class CompleteReceivingInspection {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly receivingInspectionRepository: ReceivingInspectionRepository,
    private readonly inspectionFlowPolicy: InspectionFlowPolicy,
  ) { }

  async execute(
    input: CompleteReceivingInspectionInput,
  ): Promise<CompleteReceivingInspectionResult> {
    assertReceivingInspectionActorAllowed(input.actor);

    const inspection = await this.receivingInspectionRepository.findById(
      input.receivingInspectionId,
    );

    if (!inspection) {
      throw new ReceivingInspectionNotFoundError();
    }

    const inspectionFlowEnabled =
      await this.inspectionFlowPolicy.isEnabledForPurchaseOrder(
        inspection.purchaseOrderId,
      );

    if (!inspectionFlowEnabled) {
      throw new InspectionFlowNotEnabledError();
    }

    const purchaseOrder = await this.purchaseOrderRepository.findById(
      inspection.purchaseOrderId,
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError();
    }

    if (purchaseOrder.status !== "CREATED") {
      throw new PurchaseOrderNotInspectableError();
    }

    inspection.complete({
      completedAt: input.completedAt,
      completedBy: input.actor.actorId,
      items: input.items,
    });

    await this.receivingInspectionRepository.save(inspection);

    return {
      receivingInspectionId: inspection.id,
      purchaseOrderId: inspection.purchaseOrderId,
      status: "COMPLETED",
      completedAt: input.completedAt,
      completedBy: input.actor.actorId,
      items: inspection.items.map((item) => ({
        purchaseItemId: item.purchaseItemId,
        expectedQuantity: item.expectedQuantity,
        acceptedQuantity: item.acceptedQuantity,
        quarantinedQuantity: item.quarantinedQuantity,
        rejectedQuantity: item.rejectedQuantity,
      })),
    };
  }
}