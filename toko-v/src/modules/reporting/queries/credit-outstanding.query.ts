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
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: params.from,
        lte: params.to,
      },
      outstandingAmount: {
        gt: 0,
      },
      status: {
        in: ["ON_CREDIT", "PAID"],
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      createdAt: true,
      type: true,
      totalAmount: true,
      outstandingAmount: true,
    },
  });

  return orders.map((order) => ({
    orderId: order.id,
    orderDate: order.createdAt,
    orderType: order.type,
    totalAmount: order.totalAmount,
    outstandingAmount: order.outstandingAmount,
  }));
}