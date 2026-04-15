import { prisma } from "@/shared/prisma";

export type OrderOutstandingRow = {
  orderId: string;
  outstandingAmount: number;
};

export async function findOrderOutstanding(
  orderId: string,
): Promise<OrderOutstandingRow | null> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      outstandingAmount: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    orderId: row.id,
    outstandingAmount: row.outstandingAmount,
  };
}