import { NextRequest, NextResponse } from "next/server";

import { getSupplierOutstanding } from "@/wiring/container";
import { mapHttpError } from "@/shared/delivery/map-http-error";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const actor = parseActorContext(request);

    const result = await getSupplierOutstanding.execute({
      supplierId: id,
      actor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const mappedError = mapHttpError(error);
    return NextResponse.json(mappedError.body, { status: mappedError.status });
  }
}