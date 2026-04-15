import { NextResponse } from "next/server";
import { cancelOrder } from "@/wiring/container";

type ErrorResponse = {
  error: string;
  message: string;
};

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const result = await cancelOrder.execute({
      orderId: id,
      actor: {
        actorId: "POS-OPERATOR-001",
        role: "ADMIN",
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(mapErrorToResponse(error), { status: 400 });
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