import { NextResponse } from "next/server";
import { OrderType } from "@/modules/sales/domain/OrderType";
import { createOrder } from "@/wiring/container";
import { listPosOrders } from "@/modules/reporting/application/ListPosOrders";

type ErrorResponse = {
  error: string;
  message: string;
};

type PosOrderStatusFilter =
  | "ALL"
  | "ON_CREDIT"
  | "PAID"
  | "CANCELED";

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
    const response = mapErrorToResponse(error);
    return NextResponse.json(response, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const result = await createOrder.execute({
      orderId: body.orderId,
      type: body.type as OrderType,
      payment: body.payment,
      items: body.items,
      actor: {
        actorId: body.actorId,
        role: body.role,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const response = mapErrorToResponse(error);
    return NextResponse.json(response, { status: 400 });
  }
}

function mapErrorToResponse(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    return {
      error: error.name,
      message: error.message,
    };
  }

  return {
    error: "UnknownError",
    message: "Terjadi kesalahan yang tidak terduga.",
  };
}