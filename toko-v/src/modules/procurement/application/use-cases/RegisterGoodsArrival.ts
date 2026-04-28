import { randomUUID } from "crypto";
import { PurchaseOrderRepository } from "../../domain/PurchaseOrderRepository";
import { ReceivingInspection } from "../../domain/ReceivingInspection";
import { ReceivingInspectionItem } from "../../domain/ReceivingInspectionItem";
import { ReceivingInspectionRepository } from "../../domain/ReceivingInspectionRepository";
import { RegisterGoodsArrivalInput } from "../dto/RegisterGoodsArrivalInput";
import { RegisterGoodsArrivalResult } from "../dto/RegisterGoodsArrivalResult";
import { InspectionFlowPolicy } from "../ports/InspectionFlowPolicy";
import { assertReceivingInspectionActorAllowed } from "./ReceivingInspectionAuthorization";
import {
  InspectionFlowNotEnabledError,
  PurchaseOrderNotFoundError,
  PurchaseOrderNotInspectableError,
} from "./ReceivingInspectionApplicationErrors";
import { ReceivingInspectionAlreadyExistsError } from "../../domain/ReceivingInspectionErrors";

export class RegisterGoodsArrival {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly receivingInspectionRepository: ReceivingInspectionRepository,
    private readonly inspectionFlowPolicy: InspectionFlowPolicy,
  ) { }

  async execute(input: RegisterGoodsArrivalInput): Promise<RegisterGoodsArrivalResult> {
    assertReceivingInspectionActorAllowed(input.actor);

    const inspectionFlowEnabled =
      await this.inspectionFlowPolicy.isEnabledForPurchaseOrder(input.purchaseOrderId);

    if (!inspectionFlowEnabled) {
      throw new InspectionFlowNotEnabledError();
    }

    const purchaseOrder = await this.purchaseOrderRepository.findById(
      input.purchaseOrderId,
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFoundError();
    }

    if (purchaseOrder.status !== "CREATED") {
      throw new PurchaseOrderNotInspectableError();
    }

    const existingInspection =
      await this.receivingInspectionRepository.findByPurchaseOrderId(
        input.purchaseOrderId,
      );

    if (existingInspection) {
      throw new ReceivingInspectionAlreadyExistsError();
    }

    const inspectionItems = purchaseOrder.items.map((item) =>
      ReceivingInspectionItem.create({
        purchaseItemId: item.id,
        variantId: item.variantId,
        expectedQuantity: item.quantity,
      }),
    );

    const inspection = ReceivingInspection.create({
      id: randomUUID(),
      purchaseOrderId: purchaseOrder.id,
      arrivedAt: input.arrivedAt,
      arrivedBy: input.actor.actorId,
      notes: input.notes,
      items: inspectionItems,
    });

    await this.receivingInspectionRepository.save(inspection);

    return {
      receivingInspectionId: inspection.id,
      purchaseOrderId: inspection.purchaseOrderId,
      status: "ARRIVED",
      arrivedAt: inspection.arrivedAt,
      arrivedBy: inspection.arrivedBy,
    };
  }
}