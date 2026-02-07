import { randomUUID } from "crypto";

export type StockMovementType = "IN" | "OUT" | "ADJUST";

type StockMovementProps = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  referenceId?: string;
  occurredAt: Date;
};

export class StockMovement {
  private constructor(private readonly props: StockMovementProps) {}

  /* ======================================================
     FACTORY METHODS
     ====================================================== */

  static in(
    productId: string,
    quantity: number,
    reason: string,
    referenceId?: string
  ): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      productId,
      type: "IN",
      quantity,
      reason,
      referenceId,
      occurredAt: new Date(),
    });
  }

  static out(
    productId: string,
    quantity: number,
    reason: string,
    referenceId?: string
  ): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      productId,
      type: "OUT",
      quantity,
      reason,
      referenceId,
      occurredAt: new Date(),
    });
  }

  static adjust(
    productId: string,
    quantity: number,
    reason: string,
    referenceId?: string
  ): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      productId,
      type: "ADJUST",
      quantity,
      reason,
      referenceId,
      occurredAt: new Date(),
    });
  }

  /* ======================================================
     GETTERS (READ-ONLY)
     ====================================================== */

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get type(): StockMovementType {
    return this.props.type;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reason(): string {
    return this.props.reason;
  }

  get referenceId(): string | undefined {
    return this.props.referenceId;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
