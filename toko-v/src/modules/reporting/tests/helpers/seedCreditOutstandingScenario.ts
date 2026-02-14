import { prisma } from "@/shared/prisma";

type CreditOutstandingSeedCase = {
  status: "ON_CREDIT" | "PAID";
  outstandingAmount: number;
  totalAmount: number;
  createdAt: Date;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function seedCreditOutstandingScenario(
  cases: CreditOutstandingSeedCase[]
): Promise<void> {
  for (const c of cases) {
    const orderId = uid("ORDER");
    const itemId = uid("ITEM");

    await prisma.order.create({
      data: {
        id: orderId,
        type: "OFFLINE",
        status: c.status,
        totalAmount: c.totalAmount,
        outstandingAmount: c.outstandingAmount,
        createdAt: c.createdAt,
        createdBy: "test-user",
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
          c.status === "PAID"
            ? {
                create: {
                  id: uid("PAY"),
                  amount: c.totalAmount,
                  occurredAt: c.createdAt,
                },
              }
            : undefined,
      },
    });
  }
}
