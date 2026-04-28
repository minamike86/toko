import { prisma } from "@/shared/prisma";

export type PosOrderStatusFilter =
  | "ALL"
  | "ON_CREDIT"
  | "PAID"
  | "CANCELED";

export type PosOrderListRow = {
  id: string;
  status: string;
  createdAt: Date;
  totalAmount: number;
  outstandingAmount: number;
  type: string;
};

export async function listPosOrdersQuery(
  status: PosOrderStatusFilter,
): Promise<PosOrderListRow[]> {
  const rows = await prisma.order.findMany({
    where:
      status !== "ALL"
        ? {
          status,
        }
        : undefined,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      totalAmount: true,
      outstandingAmount: true,
      type: true,
    },
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    totalAmount: row.totalAmount,
    outstandingAmount: row.outstandingAmount,
    type: row.type,
  }));
}