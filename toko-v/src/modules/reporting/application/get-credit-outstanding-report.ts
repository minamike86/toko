// src/modules/reporting/application/get-credit-outstanding-report.ts
import {
  CreditOutstandingReportDTO,
  CreditOutstandingDetailDTO,
} from "../dto/credit-outstanding.dto";
import { findCreditOutstanding } from "../queries/credit-outstanding.query";

export async function getCreditOutstandingReport(params: {
  from: Date;
  to: Date;
}): Promise<CreditOutstandingReportDTO> {
  const rows = await findCreditOutstanding(params);

  const details: CreditOutstandingDetailDTO[] = rows.map((r) => ({
    orderId: r.orderId,
    orderDate: r.orderDate,
    orderType: r.orderType,
    totalAmount: r.totalAmount,
    outstandingAmount: r.outstandingAmount,
  }));

  const summary = {
    totalOutstandingAmount: details.reduce(
      (sum, d) => sum + d.outstandingAmount,
      0
    ),
    totalCreditOrders: details.length,
  };

  return {
    details,
    summary,
  };
}
