import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { LowStockList } from "@/components/dashboard/LowStockList";
import { CashClarityList } from "@/components/dashboard/CashClarityList";
import { OutstandingList } from "@/components/dashboard/OutstandingList";
import { getWarehouseDashboard } from "@/modules/dashboard/application/get-warehouse-dashboard";
import { getCashClarityDashboard } from "@/modules/dashboard/application/get-cash-clarity-dashboard";

export const dynamic = "force-dynamic";

function getCurrentMonthPeriod(): { from: Date; to: Date } {
  const now = new Date();

  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  };
}

export default async function Home() {
  const cashPeriod = getCurrentMonthPeriod();

  const [warehouseDashboard, cashClarityDashboard] = await Promise.all([
    getWarehouseDashboard(),
    getCashClarityDashboard(cashPeriod),
  ]);

  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Owner Operational Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Visibilitas operasional harian (stock, cash, outstanding).
        </p>
      </header>

      <SummaryCards
        totalVariants={warehouseDashboard.totalVariants}
        lowStockCount={warehouseDashboard.lowStockCount}
        cashInTotal={cashClarityDashboard.cashInTotal}
        outstandingTotal={cashClarityDashboard.outstandingTotal}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <LowStockList items={warehouseDashboard.items} />
        <OutstandingList
          outstandingTotal={cashClarityDashboard.outstandingTotal}
          outstandingOrders={cashClarityDashboard.outstandingOrders}
        />
      </div>

      <CashClarityList
        period={cashClarityDashboard.period}
        cashInTotal={cashClarityDashboard.cashInTotal}
        paymentEvents={cashClarityDashboard.paymentEvents}
      />
    </main>
  );
}