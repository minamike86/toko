import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getWarehouseDashboardMock, getCashClarityDashboardMock } = vi.hoisted(
  () => ({
    getWarehouseDashboardMock: vi.fn(),
    getCashClarityDashboardMock: vi.fn(),
  }),
);

vi.mock("@/modules/dashboard/application/get-warehouse-dashboard", () => ({
  getWarehouseDashboard: getWarehouseDashboardMock,
}));

vi.mock("@/modules/dashboard/application/get-cash-clarity-dashboard", () => ({
  getCashClarityDashboard: getCashClarityDashboardMock,
}));

import Home from "@/app/page";

describe("app/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard using dashboard application layer data", async () => {
    getWarehouseDashboardMock.mockResolvedValue({
      asOf: new Date("2026-04-02T00:00:00.000Z"),
      totalVariants: 1,
      lowStockCount: 1,
      items: [
        {
          variantId: "V001",
          sku: "V001",
          productName: "Produk A",
          variantName: "Default",
          unit: "PCS",
          currentStockQuantity: 5,
          lowStockThreshold: 10,
          isLowStock: true,
        },
      ],
    });

    getCashClarityDashboardMock.mockResolvedValue({
      period: {
        from: new Date("2026-04-01T00:00:00.000Z"),
        to: new Date("2026-04-02T00:00:00.000Z"),
      },
      cashInTotal: 100000,
      paymentEvents: [
        {
          paymentId: "PAY-001",
          paymentDate: new Date("2026-04-02T11:00:00.000Z"),
          amount: 100000,
          method: "LEGACY",
          orderId: "ORD-001",
        },
      ],
      outstandingTotal: 0,
      outstandingOrders: [],
    });

    const page = await Home();
    render(page);

    expect(getWarehouseDashboardMock).toHaveBeenCalledTimes(1);
    expect(getCashClarityDashboardMock).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText("Owner Operational Dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ringkasan Operasional")).toBeInTheDocument();
    expect(screen.getAllByText("Low Stock").length).toBeGreaterThan(0);
    expect(screen.getByText("Cash Clarity")).toBeInTheDocument();
    expect(screen.getAllByText("Outstanding").length).toBeGreaterThan(0);

    expect(screen.getByText("Produk A")).toBeInTheDocument();
    expect(screen.getByText("PCS")).toBeInTheDocument();
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 100.000").length).toBeGreaterThan(0);
  });

  it("renders empty states when warehouse and outstanding data are empty", async () => {
    getWarehouseDashboardMock.mockResolvedValue({
      asOf: new Date("2026-04-02T00:00:00.000Z"),
      totalVariants: 0,
      lowStockCount: 0,
      items: [],
    });

    getCashClarityDashboardMock.mockResolvedValue({
      period: {
        from: new Date("2026-04-01T00:00:00.000Z"),
        to: new Date("2026-04-02T00:00:00.000Z"),
      },
      cashInTotal: 100000,
      paymentEvents: [
        {
          paymentId: "PAY-001",
          paymentDate: new Date("2026-04-02T11:00:00.000Z"),
          amount: 100000,
          method: "LEGACY",
          orderId: "ORD-001",
        },
      ],
      outstandingTotal: 0,
      outstandingOrders: [],
    });

    const page = await Home();
    render(page);

    expect(
      screen.getByText("Tidak ada variant low stock saat ini."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tidak ada order outstanding saat ini."),
    ).toBeInTheDocument();

    expect(screen.getByText("Cash Clarity")).toBeInTheDocument();
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
  });
});