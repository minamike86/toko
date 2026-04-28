import { NextRequest, NextResponse } from "next/server";

import { handlePurchaseReturn } from "@/wiring/container";
import { mapHttpError } from "@/shared/delivery/map-http-error";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReturnItemInput = {
  purchaseItemId: string;
  quantity: number;
  reason: string | null;
};

type RequestBody = {
  returnItems: ReturnItemInput[];
  returnedAt: Date;
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

    const result = await handlePurchaseReturn.execute({
      purchaseOrderId: id,
      returnItems: body.returnItems,
      returnedAt: body.returnedAt,
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

  const returnItems = rawBody.returnItems;
  const returnedAt = rawBody.returnedAt;
  const notes = rawBody.notes;

  if (!Array.isArray(returnItems)) {
    return badRequest("returnItems must be an array.");
  }

  if (typeof returnedAt !== "string") {
    return badRequest("returnedAt must be an ISO date string.");
  }

  const parsedReturnedAt = new Date(returnedAt);

  if (Number.isNaN(parsedReturnedAt.getTime())) {
    return badRequest("returnedAt must be a valid ISO date string.");
  }

  if (notes !== null && notes !== undefined && typeof notes !== "string") {
    return badRequest("notes must be a string or null.");
  }

  return {
    returnItems: returnItems.map(parseReturnItem),
    returnedAt: parsedReturnedAt,
    notes: notes ?? null,
  };
}

function parseReturnItem(value: unknown): ReturnItemInput {
  if (!isRecord(value)) {
    return badRequest("returnItems item must be an object.");
  }

  const purchaseItemId = value.purchaseItemId;
  const quantity = value.quantity;
  const reason = value.reason;

  if (typeof purchaseItemId !== "string" || purchaseItemId.length === 0) {
    return badRequest("purchaseItemId must be a non-empty string.");
  }

  if (typeof quantity !== "number") {
    return badRequest("quantity must be a number.");
  }

  if (reason !== null && reason !== undefined && typeof reason !== "string") {
    return badRequest("reason must be a string or null.");
  }

  return {
    purchaseItemId,
    quantity,
    reason: reason ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function badRequest(message: string): never {
  throw new Error(message);
}