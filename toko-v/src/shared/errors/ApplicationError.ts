export abstract class ApplicationError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor() {
    super("Forbidden");
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}