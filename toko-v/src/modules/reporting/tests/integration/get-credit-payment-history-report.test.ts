import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCreditPaymentHistoryMock } = vi.hoisted(() => ({
  findCreditPaymentHistoryMock: vi.fn(),
}));

vi.mock("@/modules/reporting/queries/credit-payment-history.query", () => ({
  findCreditPaymentHistory: findCreditPaymentHistoryMock,
}));

import { getCreditPaymentHistoryReport } from "@/modules/reporting/application/get-credit-payment-history-report";

describe("getCreditPaymentHistoryReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps rows and calculates summary from paidAmount", async () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.999Z");

    findCreditPaymentHistoryMock.mockResolvedValue([
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
      {
        paymentId: "PAY-002",
        orderId: "ORD-001",
        paymentDate: new Date("2026-03-11T10:00:00.000Z"),
        orderDate: new Date("2026-03-01T08:00:00.000Z"),
        orderType: "OFFLINE",
        totalAmount: 100000,
        paidAmount: 60000,
        method: "TRANSFER",
      },
    ]);

    await expect(getCreditPaymentHistoryReport({ from, to })).resolves.toEqual({
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
        {
          paymentId: "PAY-002",
          orderId: "ORD-001",
          paymentDate: new Date("2026-03-11T10:00:00.000Z"),
          orderDate: new Date("2026-03-01T08:00:00.000Z"),
          orderType: "OFFLINE",
          totalAmount: 100000,
          paidAmount: 60000,
          method: "TRANSFER",
        },
      ],
      summary: {
        totalPaidAmount: 100000,
        totalPaidOrders: 2,
      },
    });
  });
});