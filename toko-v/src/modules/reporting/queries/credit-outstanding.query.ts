// src/modules/reporting/queries/credit-outstanding.query.ts
import { prisma } from "@/shared/prisma";

export type CreditOutstandingRow = {
  orderId: string;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};

export async function findCreditOutstanding(params: {
  from: Date;
  to: Date;
}): Promise<CreditOutstandingRow[]> {
  const { from, to } = params;

  const orders = await prisma.order.findMany({
    where: {
      status: "ON_CREDIT",
      outstandingAmount: {
        gt: 0,
      },
      createdAt: {
        gte: from,
        lte: to,
      },
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      totalAmount: true,
      outstandingAmount: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return orders.map((o) => ({
    orderId: o.id,
    orderDate: o.createdAt,
    orderType: o.type,
    totalAmount: o.totalAmount,
    outstandingAmount: o.outstandingAmount,
  }));
}
