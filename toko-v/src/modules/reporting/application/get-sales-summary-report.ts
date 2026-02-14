// src/modules/reporting/application/get-sales-summary-report.ts
import { SalesSummaryReportDTO } from "../dto/sales-summary.dto";
import { findSalesSummary } from "../queries/sales-summary.query";

export async function getSalesSummaryReport(params: {
  from: Date;
  to: Date;
}): Promise<SalesSummaryReportDTO> {
  const rows = await findSalesSummary(params);

  return {
    rows: rows.map((r) => ({
      period: r.period,
      orderType: r.orderType,
      totalSalesAmount: r.totalSalesAmount,
      totalPaidOrders: r.totalPaidOrders,
    })),
  };
}
