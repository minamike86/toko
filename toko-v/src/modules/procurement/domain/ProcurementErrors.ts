export class ProcurementDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcurementDomainError";
  }
}

export class ProcurementIdentityInvalidError extends ProcurementDomainError {
  constructor() {
    super("PROCUREMENT_IDENTITY_INVALID");
  }
}

export class InvalidSupplierStoreNameError extends ProcurementDomainError {
  constructor() {
    super("SUPPLIER_STORE_NAME_INVALID");
  }
}

export class SupplierInactiveError extends ProcurementDomainError {
  constructor() {
    super("SUPPLIER_INACTIVE");
  }
}

export class PurchaseOrderItemsEmptyError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ITEMS_EMPTY");
  }
}

export class PurchaseItemQuantityInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_QUANTITY_INVALID");
  }
}

export class PurchaseItemUnitCostInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_UNIT_COST_INVALID");
  }
}

export class PurchaseItemSnapshotInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_SNAPSHOT_INVALID");
  }
}

export class PurchaseOrderStatusInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_STATUS_INVALID");
  }
}

export class PurchaseOrderAlreadyReceivedError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ALREADY_RECEIVED");
  }
}

export class PurchaseOrderAlreadyCanceledError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ALREADY_CANCELED");
  }
}

export class PurchaseOrderCannotBeReceivedError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_CANNOT_BE_RECEIVED");
  }
}

export class PurchaseOrderCannotBeCanceledError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_CANNOT_BE_CANCELED");
  }
}

export class DuplicatePurchaseItemVariantError extends ProcurementDomainError {
  constructor() {
    super("DUPLICATE_PURCHASE_ITEM_VARIANT");
  }
}