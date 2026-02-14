// src/modules/reporting/application/get-credit-payment-history-report.ts
import {
  CreditPaymentHistoryReportDTO,
  CreditPaymentHistoryDetailDTO,
} from "../dto/credit-payment-history.dto";
import { findCreditPaymentHistory } from "../queries/credit-payment-history.query";

export async function getCreditPaymentHistoryReport(params: {
  from: Date;
  to: Date;
}): Promise<CreditPaymentHistoryReportDTO> {
  const rows = await findCreditPaymentHistory(params);

  const details: CreditPaymentHistoryDetailDTO[] = rows.map((r) => ({
    orderId: r.orderId,
    paymentDate: r.paymentDate,
    orderDate: r.orderDate,
    orderType: r.orderType,
    totalAmount: r.totalAmount,
    paidAmount: r.paidAmount,
  }));

  const summary = {
    totalPaidAmount: details.reduce((sum, d) => sum + d.paidAmount, 0),
    totalPaidOrders: details.length,
  };

  return {
    details,
    summary,
  };
}
