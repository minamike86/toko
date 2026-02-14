// src/modules/reporting/dto/credit-payment-history.dto.ts

export type CreditPaymentHistoryDetailDTO = {
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
};

export type CreditPaymentHistorySummaryDTO = {
  totalPaidAmount: number;
  totalPaidOrders: number;
};

export type CreditPaymentHistoryReportDTO = {
  details: CreditPaymentHistoryDetailDTO[];
  summary: CreditPaymentHistorySummaryDTO;
};
