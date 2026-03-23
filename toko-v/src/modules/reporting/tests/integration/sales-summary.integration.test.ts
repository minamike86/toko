// src/modules/reporting/tests/integration/sales-summary.integration.test.ts
import { describe, it, beforeEach, expect } from "vitest";
import { prisma } from "@/shared/prisma";
import { getSalesSummaryReport } from "../../application/get-sales-summary-report";
import { seedSalesSummaryScenario } from "../helpers/seedSalesSummaryScenario";

describe.sequential("Sales Summary Report – Integration Test", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  it("groups PAID sales by day and order type", async () => {
    await seedSalesSummaryScenario([
      {
        orderType: "OFFLINE",
        amount: 100_000,
        paidAt: new Date("2024-01-01T10:00:00.000Z"),
      },
      {
        orderType: "ONLINE",
        amount: 50_000,
        paidAt: new Date("2024-01-01T11:00:00.000Z"),
      },
    ]);

    const report = await getSalesSummaryReport({
      from: new Date("2024-01-01T00:00:00Z"),
      to: new Date("2024-01-03T00:00:00Z"),
    });

    expect(report).toEqual({
      rows: [
        {
          period: "2024-01-01",
          orderType: "OFFLINE",
          totalPaidOrders: 1,
          totalSalesAmount: 100000,
        },
        {
          period: "2024-01-01",
          orderType: "ONLINE",
          totalPaidOrders: 1,
          totalSalesAmount: 50000,
        },
      ],
    });
  });
});