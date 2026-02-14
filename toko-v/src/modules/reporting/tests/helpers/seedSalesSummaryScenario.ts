import { prisma } from "@/shared/prisma";

type SalesSummarySeedCase = {
  orderType: "OFFLINE" | "ONLINE";
  amount: number;
  occurredAt: Date;
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

    await prisma.order.create({
      data: {
        id: orderId,
        type: c.orderType,
        status: "PAID",
        totalAmount: c.amount,
        outstandingAmount: 0,
        createdAt: c.occurredAt,
        createdBy: "test-user",
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
            id: uid("PAY"),
            amount: c.amount,
            occurredAt: c.occurredAt,
          },
        },
      },
    });
  }
}
