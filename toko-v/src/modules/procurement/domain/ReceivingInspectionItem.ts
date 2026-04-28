import {
  ReceivingInspectionQuantityInvalidError,
  ReceivingInspectionQuantityUnresolvedError,
} from "./ReceivingInspectionErrors";

export type ReceivingInspectionItemSnapshot = {
  purchaseItemId: string;
  variantId: string;
  expectedQuantity: number;
  acceptedQuantity: number;
  quarantinedQuantity: number;
  rejectedQuantity: number;
  notes: string | null;
};

export type CreateReceivingInspectionItemInput = {
  purchaseItemId: string;
  variantId: string;
  expectedQuantity: number;
};

export type RecordInspectionResultInput = {
  acceptedQuantity: number;
  quarantinedQuantity: number;
  rejectedQuantity: number;
  notes: string | null;
};

export class ReceivingInspectionItem {
  private constructor(
    private readonly purchaseItemIdValue: string,
    private readonly variantIdValue: string,
    private readonly expectedQuantityValue: number,
    private acceptedQuantityValue: number,
    private quarantinedQuantityValue: number,
    private rejectedQuantityValue: number,
    private notesValue: string | null,
  ) {
    this.assertRequired(this.purchaseItemIdValue, "purchaseItemId");
    this.assertRequired(this.variantIdValue, "variantId");
    this.assertPositiveInteger(this.expectedQuantityValue, "expectedQuantity");
    this.assertNonNegativeInteger(this.acceptedQuantityValue, "acceptedQuantity");
    this.assertNonNegativeInteger(this.quarantinedQuantityValue, "quarantinedQuantity");
    this.assertNonNegativeInteger(this.rejectedQuantityValue, "rejectedQuantity");
  }

  static create(input: CreateReceivingInspectionItemInput): ReceivingInspectionItem {
    return new ReceivingInspectionItem(
      input.purchaseItemId,
      input.variantId,
      input.expectedQuantity,
      0,
      0,
      0,
      null,
    );
  }

  static fromSnapshot(snapshot: ReceivingInspectionItemSnapshot): ReceivingInspectionItem {
    return new ReceivingInspectionItem(
      snapshot.purchaseItemId,
      snapshot.variantId,
      snapshot.expectedQuantity,
      snapshot.acceptedQuantity,
      snapshot.quarantinedQuantity,
      snapshot.rejectedQuantity,
      snapshot.notes,
    );
  }

  get purchaseItemId(): string {
    return this.purchaseItemIdValue;
  }

  get variantId(): string {
    return this.variantIdValue;
  }

  get expectedQuantity(): number {
    return this.expectedQuantityValue;
  }

  get acceptedQuantity(): number {
    return this.acceptedQuantityValue;
  }

  get quarantinedQuantity(): number {
    return this.quarantinedQuantityValue;
  }

  get rejectedQuantity(): number {
    return this.rejectedQuantityValue;
  }

  get notes(): string | null {
    return this.notesValue;
  }

  recordResult(input: RecordInspectionResultInput): void {
    this.assertNonNegativeInteger(input.acceptedQuantity, "acceptedQuantity");
    this.assertNonNegativeInteger(input.quarantinedQuantity, "quarantinedQuantity");
    this.assertNonNegativeInteger(input.rejectedQuantity, "rejectedQuantity");

    const total =
      input.acceptedQuantity +
      input.quarantinedQuantity +
      input.rejectedQuantity;

    if (total !== this.expectedQuantityValue) {
      throw new ReceivingInspectionQuantityUnresolvedError();
    }

    this.acceptedQuantityValue = input.acceptedQuantity;
    this.quarantinedQuantityValue = input.quarantinedQuantity;
    this.rejectedQuantityValue = input.rejectedQuantity;
    this.notesValue = input.notes;
  }

  hasQuarantine(): boolean {
    return this.quarantinedQuantityValue > 0;
  }

  hasRejectedQuantity(): boolean {
    return this.rejectedQuantityValue > 0;
  }

  toSnapshot(): ReceivingInspectionItemSnapshot {
    return {
      purchaseItemId: this.purchaseItemIdValue,
      variantId: this.variantIdValue,
      expectedQuantity: this.expectedQuantityValue,
      acceptedQuantity: this.acceptedQuantityValue,
      quarantinedQuantity: this.quarantinedQuantityValue,
      rejectedQuantity: this.rejectedQuantityValue,
      notes: this.notesValue,
    };
  }

  private assertRequired(value: string, fieldName: string): void {
    if (value.trim() === "") {
      throw new ReceivingInspectionQuantityInvalidError(`${fieldName} is required`);
    }
  }

  private assertPositiveInteger(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ReceivingInspectionQuantityInvalidError(
        `${fieldName} must be a positive integer`,
      );
    }
  }

  private assertNonNegativeInteger(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new ReceivingInspectionQuantityInvalidError(
        `${fieldName} must be a non-negative integer`,
      );
    }
  }
}