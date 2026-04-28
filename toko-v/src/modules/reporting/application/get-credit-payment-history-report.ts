import type {
  CreditPaymentHistoryDetailDTO,
  CreditPaymentHistoryReportDTO,
} from "@/modules/reporting/dto/credit-payment-history.dto";
import { findCreditPaymentHistory } from "@/modules/reporting/queries/credit-payment-history.query";

export async function getCreditPaymentHistoryReport(params: {
  from: Date;
  to: Date;
}): Promise<CreditPaymentHistoryReportDTO> {
  const rows = await findCreditPaymentHistory(params);

  const details: CreditPaymentHistoryDetailDTO[] = rows.map((row) => ({
    paymentId: row.paymentId,
    orderId: row.orderId,
    paymentDate: row.paymentDate,
    orderDate: row.orderDate,
    orderType: row.orderType,
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    method: row.method,
  }));

  const totalPaidAmount = details.reduce(
    (sum, detail) => sum + detail.paidAmount,
    0,
  );

  return {
    details,
    summary: {
      totalPaidAmount,
      totalPaidOrders: details.length,
    },
  };
}