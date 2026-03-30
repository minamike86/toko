export type CreditPaymentHistoryDetailDTO = {
  paymentId: string;
  orderId: string;
  paymentDate: Date;
  orderDate: Date;
  orderType: string;
  totalAmount: number;
  paidAmount: number;
  method: string;
};

export type CreditPaymentHistorySummaryDTO = {
  totalPaidAmount: number;
  totalPaidOrders: number;
};

export type CreditPaymentHistoryReportDTO = {
  details: CreditPaymentHistoryDetailDTO[];
  summary: CreditPaymentHistorySummaryDTO;
};
