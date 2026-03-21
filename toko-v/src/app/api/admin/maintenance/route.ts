// src/app/api/admin/maintenance/route.ts

import { NextRequest, NextResponse } from "next/server"
import { PrismaSystemStateRepository } from "@/shared/system/PrismaSystemStateRepository"
import { ToggleMaintenance } from "@/shared/system/application/ToggleMaintenance"
import { prisma } from "@/shared/prisma"

const repo = new PrismaSystemStateRepository(prisma)

export async function GET() {
  const info = await repo.getMaintenanceInfo()

  return NextResponse.json(info)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // TODO: ambil actor dari auth middleware kamu
  const actor = {
    id: "admin-id",
    role: "ADMIN"
  }

  const useCase = new ToggleMaintenance(repo)

  await useCase.execute({
    enabled: body.enabled,
    actorId: actor.id,
    actorRole: actor.role
  })

  return NextResponse.json({ success: true })
}
