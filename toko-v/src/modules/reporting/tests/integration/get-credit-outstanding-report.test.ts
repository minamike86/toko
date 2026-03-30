import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCreditOutstandingMock } = vi.hoisted(() => ({
  findCreditOutstandingMock: vi.fn(),
}));

vi.mock("@/modules/reporting/queries/credit-outstanding.query", () => ({
  findCreditOutstanding: findCreditOutstandingMock,
}));

import { getCreditOutstandingReport } from "@/modules/reporting/application/get-credit-outstanding-report";

describe("getCreditOutstandingReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps orderDate to createdAt and calculates summary", async () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.999Z");

    findCreditOutstandingMock.mockResolvedValue([
      {
        orderId: "ORD-001",
        orderDate: new Date("2026-03-05T09:00:00.000Z"),
        orderType: "OFFLINE",
        totalAmount: 200000,
        outstandingAmount: 50000,
      },
    ]);

    await expect(getCreditOutstandingReport({ from, to })).resolves.toEqual({
      details: [
        {
          orderId: "ORD-001",
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
  });
});