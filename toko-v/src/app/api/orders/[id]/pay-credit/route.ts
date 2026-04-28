import { NextResponse } from "next/server";
import { payCredit } from "@/wiring/container";
import { getOrderOutstanding } from "@/modules/reporting/application/get-order-outstanding";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { mapHttpError } from "@/shared/delivery/map-http-error";

type PayCreditRequestBody = {
  actorId: string;
  role: string;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = (await req.json()) as PayCreditRequestBody;
    const actor = parseActorContext({
      actorId: body.actorId,
      role: body.role,
    });

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
      actor,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const mapped = mapHttpError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}