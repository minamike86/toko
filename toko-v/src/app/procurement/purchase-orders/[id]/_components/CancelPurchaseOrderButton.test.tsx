import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CancelPurchaseOrderButton } from "./CancelPurchaseOrderButton";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      refresh: refreshMock,
    }),
  };
});

describe("CancelPurchaseOrderButton", () => {
  const originalFetch = global.fetch;
  const confirmSpy = vi.spyOn(window, "confirm");

  beforeEach(() => {
    vi.clearAllMocks();
    confirmSpy.mockReturnValue(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not render when status is not CREATED", () => {
    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="RECEIVED"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Batalkan Purchase Order" }),
    ).toBeNull();
  });

  it("renders button when status is CREATED", () => {
    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Batalkan Purchase Order" }),
    ).toBeInTheDocument();
  });

  it("does nothing when confirmation is rejected", async () => {
    confirmSpy.mockReturnValue(false);
    global.fetch = vi.fn();

    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Purchase Order" }),
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
      expect(refreshMock).not.toHaveBeenCalled();
    });
  });

  it("calls cancel API and refreshes router when request succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          purchaseOrderId: "PO-001",
          status: "CANCELED",
          canceledAt: "2026-04-08T10:00:00.000Z",
          canceledBy: "DEV-ADMIN",
        },
      }),
    } as Response);

    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Purchase Order" }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/procurement/purchase-orders/PO-001/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows API error message when request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "INVALID_PURCHASE_ORDER_STATE",
          message: "Purchase order cannot be canceled",
        },
      }),
    } as Response);

    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Purchase Order" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Purchase order cannot be canceled"),
      ).toBeInTheDocument();
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows generic message when network request throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Batalkan Purchase Order" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Gagal menghubungi server."),
      ).toBeInTheDocument();
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("disables button while request is running", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(
      <CancelPurchaseOrderButton
        purchaseOrderId="PO-001"
        status="CREATED"
      />,
    );

    const button = screen.getByRole("button", {
      name: "Batalkan Purchase Order",
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Membatalkan..." }),
      ).toBeDisabled();
    });

    if (!resolveFetch) {
      throw new Error("resolveFetch was not assigned");
    }

    resolveFetch({
      ok: true,
      json: async () => ({
        data: {
          purchaseOrderId: "PO-001",
          status: "CANCELED",
          canceledAt: "2026-04-08T10:00:00.000Z",
          canceledBy: "DEV-ADMIN",
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

});