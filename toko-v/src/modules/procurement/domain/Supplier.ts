import {
  InvalidSupplierStoreNameError,
  ProcurementIdentityInvalidError,
  SupplierInactiveError,
} from "./ProcurementErrors";

type CreateSupplierParams = {
  id: string;
  storeName: string;
  salesName?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: Date;
};

type RehydrateSupplierParams = {
  id: string;
  storeName: string;
  salesName: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};

type UpdateSupplierContactInfoParams = {
  storeName: string;
  salesName?: string | null;
  phone?: string | null;
  notes?: string | null;
};

function assertNonEmptyId(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new ProcurementIdentityInvalidError();
  }

  return normalized;
}

function normalizeOptional(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function assertStoreName(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new InvalidSupplierStoreNameError();
  }

  return normalized;
}

export class Supplier {
  private constructor(
    public readonly id: string,
    private _storeName: string,
    private _salesName: string | null,
    private _phone: string | null,
    private _notes: string | null,
    private _isActive: boolean,
    public readonly createdAt: Date,
  ) { }

  static create(params: CreateSupplierParams): Supplier {
    return new Supplier(
      assertNonEmptyId(params.id),
      assertStoreName(params.storeName),
      normalizeOptional(params.salesName),
      normalizeOptional(params.phone),
      normalizeOptional(params.notes),
      true,
      params.createdAt,
    );
  }

  static rehydrate(params: RehydrateSupplierParams): Supplier {
    return new Supplier(
      assertNonEmptyId(params.id),
      assertStoreName(params.storeName),
      normalizeOptional(params.salesName),
      normalizeOptional(params.phone),
      normalizeOptional(params.notes),
      params.isActive,
      params.createdAt,
    );
  }

  get storeName(): string {
    return this._storeName;
  }

  get salesName(): string | null {
    return this._salesName;
  }

  get phone(): string | null {
    return this._phone;
  }

  get notes(): string | null {
    return this._notes;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  updateContactInfo(params: UpdateSupplierContactInfoParams): void {
    this._storeName = assertStoreName(params.storeName);
    this._salesName = normalizeOptional(params.salesName);
    this._phone = normalizeOptional(params.phone);
    this._notes = normalizeOptional(params.notes);
  }

  assertCanBeUsedForNewPurchaseOrder(): void {
    if (!this._isActive) {
      throw new SupplierInactiveError();
    }
  }
}