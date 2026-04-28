export type CreditOutstandingDetailDTO = {
  orderId: string;
  createdAt: Date;
  orderType: string;
  totalAmount: number;
  outstandingAmount: number;
};

export type CreditOutstandingSummaryDTO = {
  totalOutstandingAmount: number;
  totalCreditOrders: number;
};

export type CreditOutstandingReportDTO = {
  details: CreditOutstandingDetailDTO[];
  summary: CreditOutstandingSummaryDTO;
};
