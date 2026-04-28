import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";
import { handlePurchaseReturn } from "@/wiring/container";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { Step7BusinessError } from "@/modules/procurement/domain/payable/Step7Errors";

vi.mock("@/wiring/container", () => ({
  handlePurchaseReturn: {
    execute: vi.fn(),
  },
}));

vi.mock("@/shared/delivery/parse-actor-context", () => ({
  parseActorContext: vi.fn(),
}));

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function makeContext(id: string): RouteContext {
  return {
    params: Promise.resolve({ id }),
  };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost/api/procurement/purchase-orders/PO-1/returns",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/procurement/purchase-orders/[id]/returns", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(parseActorContext).mockReturnValue({
      actorId: "ADMIN-1",
      role: "ADMIN",
    });
  });

  it("returns 201 when purchase return reduction is handled", async () => {
    const execute = vi.mocked(handlePurchaseReturn.execute);

    execute.mockResolvedValue({
      purchaseOrderId: "PO-1",
      supplierId: "SUP-1",
      returnId: "RET-1",
      reducedAmount: 20_000,
      payableInitial: 100_000,
      totalPaid: 0,
      totalReturned: 20_000,
      outstanding: 80_000,
      returnedAt: new Date("2026-04-26T00:00:00.000Z"),
    });

    const response = await POST(
      makeRequest({
        returnItems: [
          {
            purchaseItemId: "PI-1",
            quantity: 2,
            reason: "damaged",
          },
        ],
        returnedAt: "2026-04-26T00:00:00.000Z",
        notes: "supplier accepted return",
      }),
      makeContext("PO-1"),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      purchaseOrderId: "PO-1",
      supplierId: "SUP-1",
      returnId: "RET-1",
      reducedAmount: 20_000,
      payableInitial: 100_000,
      totalPaid: 0,
      totalReturned: 20_000,
      outstanding: 80_000,
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({
      purchaseOrderId: "PO-1",
      returnItems: [
        {
          purchaseItemId: "PI-1",
          quantity: 2,
          reason: "damaged",
        },
      ],
      returnedAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "supplier accepted return",
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });
  });

  it("returns error response when actor context is invalid", async () => {
    const execute = vi.mocked(handlePurchaseReturn.execute);

    vi.mocked(parseActorContext).mockImplementationOnce(() => {
      throw new Error("Actor ID is required.");
    });

    const response = await POST(
      makeRequest({
        returnItems: [
          {
            purchaseItemId: "PI-1",
            quantity: 1,
            reason: null,
          },
        ],
        returnedAt: "2026-04-26T00:00:00.000Z",
        notes: null,
      }),
      makeContext("PO-1"),
    );

    const body = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("error");
    expect(execute).not.toHaveBeenCalled();
  });

  it("maps use case business error to HTTP response", async () => {
    const execute = vi.mocked(handlePurchaseReturn.execute);

    execute.mockRejectedValue(
      new Step7BusinessError(
        "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING",
        "Purchase return reduction exceeds current outstanding.",
      ),
    );

    const response = await POST(
      makeRequest({
        returnItems: [
          {
            purchaseItemId: "PI-1",
            quantity: 99,
            reason: null,
          },
        ],
        returnedAt: "2026-04-26T00:00:00.000Z",
        notes: null,
      }),
      makeContext("PO-1"),
    );

    const body = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("error");
    expect(execute).toHaveBeenCalledTimes(1);
  });
});