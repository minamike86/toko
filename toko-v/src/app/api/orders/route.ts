import { NextResponse } from "next/server";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { createOrder } from "@/wiring/container";
import { listPosOrders } from "@/modules/reporting/application/ListPosOrders";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { mapHttpError } from "@/shared/delivery/map-http-error";

type PosOrderStatusFilter =
  | "ALL"
  | "ON_CREDIT"
  | "PAID"
  | "CANCELED";

type CreateOrderRequestBody = {
  orderId: string;
  type: OrderType;
  payment: "CASH" | "CREDIT";
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  actorId: string;
  role: string;
};

function toStatusFilter(value: string | null): PosOrderStatusFilter {
  if (
    value === "ALL" ||
    value === "ON_CREDIT" ||
    value === "PAID" ||
    value === "CANCELED"
  ) {
    return value;
  }

  return "ALL";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = toStatusFilter(searchParams.get("status"));

    const orders = await listPosOrders({ status });

    return NextResponse.json(orders, { status: 200 });
  } catch (error: unknown) {
    const mapped = mapHttpError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderRequestBody;
    const actor = parseActorContext({
      actorId: body.actorId,
      role: body.role,
    });

    const result = await createOrder.execute({
      orderId: body.orderId,
      type: body.type,
      payment: body.payment,
      items: body.items,
      actor,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/orders] failed:", error);
    console.error(
      "[POST /api/orders] meta:",
      error instanceof Error
        ? {
          name: error.name,
          message: error.message,
          constructorName: error.constructor.name,
          stack: error.stack,
        }
        : {
          type: typeof error,
          value: error,
        },
    );

    const mapped = mapHttpError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}