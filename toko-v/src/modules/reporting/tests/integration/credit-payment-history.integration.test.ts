import { describe, it, beforeEach, expect } from "vitest";
import { prisma } from "@/shared/prisma";
import { getCreditPaymentHistoryReport } from "../../application/get-credit-payment-history-report";
import { seedCreditPaymentHistoryScenario } from "../helpers/seedCreditPaymentHistoryScenario";

describe.sequential("Credit Payment History Report – Integration Test", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
  });

  it("returns only PAID payments within range", async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await seedCreditPaymentHistoryScenario([
      {
        status: "PAID",
        totalAmount: 100_000,
        createdAt: now,
      },
      {
        status: "ON_CREDIT",
        totalAmount: 50_000,
        createdAt: now,
      },
    ]);

    const report = await getCreditPaymentHistoryReport({
      from: now,
      to: tomorrow,
    });

    expect(report.details).toHaveLength(1);
    expect(report.summary.totalPaidAmount).toBe(100_000);
  });
});
