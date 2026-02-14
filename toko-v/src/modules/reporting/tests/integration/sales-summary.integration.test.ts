// src/modules/reporting/tests/integration/sales-summary.integration.test.ts
import { describe, it, beforeEach,  expect } from "vitest";
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
    const day1 = new Date("2024-01-01T10:00:00Z");
    const day2 = new Date("2024-01-02T10:00:00Z");

    await seedSalesSummaryScenario([
      {
        orderType: "OFFLINE",
        amount: 100_000,
        occurredAt: day1,
      },
      {
        orderType: "ONLINE",
        amount: 50_000,
        occurredAt: day2,
      },
    ]);

    const report = await getSalesSummaryReport({
      from: new Date("2024-01-01T00:00:00Z"),
      to: new Date("2024-01-03T00:00:00Z"),
    });

    expect(report.rows).toHaveLength(2);
  });
});
