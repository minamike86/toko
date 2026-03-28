export abstract class ApplicationError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ApplicationError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`)
  }
}

export class ForbiddenError extends ApplicationError {
  constructor() {
    super('Forbidden')
  }
}
