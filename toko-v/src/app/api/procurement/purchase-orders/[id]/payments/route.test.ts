import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";
import { recordSupplierPayment } from "@/wiring/container";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { Step7BusinessError } from "@/modules/procurement/domain/payable/Step7Errors";

vi.mock("@/wiring/container", () => ({
  recordSupplierPayment: {
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
    "http://localhost/api/procurement/purchase-orders/PO-1/payments",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

describe("POST /api/procurement/purchase-orders/[id]/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(parseActorContext).mockReturnValue({
      actorId: "ADMIN-1",
      role: "ADMIN",
    });
  });

  it("returns 201 when supplier payment is recorded", async () => {
    const execute = vi.mocked(recordSupplierPayment.execute);

    execute.mockResolvedValue({
      purchaseOrderId: "PO-1",
      supplierId: "SUP-1",
      paidAmount: 30_000,
      payableInitial: 100_000,
      totalPaid: 30_000,
      totalReturned: 0,
      outstanding: 70_000,
      paymentId: "PAY-1",
      paidAt: new Date("2026-04-26T00:00:00.000Z"),
    });

    const response = await POST(
      makeRequest({
        amount: 30_000,
        paidAt: "2026-04-26T00:00:00.000Z",
        notes: "bank transfer",
      }),
      makeContext("PO-1"),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      purchaseOrderId: "PO-1",
      supplierId: "SUP-1",
      paidAmount: 30_000,
      payableInitial: 100_000,
      totalPaid: 30_000,
      totalReturned: 0,
      outstanding: 70_000,
      paymentId: "PAY-1",
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({
      purchaseOrderId: "PO-1",
      amount: 30_000,
      paidAt: new Date("2026-04-26T00:00:00.000Z"),
      notes: "bank transfer",
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });
  });

  it("returns error response when actor context is invalid", async () => {
    const execute = vi.mocked(recordSupplierPayment.execute);

    vi.mocked(parseActorContext).mockImplementationOnce(() => {
      throw new Error("Actor ID is required.");
    });

    const response = await POST(
      makeRequest({
        amount: 30_000,
        paidAt: "2026-04-26T00:00:00.000Z",
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
    const execute = vi.mocked(recordSupplierPayment.execute);

    execute.mockRejectedValue(
      new Step7BusinessError(
        "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING",
        "Supplier payment exceeds current outstanding.",
      ),
    );

    const response = await POST(
      makeRequest({
        amount: 120_000,
        paidAt: "2026-04-26T00:00:00.000Z",
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