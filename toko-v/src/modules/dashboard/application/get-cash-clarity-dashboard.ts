import { getCreditOutstandingReport } from "@/modules/reporting/application/get-credit-outstanding-report";
import { getCreditPaymentHistoryReport } from "@/modules/reporting/application/get-credit-payment-history-report";
import type { CashClarityDTO } from "../dto/cash-clarity.dto";

export async function getCashClarityDashboard(params: {
  from: Date;
  to: Date;
}): Promise<CashClarityDTO> {
  const payment = await getCreditPaymentHistoryReport(params);
  const outstanding = await getCreditOutstandingReport(params);

  const paymentEvents = payment.details.map((detail) => ({
    paymentId: detail.paymentId,
    orderId: detail.orderId,
    paymentDate: detail.paymentDate,
    amount: detail.paidAmount,
    method: detail.method,
  }));

  const cashInTotal = paymentEvents.reduce(
    (sum, paymentEvent) => sum + paymentEvent.amount,
    0,
  );

  const outstandingOrders = outstanding.details.map((detail) => ({
    orderId: detail.orderId,
    createdAt: detail.createdAt,
    totalAmount: detail.totalAmount,
    outstandingAmount: detail.outstandingAmount,
  }));

  return {
    period: params,
    cashInTotal,
    paymentEvents,
    outstandingTotal: outstanding.summary.totalOutstandingAmount,
    outstandingOrders,
  };
}
