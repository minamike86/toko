import { prisma } from "@/shared/prisma";

export type OrderOutstandingRow = {
  orderId: string;
  createdAt: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};

export async function findOrderOutstandingById(
  orderId: string,
): Promise<OrderOutstandingRow | null> {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      totalAmount: true,
      outstandingAmount: true,
    },
  });

  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    createdAt: order.createdAt,
    orderType: order.type,
    totalAmount: order.totalAmount,
    outstandingAmount: order.outstandingAmount,
  };
}