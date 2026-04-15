import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "@/shared/errors/ApplicationError";
import {
  PurchaseOrderAlreadyCanceledError,
  PurchaseOrderCannotBeCanceledError,
} from "@/modules/procurement/domain/ProcurementErrors";

const { executeMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
  };
});

vi.mock("@/wiring/container", () => {
  return {
    cancelPurchaseOrder: {
      execute: executeMock,
    },
  };
});

import { POST } from "./route";

describe("procurement cancel purchase order route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createContext(id: string) {
    return {
      params: Promise.resolve({ id }),
    };
  }

  it("returns 200 when cancel purchase order succeeds", async () => {
    const canceledAt = new Date("2026-04-08T10:00:00.000Z");

    executeMock.mockResolvedValue({
      purchaseOrderId: "PO-001",
      status: "CANCELED",
      canceledAt,
      canceledBy: "DEV-ADMIN",
    });

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-001/cancel", {
        method: "POST",
      }),
      createContext("PO-001"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledWith({
      purchaseOrderId: "PO-001",
      actor: {
        actorId: "DEV-ADMIN",
        role: "ADMIN",
      },
    });

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      data: {
        purchaseOrderId: "PO-001",
        status: "CANCELED",
        canceledAt: canceledAt.toISOString(),
        canceledBy: "DEV-ADMIN",
      },
    });
  });

  it("returns 400 when purchaseOrderId param is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/ /cancel", {
        method: "POST",
      }),
      createContext(" "),
    );

    expect(executeMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_PURCHASE_ORDER_ID",
        message: "purchaseOrderId is required",
      },
    });
  });

  it("returns 404 when purchase order is not found", async () => {
    const error = new NotFoundError("PurchaseOrder", "PO-404");
    executeMock.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-404/cancel", {
        method: "POST",
      }),
      createContext("PO-404"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PURCHASE_ORDER_NOT_FOUND",
        message: error.message,
      },
    });
  });

  it("returns 403 when actor is forbidden", async () => {
    const error = new ForbiddenError();
    executeMock.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-001/cancel", {
        method: "POST",
      }),
      createContext("PO-001"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(403);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "FORBIDDEN",
        message: error.message,
      },
    });
  });

  it("returns 400 when purchase order state cannot be canceled", async () => {
    const error = new PurchaseOrderCannotBeCanceledError();
    executeMock.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-001/cancel", {
        method: "POST",
      }),
      createContext("PO-001"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_PURCHASE_ORDER_STATE",
        message: error.message,
      },
    });
  });

  it("returns 400 when purchase order is already canceled", async () => {
    const error = new PurchaseOrderAlreadyCanceledError();
    executeMock.mockRejectedValue(error);

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-001/cancel", {
        method: "POST",
      }),
      createContext("PO-001"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_PURCHASE_ORDER_STATE",
        message: error.message,
      },
    });
  });

  it("returns 500 for unexpected error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    executeMock.mockRejectedValue(new Error("database down"));

    const response = await POST(
      new Request("http://localhost/api/procurement/purchase-orders/PO-001/cancel", {
        method: "POST",
      }),
      createContext("PO-001"),
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error while canceling purchase order",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});