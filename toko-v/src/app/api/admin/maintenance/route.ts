// src/app/api/admin/maintenance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { systemStateRepo, toggleMaintenance } from "@/wiring/container";

export async function GET() {
  const info = await systemStateRepo.getMaintenanceInfo();

  return NextResponse.json(info);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const actor = {
    id: "admin-id",
    role: "ADMIN" as const,
  };

  await toggleMaintenance.execute({
    enabled: body.enabled,
    actorId: actor.id,
    actorRole: actor.role,
  });

  return NextResponse.json({ success: true });
}