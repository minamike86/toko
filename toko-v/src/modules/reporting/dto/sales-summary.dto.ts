// src/modules/reporting/dto/sales-summary.dto.ts

export type SalesSummaryRowDTO = {
  period: string; // YYYY-MM-DD
  orderType?: string;
  totalSalesAmount: number;
  totalPaidOrders: number;
};

export type SalesSummaryReportDTO = {
  rows: SalesSummaryRowDTO[];
};
