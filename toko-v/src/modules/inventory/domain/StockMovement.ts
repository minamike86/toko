import { randomUUID } from "crypto";

export type StockMovementType = "IN" | "OUT" | "ADJUST";

export type StockMovementOrigin =
  | "LEGACY"
  | "MANUAL_ADJUSTMENT"
  | "PURCHASE";

type StockMovementProps = {
  id: string;
  productId?: string | null;
  variantId: string;
  type: StockMovementType;
  origin: StockMovementOrigin;
  quantity: number;
  reason: string;
  referenceId?: string;
  occurredAt: Date;
};

type CreateStockMovementParams = {
  variantId: string;
  productId?: string | null;
  quantity: number;
  reason: string;
  origin: StockMovementOrigin;
  referenceId?: string;
};

export class StockMovement {
  private constructor(private readonly props: StockMovementProps) { }

  static in(params: CreateStockMovementParams): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      variantId: params.variantId,
      productId: params.productId ?? null,
      type: "IN",
      origin: params.origin,
      quantity: params.quantity,
      reason: params.reason,
      referenceId: params.referenceId,
      occurredAt: new Date(),
    });
  }

  static out(params: CreateStockMovementParams): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      variantId: params.variantId,
      productId: params.productId ?? null,
      type: "OUT",
      origin: params.origin,
      quantity: params.quantity,
      reason: params.reason,
      referenceId: params.referenceId,
      occurredAt: new Date(),
    });
  }

  static adjust(params: CreateStockMovementParams): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      variantId: params.variantId,
      productId: params.productId ?? null,
      type: "ADJUST",
      origin: params.origin,
      quantity: params.quantity,
      reason: params.reason,
      referenceId: params.referenceId,
      occurredAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get productId(): string | null | undefined {
    return this.props.productId;
  }

  get type(): StockMovementType {
    return this.props.type;
  }

  get origin(): StockMovementOrigin {
    return this.props.origin;
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