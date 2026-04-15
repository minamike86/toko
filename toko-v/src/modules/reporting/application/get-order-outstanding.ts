import { findOrderOutstanding } from "@/modules/reporting/queries/get-order-outstanding.query";

export type OrderOutstandingDTO = {
  orderId: string;
  outstandingAmount: number;
};

export async function getOrderOutstanding(
  orderId: string,
): Promise<OrderOutstandingDTO | null> {
  const row = await findOrderOutstanding(orderId);

  if (!row) {
    return null;
  }

  return {
    orderId: row.orderId,
    outstandingAmount: row.outstandingAmount,
  };
}