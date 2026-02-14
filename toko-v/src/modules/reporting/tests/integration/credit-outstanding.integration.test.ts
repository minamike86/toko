import { describe, it, beforeEach, expect } from "vitest";
import { prisma } from "@/shared/prisma";
import { getCreditOutstandingReport } from "../../application/get-credit-outstanding-report";
import { seedCreditOutstandingScenario } from "../helpers/seedCreditOutstandingScenario";

describe.sequential("Credit Outstanding Report – Integration Test", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  it("returns ONLY valid ON_CREDIT outstanding orders", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await seedCreditOutstandingScenario([
      // VALID
      {
        status: "ON_CREDIT",
        outstandingAmount: 100_000,
        totalAmount: 100_000,
        createdAt: now,
      },
      // INVALID: outstanding = 0
      {
        status: "ON_CREDIT",
        outstandingAmount: 0,
        totalAmount: 50_000,
        createdAt: now,
      },
      // INVALID: PAID
      {
        status: "PAID",
        outstandingAmount: 0,
        totalAmount: 75_000,
        createdAt: now,
      },
      // INVALID: outside date range
      {
        status: "ON_CREDIT",
        outstandingAmount: 30_000,
        totalAmount: 30_000,
        createdAt: yesterday,
      },
    ]);

    const report = await getCreditOutstandingReport({
      from: now,
      to: tomorrow,
    });

    expect(report.details).toHaveLength(1);
    expect(report.summary).toEqual({
      totalOutstandingAmount: 100_000,
      totalCreditOrders: 1,
    });
  });
});
