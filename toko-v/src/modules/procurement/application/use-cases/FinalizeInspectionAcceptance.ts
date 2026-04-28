import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import {
  ReceivingInspectionNotFoundError,
  ReceivingInspectionStatusInvalidError,
} from "../../domain/ReceivingInspectionErrors";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { FinalizeInspectionAcceptanceInput } from "../dto/FinalizeInspectionAcceptanceInput";
import { FinalizeInspectionAcceptanceResult } from "../dto/FinalizeInspectionAcceptanceResult";
import { InspectionFlowPolicy } from "../ports/InspectionFlowPolicy";
import { InventoryInspectionAcceptancePort } from "../ports/InventoryInspectionAcceptancePort";
import { NonAcceptedInspectionResolutionQuery } from "../ports/NonAcceptedInspectionResolutionQuery";
import { TransactionRunner } from "../ports/TransactionRunner";
import { assertReceivingInspectionActorAllowed } from "./ReceivingInspectionAuthorization";
import {
  FinalAcceptanceBlockedByPendingRejectionError,
  FinalAcceptanceBlockedByQuarantineError,
  FinalAcceptanceResolutionNotVerifiedError,
  InspectionFlowNotEnabledError,
  PurchaseOrderNotFinalizableError,
  PurchaseOrderNotFoundError,
} from "./ReceivingInspectionApplicationErrors";

export class FinalizeInspectionAcceptance {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly receivingInspectionRepository: ReceivingInspectionRepository,
    private readonly inspectionFlowPolicy: InspectionFlowPolicy,
    private readonly inventoryInspectionAcceptancePort: InventoryInspectionAcceptancePort,
    private readonly nonAcceptedInspectionResolutionQuery: NonAcceptedInspectionResolutionQuery,
    private readonly transactionRunner: TransactionRunner,
  ) { }

  async execute(
    input: FinalizeInspectionAcceptanceInput,
  ): Promise<FinalizeInspectionAcceptanceResult> {
    assertReceivingInspectionActorAllowed(input.actor);

    const inspection = await this.receivingInspectionRepository.findById(
      input.receivingInspectionId,
    );

    if (!inspection) {
      throw new ReceivingInspectionNotFoundError();
    }

    if (inspection.status !== "COMPLETED") {
      throw new ReceivingInspectionStatusInvalidError(
        "only COMPLETED inspection can be finalized",
      );
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
      throw new PurchaseOrderNotFinalizableError();
    }

    if (inspection.hasQuarantine()) {
      throw new FinalAcceptanceBlockedByQuarantineError();
    }

    if (inspection.hasRejectedQuantity()) {
      const resolved = await this.nonAcceptedInspectionResolutionQuery.isResolved({
        receivingInspectionId: inspection.id,
      });

      if (!resolved) {
        throw new FinalAcceptanceBlockedByPendingRejectionError();
      }
    }

    const acceptedItems = inspection.acceptedItems();

    await this.transactionRunner.runInTransaction(async (transaction) => {
      await this.inventoryInspectionAcceptancePort.receiveAcceptedItems(
        {
          purchaseOrderId: inspection.purchaseOrderId,
          items: acceptedItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.acceptedQuantity,
            purchaseOrderId: inspection.purchaseOrderId,
          })),
        },
        transaction,
      );

      purchaseOrder.receive({
        receivedAt: input.finalizedAt,
        receivedBy: input.actor.actorId,
      });

      await this.purchaseOrderRepository.save(purchaseOrder);
    });


    return {
      receivingInspectionId: inspection.id,
      purchaseOrderId: inspection.purchaseOrderId,
      purchaseOrderStatus: "RECEIVED",
      acceptedItems,
      finalizedAt: input.finalizedAt,
      finalizedBy: input.actor.actorId,
    };
  }
}