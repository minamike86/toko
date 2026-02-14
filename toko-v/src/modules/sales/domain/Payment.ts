export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
    public readonly createdAt: Date,
  ) {}
}
