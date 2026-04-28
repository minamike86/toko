export class ForbiddenReceivingInspectionActionError extends Error {
  constructor() {
    super("Actor is not allowed to perform receiving inspection action");
    this.name = "ForbiddenReceivingInspectionActionError";
  }
}

export class InspectionFlowNotEnabledError extends Error {
  constructor() {
    super("Inspection flow is not enabled for this purchase order");
    this.name = "InspectionFlowNotEnabledError";
  }
}

export class PurchaseOrderNotFoundError extends Error {
  constructor() {
    super("Purchase order not found");
    this.name = "PurchaseOrderNotFoundError";
  }
}

export class PurchaseOrderNotInspectableError extends Error {
  constructor() {
    super("Purchase order is not inspectable");
    this.name = "PurchaseOrderNotInspectableError";
  }
}

export class PurchaseOrderNotFinalizableError extends Error {
  constructor() {
    super("Purchase order is not finalizable");
    this.name = "PurchaseOrderNotFinalizableError";
  }
}

export class FinalAcceptanceBlockedByQuarantineError extends Error {
  constructor() {
    super("Final acceptance is blocked by quarantined quantity");
    this.name = "FinalAcceptanceBlockedByQuarantineError";
  }
}

export class FinalAcceptanceBlockedByPendingRejectionError extends Error {
  constructor() {
    super("Final acceptance is blocked by pending rejected quantity");
    this.name = "FinalAcceptanceBlockedByPendingRejectionError";
  }
}

export class FinalAcceptanceResolutionNotVerifiedError extends Error {
  constructor() {
    super("Final acceptance resolution is not verified");
    this.name = "FinalAcceptanceResolutionNotVerifiedError";
  }
}