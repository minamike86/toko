// src/modules/reporting/queries/sales-summary.query.ts
import { prisma } from "@/shared/prisma";

export type SalesSummaryRow = {
  period: string;
  orderType: string;
  totalSalesAmount: number;
  totalPaidOrders: number;
};

export async function findSalesSummary(params: {
  from: Date;
  to: Date;
}): Promise<SalesSummaryRow[]> {
  const { from, to } = params;

  const payments = await prisma.payment.findMany({
    where: {
      occurredAt: {
        gte: from,
        lte: to,
      },
      order: {
        status: "PAID",
      },
    },
    select: {
      amount: true,
      occurredAt: true,
      order: {
        select: {
          type: true,
        },
      },
    },
  });

  // Grouping manual (jelas, tidak sihir)
  const bucket = new Map<string, SalesSummaryRow>();

  for (const p of payments) {
    const date = p.occurredAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${date}|${p.order.type}`;

    const current =
      bucket.get(key) ?? {
        period: date,
        orderType: p.order.type,
        totalSalesAmount: 0,
        totalPaidOrders: 0,
      };

    current.totalSalesAmount += p.amount;
    current.totalPaidOrders += 1;

    bucket.set(key, current);
  }

  return Array.from(bucket.values()).sort((a, b) =>
    a.period.localeCompare(b.period)
  );
}
