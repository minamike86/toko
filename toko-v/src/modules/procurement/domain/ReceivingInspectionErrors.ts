export class ReceivingInspectionAlreadyExistsError extends Error {
  constructor() {
    super("Receiving inspection already exists");
    this.name = "ReceivingInspectionAlreadyExistsError";
  }
}

export class ReceivingInspectionNotFoundError extends Error {
  constructor() {
    super("Receiving inspection not found");
    this.name = "ReceivingInspectionNotFoundError";
  }
}

export class ReceivingInspectionStatusInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceivingInspectionStatusInvalidError";
  }
}

export class ReceivingInspectionAlreadyCompletedError extends Error {
  constructor() {
    super("Receiving inspection is already completed");
    this.name = "ReceivingInspectionAlreadyCompletedError";
  }
}

export class ReceivingInspectionQuantityInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceivingInspectionQuantityInvalidError";
  }
}

export class ReceivingInspectionQuantityUnresolvedError extends Error {
  constructor() {
    super("Receiving inspection quantity is unresolved");
    this.name = "ReceivingInspectionQuantityUnresolvedError";
  }
}

export class ReceivingInspectionItemNotFoundError extends Error {
  constructor(purchaseItemId: string) {
    super(`Receiving inspection item not found: ${purchaseItemId}`);
    this.name = "ReceivingInspectionItemNotFoundError";
  }
}