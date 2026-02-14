// src/modules/reporting/dto/credit-outstanding.dto.ts

export type CreditOutstandingDetailDTO = {
  orderId: string;
  orderDate: Date;
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
