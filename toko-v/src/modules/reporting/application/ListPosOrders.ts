import {
  listPosOrdersQuery,
  type PosOrderListRow,
  type PosOrderStatusFilter,
} from "@/modules/reporting/queries/list-pos-orders.query";

export type ListPosOrdersInput = {
  status: PosOrderStatusFilter;
};

export async function listPosOrders(
  input: ListPosOrdersInput,
): Promise<PosOrderListRow[]> {
  return listPosOrdersQuery(input.status);
}