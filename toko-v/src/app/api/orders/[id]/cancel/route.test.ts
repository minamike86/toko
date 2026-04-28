import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ForbiddenError,
  ValidationError,
} from "@/shared/errors/ApplicationError";

const cancelOrderExecute = vi.fn();

vi.mock("@/wiring/container", () => ({
  cancelOrder: {
    execute: cancelOrderExecute,
  },
}));

describe("POST /api/orders/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mengembalikan 200 saat SALES membatalkan order", async () => {
    cancelOrderExecute.mockResolvedValue({
      orderId: "ORD-1",
      status: "CANCELED",
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-1/cancel", {
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
    expect(body).toEqual({
      orderId: "ORD-1",
      status: "CANCELED",
    });

    expect(cancelOrderExecute).toHaveBeenCalledWith({
      orderId: "ORD-1",
      actor: {
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      },
    });
  });

  it("mengembalikan 400 saat actor context invalid", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-2/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId: "",
        role: "SALES",
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "ORD-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "ValidationError",
      message: "Actor ID is required.",
    });

    expect(cancelOrderExecute).not.toHaveBeenCalled();
  });

  it("mengembalikan 403 saat role tidak berhak", async () => {
    cancelOrderExecute.mockRejectedValue(new ForbiddenError());

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders/ORD-3/cancel", {
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
      params: Promise.resolve({ id: "ORD-3" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: "ForbiddenError",
      message: "Forbidden",
    });
  });
});