// src/shared/system/SystemStateRepository.ts

export interface SystemStateRepository {
  getMaintenanceMode(): Promise<boolean>
  getMaintenanceInfo(): Promise<{
    enabled: boolean
    updatedAt: Date | null
    updatedBy: string | null
  }>
  setMaintenanceMode(value: boolean, updatedBy: string): Promise<void>
}
