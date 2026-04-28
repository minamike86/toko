export class InventoryItem {
  private constructor(private quantity: number) { }

  static of(quantity: number): InventoryItem {
    return new InventoryItem(quantity);
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

  getQuantity(): number {
    return this.quantity;
  }
}