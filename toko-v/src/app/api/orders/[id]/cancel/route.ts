import { NextResponse } from "next/server";
import { cancelOrder } from "@/wiring/container";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { mapHttpError } from "@/shared/delivery/map-http-error";

type CancelOrderRequestBody = {
  actorId: string;
  role: string;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = (await req.json()) as CancelOrderRequestBody;
    const actor = parseActorContext({
      actorId: body.actorId,
      role: body.role,
    });

    const result = await cancelOrder.execute({
      orderId: id,
      actor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const mapped = mapHttpError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}