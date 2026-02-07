export class InventoryItem {
  private constructor(
    private readonly productId: string,
    private quantity: number
  ) {}

  static of(productId: string, quantity: number): InventoryItem {
    return new InventoryItem(productId, quantity);
  }

  canFulfill(requestedQuantity: number): boolean {
    return this.quantity >= requestedQuantity;
  }

  decrease(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }
    if (this.quantity < quantity) {
      throw new Error("Insufficient stock");
    }
    this.quantity -= quantity;
  }

  increase(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Quantity must be positive");
    }
    this.quantity += quantity;
  }

  getProductId(): string {
    return this.productId;
  }

  getQuantity(): number {
    // optional, hanya untuk reporting / test
    return this.quantity;
  }
}
