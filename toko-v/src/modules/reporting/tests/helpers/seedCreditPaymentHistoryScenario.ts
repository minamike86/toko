import { prisma } from "@/shared/prisma";

type CreditPaymentHistorySeedCase = {
  status: "PAID" | "ON_CREDIT";
  totalAmount: number;
  paidAmount?: number;
  createdAt: Date;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function seedCreditPaymentHistoryScenario(
  cases: CreditPaymentHistorySeedCase[]
): Promise<void> {
  for (const c of cases) {
    const orderId = uid("ORDER");
    const itemId = uid("ITEM");
    const paymentId = uid("PAY");

    const paidAmount = c.paidAmount ?? c.totalAmount;
    const outstandingAmount =
      c.status === "PAID" ? 0 : Math.max(c.totalAmount - paidAmount, 0);

    await prisma.order.create({
      data: {
        id: orderId,
        type: "OFFLINE",
        status: c.status,
        totalAmount: c.totalAmount,
        outstandingAmount,
        createdAt: c.createdAt,
        createdBy: "test-user",
        version: 0,
        items: {
          create: {
            id: itemId,
            productId: uid("P"),
            productNameSnapshot: "Test Product",
            unitSnapshot: "pcs",
            unitPriceSnapshot: c.totalAmount,
            quantity: 1,
            subtotal: c.totalAmount,
          },
        },
        payments:
          paidAmount > 0
            ? {
              create: {
                id: paymentId,
                amount: paidAmount,
                paidAt: c.createdAt,
                method: "LEGACY",
                createdAt: c.createdAt,
              },
            }
            : undefined,
      },
    });
  }
}
