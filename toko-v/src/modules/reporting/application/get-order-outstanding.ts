import { findOrderOutstandingById } from "@/modules/reporting/queries/get-order-outstanding.query";

export async function getOrderOutstanding(orderId: string) {
  return findOrderOutstandingById(orderId);
}