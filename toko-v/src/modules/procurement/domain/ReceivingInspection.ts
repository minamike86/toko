import {
  ReceivingInspectionItem,
  ReceivingInspectionItemSnapshot,
  RecordInspectionResultInput,
} from "./ReceivingInspectionItem";
import {
  ReceivingInspectionItemNotFoundError,
  ReceivingInspectionQuantityUnresolvedError,
  ReceivingInspectionStatusInvalidError,
} from "./ReceivingInspectionErrors";

export type ReceivingInspectionStatus =
  | "ARRIVED"
  | "UNDER_INSPECTION"
  | "COMPLETED";

export type ReceivingInspectionSnapshot = {
  id: string;
  purchaseOrderId: string;
  status: ReceivingInspectionStatus;
  arrivedAt: Date;
  arrivedBy: string;
  startedAt: Date | null;
  startedBy: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  notes: string | null;
  items: ReceivingInspectionItemSnapshot[];
};

export type CreateReceivingInspectionInput = {
  id: string;
  purchaseOrderId: string;
  arrivedAt: Date;
  arrivedBy: string;
  notes: string | null;
  items: ReceivingInspectionItem[];
};

export type CompleteReceivingInspectionItemInput = {
  purchaseItemId: string;
} & RecordInspectionResultInput;

export type CompleteReceivingInspectionInput = {
  completedAt: Date;
  completedBy: string;
  items: CompleteReceivingInspectionItemInput[];
};

export class ReceivingInspection {
  private constructor(
    private readonly idValue: string,
    private readonly purchaseOrderIdValue: string,
    private statusValue: ReceivingInspectionStatus,
    private readonly arrivedAtValue: Date,
    private readonly arrivedByValue: string,
    private startedAtValue: Date | null,
    private startedByValue: string | null,
    private completedAtValue: Date | null,
    private completedByValue: string | null,
    private readonly notesValue: string | null,
    private readonly itemsValue: ReceivingInspectionItem[],
  ) {
    this.assertRequired(this.idValue, "id");
    this.assertRequired(this.purchaseOrderIdValue, "purchaseOrderId");
    this.assertRequired(this.arrivedByValue, "arrivedBy");

    if (this.itemsValue.length === 0) {
      throw new ReceivingInspectionStatusInvalidError(
        "receiving inspection must have at least one item",
      );
    }
  }

  static create(input: CreateReceivingInspectionInput): ReceivingInspection {
    return new ReceivingInspection(
      input.id,
      input.purchaseOrderId,
      "ARRIVED",
      input.arrivedAt,
      input.arrivedBy,
      null,
      null,
      null,
      null,
      input.notes,
      input.items,
    );
  }

  static fromSnapshot(snapshot: ReceivingInspectionSnapshot): ReceivingInspection {
    return new ReceivingInspection(
      snapshot.id,
      snapshot.purchaseOrderId,
      snapshot.status,
      snapshot.arrivedAt,
      snapshot.arrivedBy,
      snapshot.startedAt,
      snapshot.startedBy,
      snapshot.completedAt,
      snapshot.completedBy,
      snapshot.notes,
      snapshot.items.map((item) => ReceivingInspectionItem.fromSnapshot(item)),
    );
  }

  get id(): string {
    return this.idValue;
  }

  get purchaseOrderId(): string {
    return this.purchaseOrderIdValue;
  }

  get status(): ReceivingInspectionStatus {
    return this.statusValue;
  }

  get arrivedAt(): Date {
    return this.arrivedAtValue;
  }

  get arrivedBy(): string {
    return this.arrivedByValue;
  }

  get startedAt(): Date | null {
    return this.startedAtValue;
  }

  get startedBy(): string | null {
    return this.startedByValue;
  }

  get completedAt(): Date | null {
    return this.completedAtValue;
  }

  get completedBy(): string | null {
    return this.completedByValue;
  }

  get notes(): string | null {
    return this.notesValue;
  }

  get items(): readonly ReceivingInspectionItem[] {
    return this.itemsValue;
  }

  start(startedAt: Date, startedBy: string): void {
    if (this.statusValue !== "ARRIVED") {
      throw new ReceivingInspectionStatusInvalidError(
        "only ARRIVED inspection can be started",
      );
    }

    this.assertRequired(startedBy, "startedBy");

    this.statusValue = "UNDER_INSPECTION";
    this.startedAtValue = startedAt;
    this.startedByValue = startedBy;
  }

  complete(input: CompleteReceivingInspectionInput): void {
    if (this.statusValue !== "UNDER_INSPECTION") {
      throw new ReceivingInspectionStatusInvalidError(
        "only UNDER_INSPECTION inspection can be completed",
      );
    }

    this.assertRequired(input.completedBy, "completedBy");
    this.assertAllItemsProvided(input.items);

    for (const itemInput of input.items) {
      const item = this.findItemOrThrow(itemInput.purchaseItemId);

      item.recordResult({
        acceptedQuantity: itemInput.acceptedQuantity,
        quarantinedQuantity: itemInput.quarantinedQuantity,
        rejectedQuantity: itemInput.rejectedQuantity,
        notes: itemInput.notes,
      });
    }

    this.statusValue = "COMPLETED";
    this.completedAtValue = input.completedAt;
    this.completedByValue = input.completedBy;
  }

  hasQuarantine(): boolean {
    return this.itemsValue.some((item) => item.hasQuarantine());
  }

  hasRejectedQuantity(): boolean {
    return this.itemsValue.some((item) => item.hasRejectedQuantity());
  }

  acceptedItems(): Array<{
    purchaseItemId: string;
    variantId: string;
    acceptedQuantity: number;
  }> {
    return this.itemsValue
      .filter((item) => item.acceptedQuantity > 0)
      .map((item) => ({
        purchaseItemId: item.purchaseItemId,
        variantId: item.variantId,
        acceptedQuantity: item.acceptedQuantity,
      }));
  }

  toSnapshot(): ReceivingInspectionSnapshot {
    return {
      id: this.idValue,
      purchaseOrderId: this.purchaseOrderIdValue,
      status: this.statusValue,
      arrivedAt: this.arrivedAtValue,
      arrivedBy: this.arrivedByValue,
      startedAt: this.startedAtValue,
      startedBy: this.startedByValue,
      completedAt: this.completedAtValue,
      completedBy: this.completedByValue,
      notes: this.notesValue,
      items: this.itemsValue.map((item) => item.toSnapshot()),
    };
  }

  private findItemOrThrow(purchaseItemId: string): ReceivingInspectionItem {
    const item = this.itemsValue.find(
      (candidate) => candidate.purchaseItemId === purchaseItemId,
    );

    if (!item) {
      throw new ReceivingInspectionItemNotFoundError(purchaseItemId);
    }

    return item;
  }

  private assertAllItemsProvided(
    inputItems: CompleteReceivingInspectionItemInput[],
  ): void {
    const inputIds = new Set(inputItems.map((item) => item.purchaseItemId));

    if (
      inputIds.size !== inputItems.length ||
      inputIds.size !== this.itemsValue.length
    ) {
      throw new ReceivingInspectionQuantityUnresolvedError();
    }

    for (const item of this.itemsValue) {
      if (!inputIds.has(item.purchaseItemId)) {
        throw new ReceivingInspectionQuantityUnresolvedError();
      }
    }
  }

  private assertRequired(value: string, fieldName: string): void {
    if (value.trim() === "") {
      throw new ReceivingInspectionStatusInvalidError(`${fieldName} is required`);
    }
  }
}