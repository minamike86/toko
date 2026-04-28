import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import {
  ReceivingInspectionNotFoundError,
} from "../../domain/ReceivingInspectionErrors";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { StartReceivingInspectionInput } from "../dto/StartReceivingInspectionInput";
import { StartReceivingInspectionResult } from "../dto/StartReceivingInspectionResult";
import { InspectionFlowPolicy } from "../ports/InspectionFlowPolicy";
import { assertReceivingInspectionActorAllowed } from "./ReceivingInspectionAuthorization";
import {
  InspectionFlowNotEnabledError,
  PurchaseOrderNotFoundError,
  PurchaseOrderNotInspectableError,
} from "./ReceivingInspectionApplicationErrors";

export class StartReceivingInspection {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly receivingInspectionRepository: ReceivingInspectionRepository,
    private readonly inspectionFlowPolicy: InspectionFlowPolicy,
  ) { }

  async execute(
    input: StartReceivingInspectionInput,
  ): Promise<StartReceivingInspectionResult> {
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

    inspection.start(input.startedAt, input.actor.actorId);

    await this.receivingInspectionRepository.save(inspection);

    return {
      receivingInspectionId: inspection.id,
      purchaseOrderId: inspection.purchaseOrderId,
      status: "UNDER_INSPECTION",
      startedAt: input.startedAt,
      startedBy: input.actor.actorId,
    };
  }
}