import { prisma } from "@/shared/prisma";

export type CreditPaymentHistoryRow = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};

export async function findCreditPaymentHistory(params: {
  from: Date;
  to: Date;
}): Promise<CreditPaymentHistoryRow[]> {
  const { from, to } = params;

  const payments = await prisma.payment.findMany({
    where: {
      paidAt: {
        gte: from,
        lte: to,
      },
      order: {
        status: "PAID",
      },
    },
    select: {
      id: true,
      amount: true,
      paidAt: true,
      method: true,
      order: {
        select: {
          id: true,
          createdAt: true,
          type: true,
          totalAmount: true,
        },
      },
    },
    orderBy: [{ paidAt: "asc" }, { id: "asc" }],
  });

  return payments.map((p) => ({
    paymentId: p.id,
    orderId: p.order.id,
    paymentDate: p.paidAt,
    orderDate: p.order.createdAt,
    orderType: p.order.type,
    totalAmount: p.order.totalAmount,
    paidAmount: p.amount,
    method: p.method,
  }));
}