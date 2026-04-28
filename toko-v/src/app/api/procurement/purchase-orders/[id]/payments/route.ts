import { NextRequest, NextResponse } from "next/server";

import { recordSupplierPayment } from "@/wiring/container";
import { mapHttpError } from "@/shared/delivery/map-http-error";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  amount: number;
  paidAt: Date;
  notes: string | null;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const actor = parseActorContext(request);
    const body = await parseRequestBody(request);

    const result = await recordSupplierPayment.execute({
      purchaseOrderId: id,
      amount: body.amount,
      paidAt: body.paidAt,
      notes: body.notes,
      actor,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const mappedError = mapHttpError(error);
    return NextResponse.json(mappedError.body, { status: mappedError.status });
  }
}

async function parseRequestBody(request: NextRequest): Promise<RequestBody> {
  const rawBody: unknown = await request.json();

  if (!isRecord(rawBody)) {
    return badRequest("Request body must be an object.");
  }

  const amount = rawBody.amount;
  const paidAt = rawBody.paidAt;
  const notes = rawBody.notes;

  if (typeof amount !== "number") {
    return badRequest("amount must be a number.");
  }

  if (typeof paidAt !== "string") {
    return badRequest("paidAt must be an ISO date string.");
  }

  const parsedPaidAt = new Date(paidAt);

  if (Number.isNaN(parsedPaidAt.getTime())) {
    return badRequest("paidAt must be a valid ISO date string.");
  }

  if (notes !== null && notes !== undefined && typeof notes !== "string") {
    return badRequest("notes must be a string or null.");
  }

  return {
    amount,
    paidAt: parsedPaidAt,
    notes: notes ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function badRequest(message: string): never {
  throw new Error(message);
}