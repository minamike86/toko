import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCreditPaymentHistoryReportMock,
  getCreditOutstandingReportMock,
} = vi.hoisted(() => ({
  getCreditPaymentHistoryReportMock: vi.fn(),
  getCreditOutstandingReportMock: vi.fn(),
}));

vi.mock("@/modules/reporting/application/get-credit-payment-history-report", () => ({
  getCreditPaymentHistoryReport: getCreditPaymentHistoryReportMock,
}));

vi.mock("@/modules/reporting/application/get-credit-outstanding-report", () => ({
  getCreditOutstandingReport: getCreditOutstandingReportMock,
}));

import { getCashClarityDashboard } from "@/modules/dashboard/application/get-cash-clarity-dashboard";

describe("getCashClarityDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("composes cash clarity from reporting only", async () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.999Z");

    getCreditPaymentHistoryReportMock.mockResolvedValue({
      details: [
        {
          paymentId: "PAY-001",
          orderId: "ORD-001",
          paymentDate: new Date("2026-03-10T10:00:00.000Z"),
          orderDate: new Date("2026-03-01T08:00:00.000Z"),
          orderType: "OFFLINE",
          totalAmount: 100000,
          paidAmount: 40000,
          method: "CASH",
        },
      ],
      summary: {
        totalPaidAmount: 40000,
        totalPaidOrders: 1,
      },
    });

    getCreditOutstandingReportMock.mockResolvedValue({
      details: [
        {
          orderId: "ORD-002",
          createdAt: new Date("2026-03-05T09:00:00.000Z"),
          orderType: "OFFLINE",
          totalAmount: 200000,
          outstandingAmount: 50000,
        },
      ],
      summary: {
        totalOutstandingAmount: 50000,
        totalCreditOrders: 1,
      },
    });

    await expect(getCashClarityDashboard({ from, to })).resolves.toEqual({
      period: { from, to },
      cashInTotal: 40000,
      paymentEvents: [
        {
          paymentId: "PAY-001",
          orderId: "ORD-001",
          paymentDate: new Date("2026-03-10T10:00:00.000Z"),
          amount: 40000,
          method: "CASH",
        },
      ],
      outstandingTotal: 50000,
      outstandingOrders: [
        {
          orderId: "ORD-002",
          createdAt: new Date("2026-03-05T09:00:00.000Z"),
          totalAmount: 200000,
          outstandingAmount: 50000,
        },
      ],
    });
  });
});