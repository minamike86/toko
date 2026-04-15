import { NextResponse } from "next/server";

import { cancelPurchaseOrder } from "@/wiring/container";
import {
  ForbiddenError,
  NotFoundError,
} from "@/shared/errors/ApplicationError";
import type { ActorContext } from "@/shared/system/types/actor-context";
import {
  PurchaseOrderAlreadyCanceledError,
  PurchaseOrderCannotBeCanceledError,
} from "@/modules/procurement/domain/ProcurementErrors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CancelPurchaseOrderSuccessResponse = {
  data: {
    purchaseOrderId: string;
    status: string;
    canceledAt: string;
    canceledBy: string;
  };
};

type ErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

function getDevelopmentActor(): ActorContext {
  return {
    actorId: "DEV-ADMIN",
    role: "ADMIN",
  };
}

function toSuccessResponse(
  result: Awaited<ReturnType<typeof cancelPurchaseOrder.execute>>,
): NextResponse<CancelPurchaseOrderSuccessResponse> {
  return NextResponse.json(
    {
      data: {
        purchaseOrderId: result.purchaseOrderId,
        status: result.status,
        canceledAt: result.canceledAt.toISOString(),
        canceledBy: result.canceledBy,
      },
    },
    { status: 200 },
  );
}

function toErrorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse<CancelPurchaseOrderSuccessResponse | ErrorResponse>> {
  const { id } = await context.params;

  if (!id.trim()) {
    return toErrorResponse(
      "INVALID_PURCHASE_ORDER_ID",
      "purchaseOrderId is required",
      400,
    );
  }

  const actor = getDevelopmentActor();

  try {
    const result = await cancelPurchaseOrder.execute({
      purchaseOrderId: id,
      actor,
    });

    return toSuccessResponse(result);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return toErrorResponse("PURCHASE_ORDER_NOT_FOUND", error.message, 404);
    }

    if (error instanceof ForbiddenError) {
      return toErrorResponse("FORBIDDEN", error.message, 403);
    }

    if (
      error instanceof PurchaseOrderAlreadyCanceledError ||
      error instanceof PurchaseOrderCannotBeCanceledError
    ) {
      return toErrorResponse("INVALID_PURCHASE_ORDER_STATE", error.message, 400);
    }

    console.error("Cancel purchase order route failed", {
      purchaseOrderId: id,
      error,
    });

    return toErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "Unexpected error while canceling purchase order",
      500,
    );
  }
}