import { NextResponse } from "next/server";
import { getWarehouseDashboard } from "@/modules/dashboard/application/get-warehouse-dashboard";

export async function GET() {
  const data = await getWarehouseDashboard();

  return NextResponse.json(data, { status: 200 });
}