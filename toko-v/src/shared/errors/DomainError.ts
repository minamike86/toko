export class DomainError extends Error {
  readonly name: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
