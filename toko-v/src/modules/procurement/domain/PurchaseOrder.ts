import {
  DuplicatePurchaseItemVariantError,
  ProcurementIdentityInvalidError,
  PurchaseOrderAlreadyCanceledError,
  PurchaseOrderAlreadyReceivedError,
  PurchaseOrderCannotBeCanceledError,
  PurchaseOrderCannotBeReceivedError,
  PurchaseOrderItemsEmptyError,
  PurchaseOrderStatusInvalidError,
} from "./ProcurementErrors";
import {
  isPurchaseOrderStatus,
  PURCHASE_ORDER_STATUSES,
  PurchaseOrderStatus,
} from "./PurchaseOrderStatus";
import { PurchaseItem } from "./PurchaseItem";

type CreatePurchaseOrderParams = {
  id: string;
  supplierId: string;
  items: PurchaseItem[];
  createdAt: Date;
  createdBy: string;
};

type RehydratePurchaseOrderParams = {
  id: string;
  supplierId: string;
  status: string;
  items: PurchaseItem[];
  createdAt: Date;
  createdBy: string;
  receivedAt: Date | null;
  receivedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
};

type ReceivePurchaseOrderParams = {
  receivedAt: Date;
  receivedBy: string;
};

type CancelPurchaseOrderParams = {
  canceledAt: Date;
  canceledBy: string;
};

function assertNonEmptyIdentity(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ProcurementIdentityInvalidError();
  }

  return normalized;
}

function assertOptionalIdentity(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return assertNonEmptyIdentity(value);
}

function assertItems(orderId: string, items: PurchaseItem[]): PurchaseItem[] {
  if (items.length === 0) {
    throw new PurchaseOrderItemsEmptyError();
  }

  const seenVariantIds = new Set<string>();

  for (const item of items) {
    if (item.purchaseOrderId !== orderId) {
      throw new ProcurementIdentityInvalidError();
    }

    if (seenVariantIds.has(item.variantId)) {
      throw new DuplicatePurchaseItemVariantError();
    }

    seenVariantIds.add(item.variantId);
  }

  return [...items];
}

export class PurchaseOrder {
  private constructor(
    public readonly id: string,
    public readonly supplierId: string,
    private _status: PurchaseOrderStatus,
    private readonly _items: PurchaseItem[],
    public readonly createdAt: Date,
    public readonly createdBy: string,
    private _receivedAt: Date | null,
    private _receivedBy: string | null,
    private _canceledAt: Date | null,
    private _canceledBy: string | null,
  ) { }

  static create(params: CreatePurchaseOrderParams): PurchaseOrder {
    const id = assertNonEmptyIdentity(params.id);

    return new PurchaseOrder(
      id,
      assertNonEmptyIdentity(params.supplierId),
      PURCHASE_ORDER_STATUSES.CREATED,
      assertItems(id, params.items),
      params.createdAt,
      assertNonEmptyIdentity(params.createdBy),
      null,
      null,
      null,
      null,
    );
  }

  static rehydrate(params: RehydratePurchaseOrderParams): PurchaseOrder {
    if (!isPurchaseOrderStatus(params.status)) {
      throw new PurchaseOrderStatusInvalidError();
    }

    const id = assertNonEmptyIdentity(params.id);

    return new PurchaseOrder(
      id,
      assertNonEmptyIdentity(params.supplierId),
      params.status,
      assertItems(id, params.items),
      params.createdAt,
      assertNonEmptyIdentity(params.createdBy),
      params.receivedAt,
      assertOptionalIdentity(params.receivedBy),
      params.canceledAt,
      assertOptionalIdentity(params.canceledBy),
    );
  }

  get status(): PurchaseOrderStatus {
    return this._status;
  }

  get items(): ReadonlyArray<PurchaseItem> {
    return this._items;
  }

  get receivedAt(): Date | null {
    return this._receivedAt;
  }

  get receivedBy(): string | null {
    return this._receivedBy;
  }

  get canceledAt(): Date | null {
    return this._canceledAt;
  }

  get canceledBy(): string | null {
    return this._canceledBy;
  }

  get totalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalCost(): number {
    return this._items.reduce((total, item) => total + item.subtotalCost, 0);
  }

  assertCanBeReceived(): void {
    if (this._status === PURCHASE_ORDER_STATUSES.RECEIVED) {
      throw new PurchaseOrderAlreadyReceivedError();
    }

    if (this._status === PURCHASE_ORDER_STATUSES.CANCELED) {
      throw new PurchaseOrderCannotBeReceivedError();
    }
  }

  assertCanBeCanceled(): void {
    if (this._status === PURCHASE_ORDER_STATUSES.CANCELED) {
      throw new PurchaseOrderAlreadyCanceledError();
    }

    if (this._status === PURCHASE_ORDER_STATUSES.RECEIVED) {
      throw new PurchaseOrderCannotBeCanceledError();
    }
  }

  receive(params: ReceivePurchaseOrderParams): void {
    this.assertCanBeReceived();
    this._status = PURCHASE_ORDER_STATUSES.RECEIVED;
    this._receivedAt = params.receivedAt;
    this._receivedBy = assertNonEmptyIdentity(params.receivedBy);
  }

  cancel(params: CancelPurchaseOrderParams): void {
    this.assertCanBeCanceled();
    this._status = PURCHASE_ORDER_STATUSES.CANCELED;
    this._canceledAt = params.canceledAt;
    this._canceledBy = assertNonEmptyIdentity(params.canceledBy);
  }
}