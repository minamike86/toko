import { SystemStateRepository } from "@/shared/system/SystemStateRepository"

export class ToggleMaintenance {
  constructor(private readonly systemState: SystemStateRepository) {}

  async execute(input: {
    enabled: boolean
    actorId: string
    actorRole: string
  }) {
    if (input.actorRole !== "ADMIN") {
      throw new Error("Forbidden")
    }

    await this.systemState.setMaintenanceMode(
      input.enabled,
      input.actorId
    )
  }
}
