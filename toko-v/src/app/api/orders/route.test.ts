import { beforeEach, describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/shared/errors/ApplicationError";
import { InsufficientStockError } from "@/modules/inventory/domain/InventoryErrors";

const createOrderExecute = vi.fn();
const listPosOrdersMock = vi.fn();

vi.mock("@/wiring/container", () => ({
  createOrder: {
    execute: createOrderExecute,
  },
}));

vi.mock("@/modules/reporting/application/ListPosOrders", () => ({
  listPosOrders: listPosOrdersMock,
}));

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mengembalikan 201 saat create order sukses", async () => {
    createOrderExecute.mockResolvedValue({
      orderId: "ORD-1",
      status: "PAID",
      totalAmount: 10000,
      outstandingAmount: 0,
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: "ORD-1",
        type: "OFFLINE",
        payment: "CASH",
        items: [{ variantId: "V001", quantity: 1 }],
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      orderId: "ORD-1",
      status: "PAID",
      totalAmount: 10000,
      outstandingAmount: 0,
    });

    expect(createOrderExecute).toHaveBeenCalledTimes(1);
    expect(createOrderExecute).toHaveBeenCalledWith({
      orderId: "ORD-1",
      type: "OFFLINE",
      payment: "CASH",
      items: [{ variantId: "V001", quantity: 1 }],
      actor: {
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      },
    });
  });

  it("mengembalikan 409 saat stok tidak cukup", async () => {
    createOrderExecute.mockRejectedValue(
      new InsufficientStockError("V001"),
    );

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: "ORD-2",
        type: "OFFLINE",
        payment: "CASH",
        items: [{ variantId: "V001", quantity: 2 }],
        actorId: "POS-OPERATOR-001",
        role: "SALES",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "InsufficientStockError",
      message: "Stok tidak mencukupi untuk variant V001.",
    });
  });

  it("mengembalikan 400 saat actor context invalid", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: "ORD-3",
        type: "OFFLINE",
        payment: "CASH",
        items: [{ variantId: "V001", quantity: 1 }],
        actorId: "",
        role: "SALES",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "ValidationError",
      message: "Actor ID is required.",
    });

    expect(createOrderExecute).not.toHaveBeenCalled();
  });

  it("mengembalikan 400 saat role actor invalid", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: "ORD-4",
        type: "OFFLINE",
        payment: "CASH",
        items: [{ variantId: "V001", quantity: 1 }],
        actorId: "POS-OPERATOR-001",
        role: "OWNER",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "ValidationError",
      message: "Actor role is invalid.",
    });

    expect(createOrderExecute).not.toHaveBeenCalled();
  });
});