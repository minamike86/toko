// src/shared/system/PrismaSystemStateRepository.ts

import { PrismaClient } from "@prisma/client"
import { SystemStateRepository } from "./SystemStateRepository"

export class PrismaSystemStateRepository implements SystemStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMaintenanceMode(): Promise<boolean> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: "maintenance_mode" }
    })

    if (!setting) return false

    return setting.value === "true"
  }

  async setMaintenanceMode(value: boolean, updatedBy: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key: "maintenance_mode" },
      update: {
        value: value ? "true" : "false",
        updatedBy
      },
      create: {
        key: "maintenance_mode",
        value: value ? "true" : "false",
        updatedBy
      }
    })
  }

  async getMaintenanceInfo() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: "maintenance_mode" }
    })

    if (!setting) {
      return {
        enabled: false,
        updatedAt: null,
        updatedBy: null
      }
    }

    return {
      enabled: setting.value === "true",
      updatedAt: setting.updatedAt,
      updatedBy: setting.updatedBy
    }
  }

}
