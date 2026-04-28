import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";
import { getSupplierOutstanding } from "@/wiring/container";
import { parseActorContext } from "@/shared/delivery/parse-actor-context";
import { Step7BusinessError } from "@/modules/procurement/domain/payable/Step7Errors";

vi.mock("@/wiring/container", () => ({
  getSupplierOutstanding: {
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

function makeRequest(): NextRequest {
  return new NextRequest(
    "http://localhost/api/procurement/purchase-orders/PO-1/outstanding",
    {
      method: "GET",
    },
  );
}

describe("GET /api/procurement/purchase-orders/[id]/outstanding", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(parseActorContext).mockReturnValue({
      actorId: "ADMIN-1",
      role: "ADMIN",
    });
  });

  it("returns 200 when outstanding is retrieved", async () => {
    const execute = vi.mocked(getSupplierOutstanding.execute);

    execute.mockResolvedValue({
      supplierId: "SUP-1",
      supplierStoreName: "Supplier A",
      totalOutstanding: 70_000,
      purchaseOrders: [
        {
          purchaseOrderId: "PO-1",
          receivedAt: new Date("2026-04-01T00:00:00.000Z"),
          payableInitial: 100_000,
          totalPaid: 20_000,
          totalReturned: 10_000,
          outstanding: 70_000,
        },
      ],
    });

    const response = await GET(makeRequest(), makeContext("PO-1"));
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toMatchObject({
      supplierId: "SUP-1",
      supplierStoreName: "Supplier A",
      totalOutstanding: 70_000,
      purchaseOrders: [
        {
          purchaseOrderId: "PO-1",
          payableInitial: 100_000,
          totalPaid: 20_000,
          totalReturned: 10_000,
          outstanding: 70_000,
        },
      ],
    });

    expect(execute).toHaveBeenCalledWith({
      supplierId: "PO-1", // NOTE: param id dipakai sebagai supplierId di route ini
      actor: {
        actorId: "ADMIN-1",
        role: "ADMIN",
      },
    });
  });

  it("returns error response when actor context is invalid", async () => {
    const execute = vi.mocked(getSupplierOutstanding.execute);

    vi.mocked(parseActorContext).mockImplementationOnce(() => {
      throw new Error("Actor ID is required.");
    });

    const response = await GET(makeRequest(), makeContext("PO-1"));
    const body = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("error");

    expect(execute).not.toHaveBeenCalled();
  });

  it("maps use case business error to HTTP response", async () => {
    const execute = vi.mocked(getSupplierOutstanding.execute);

    execute.mockRejectedValue(
      new Step7BusinessError(
        "SUPPLIER_NOT_FOUND",
        "Supplier was not found.",
      ),
    );

    const response = await GET(makeRequest(), makeContext("PO-1"));
    const body = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body).toHaveProperty("error");

    expect(execute).toHaveBeenCalledTimes(1);
  });
});