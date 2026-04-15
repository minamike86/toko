import { NextResponse } from "next/server";
import { payCredit } from "@/wiring/container";
import { getOrderOutstanding } from "@/modules/reporting/application/get-order-outstanding";

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
    const outstanding = await getOrderOutstanding(id);

    if (!outstanding) {
      return NextResponse.json(
        {
          error: "NotFoundError",
          message: `Order not found: ${id}`,
        },
        { status: 404 },
      );
    }

    await payCredit.execute({
      orderId: id,
      amount: outstanding.outstandingAmount,
      paidAt: new Date(),
      method: "CASH",
      actor: {
        actorId: "POS-OPERATOR-001",
        role: "ADMIN",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
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