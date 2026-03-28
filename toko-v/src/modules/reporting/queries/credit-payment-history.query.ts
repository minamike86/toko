// src/modules/reporting/queries/credit-payment-history.query.ts
import { prisma } from "@/shared/prisma";

export type CreditPaymentHistoryRow = {
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
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
      amount: true,
      paidAt: true,
      order: {
        select: {
          id: true,
          createdAt: true,
          type: true,
          totalAmount: true,
        },
      },
    },
    orderBy: {
      paidAt: "asc",
    },
  });

  return payments.map((p) => ({
    orderId: p.order.id,
    paymentDate: p.paidAt,
    orderDate: p.order.createdAt,
    orderType: p.order.type,
    totalAmount: p.order.totalAmount,
    paidAmount: p.amount,
  }));
}
