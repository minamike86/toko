import type {
  CreditOutstandingDetailDTO,
  CreditOutstandingReportDTO,
} from "@/modules/reporting/dto/credit-outstanding.dto";
import { findCreditOutstanding } from "@/modules/reporting/queries/credit-outstanding.query";

export async function getCreditOutstandingReport(params: {
  from: Date;
  to: Date;
}): Promise<CreditOutstandingReportDTO> {
  const rows = await findCreditOutstanding(params);

  const details: CreditOutstandingDetailDTO[] = rows.map((row) => ({
    orderId: row.orderId,
    createdAt: row.orderDate,
    orderType: row.orderType,
    totalAmount: row.totalAmount,
    outstandingAmount: row.outstandingAmount,
  }));

  const totalOutstandingAmount = details.reduce(
    (sum, detail) => sum + detail.outstandingAmount,
    0,
  );

  return {
    details,
    summary: {
      totalOutstandingAmount,
      totalCreditOrders: details.length,
    },
  };
}