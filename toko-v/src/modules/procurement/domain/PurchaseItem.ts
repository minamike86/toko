import {
  ProcurementIdentityInvalidError,
  PurchaseItemQuantityInvalidError,
  PurchaseItemSnapshotInvalidError,
  PurchaseItemUnitCostInvalidError,
} from "./ProcurementErrors";

type CreatePurchaseItemParams = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitCost: number;
};

type RehydratePurchaseItemParams = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
};

function assertNonEmptyIdentity(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ProcurementIdentityInvalidError();
  }

  return normalized;
}

function assertNonEmptySnapshot(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new PurchaseItemSnapshotInvalidError();
  }

  return normalized;
}

function assertPositiveInteger(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new PurchaseItemQuantityInvalidError();
  }

  return value;
}

function assertNonNegativeInteger(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new PurchaseItemUnitCostInvalidError();
  }

  return value;
}

export class PurchaseItem {
  private constructor(
    public readonly id: string,
    public readonly purchaseOrderId: string,
    public readonly productId: string,
    public readonly variantId: string,
    public readonly productNameSnapshot: string,
    public readonly variantNameSnapshot: string,
    public readonly unitSnapshot: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly subtotalCost: number,
  ) { }

  static create(params: CreatePurchaseItemParams): PurchaseItem {
    const quantity = assertPositiveInteger(params.quantity);
    const unitCost = assertNonNegativeInteger(params.unitCost);

    return new PurchaseItem(
      assertNonEmptyIdentity(params.id),
      assertNonEmptyIdentity(params.purchaseOrderId),
      assertNonEmptyIdentity(params.productId),
      assertNonEmptyIdentity(params.variantId),
      assertNonEmptySnapshot(params.productNameSnapshot),
      assertNonEmptySnapshot(params.variantNameSnapshot),
      assertNonEmptySnapshot(params.unitSnapshot),
      quantity,
      unitCost,
      quantity * unitCost,
    );
  }

  static rehydrate(params: RehydratePurchaseItemParams): PurchaseItem {
    const quantity = assertPositiveInteger(params.quantity);
    const unitCost = assertNonNegativeInteger(params.unitCost);
    const subtotalCost = quantity * unitCost;

    if (params.subtotalCost !== subtotalCost) {
      throw new PurchaseItemSnapshotInvalidError();
    }

    return new PurchaseItem(
      assertNonEmptyIdentity(params.id),
      assertNonEmptyIdentity(params.purchaseOrderId),
      assertNonEmptyIdentity(params.productId),
      assertNonEmptyIdentity(params.variantId),
      assertNonEmptySnapshot(params.productNameSnapshot),
      assertNonEmptySnapshot(params.variantNameSnapshot),
      assertNonEmptySnapshot(params.unitSnapshot),
      quantity,
      unitCost,
      subtotalCost,
    );
  }
}