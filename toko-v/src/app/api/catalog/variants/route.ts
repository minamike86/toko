import { NextResponse } from "next/server";
import { listPosVariants } from "@/wiring/container";

export async function GET() {
  const variants = await listPosVariants.execute();

  return NextResponse.json(variants, { status: 200 });
}