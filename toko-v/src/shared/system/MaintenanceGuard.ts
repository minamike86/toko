// src/shared/system/MaintenanceGuard.ts

import { SystemStateRepository } from "./SystemStateRepository"

export class MaintenanceGuard {
  constructor(private readonly systemState: SystemStateRepository) {}

  async ensureWriteAllowed(): Promise<void> {
    const maintenance = await this.systemState.getMaintenanceMode()

    if (maintenance) {
      throw new Error("System is under maintenance")
    }
  }
}
