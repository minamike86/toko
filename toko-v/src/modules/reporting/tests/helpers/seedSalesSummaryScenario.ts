import { prisma } from "@/shared/prisma";

type SalesSummarySeedCase = {
  orderType: "OFFLINE" | "ONLINE";
  amount: number;
  paidAt: Date;
  createdAt?: Date; // legacy compatibility for old tests
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function seedSalesSummaryScenario(
  cases: SalesSummarySeedCase[]
): Promise<void> {
  for (const c of cases) {
    const orderId = uid("ORDER");
    const itemId = uid("ITEM");
    const paymentId = uid("PAY");

    const timestamp = c.paidAt ?? c.createdAt;

    if (!timestamp) {
      throw new Error(
        "seedSalesSummaryScenario requires paidAt or createdAt",
      );
    }

    await prisma.order.create({
      data: {
        id: orderId,
        type: c.orderType,
        status: "PAID",
        totalAmount: c.amount,
        outstandingAmount: 0,
        createdAt: timestamp,
        createdBy: "test-user",
        version: 0,
        items: {
          create: {
            id: itemId,
            productId: uid("P"),
            productNameSnapshot: "Test Product",
            unitSnapshot: "pcs",
            unitPriceSnapshot: c.amount,
            quantity: 1,
            subtotal: c.amount,
          },
        },
        payments: {
          create: {
            id: paymentId,
            amount: c.amount,
            paidAt: timestamp,
            method: "LEGACY",
            createdAt: timestamp,
          },
        },
      },
    });
  }
}
