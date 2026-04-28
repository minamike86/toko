import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@/shared/errors/ApplicationError";

const payCreditExecute = vi.fn();
const getOrderOutstandingMock = vi.fn();

vi.mock("@/wiring/container", () => ({
  payCredit: {
    execute: payCreditExecute,
  },
}));

vi.mock("@/modules/reporting/application/get-order-outstanding", () => ({
  getOrderOutstanding: getOrderOutstandingMock,
}));

describe("POST /api/orders/[id]/pay-credit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mengembalikan 404 saat order tidak ditemukan", async () => {
    getOrderOutstandingMock.mockResolvedValue(null);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-404/pay-credit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "ORD-404" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "NotFoundError",
      message: "Order not found: ORD-404",
    });

    expect(payCreditExecute).not.toHaveBeenCalled();
  });

  it("mengembalikan 200 saat pelunasan credit sukses", async () => {
    getOrderOutstandingMock.mockResolvedValue({
      orderId: "ORD-1",
      outstandingAmount: 10000,
    });
    payCreditExecute.mockResolvedValue(undefined);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-1/pay-credit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "ORD-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });

    expect(payCreditExecute).toHaveBeenCalledTimes(1);
    expect(payCreditExecute).toHaveBeenCalledWith({
      orderId: "ORD-1",
      amount: 10000,
      paidAt: expect.any(Date),
      method: "CASH",
      actor: {
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      },
    });
  });

  it("mengembalikan 403 saat role tidak berhak", async () => {
    getOrderOutstandingMock.mockResolvedValue({
      orderId: "ORD-2",
      outstandingAmount: 5000,
    });
    payCreditExecute.mockRejectedValue(new ForbiddenError());

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-2/pay-credit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId: "WH-1",
        role: "WAREHOUSE",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "ORD-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "ForbiddenError",
      message: "Forbidden",
    });
  });
});