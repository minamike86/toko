// src/modules/sales/application/guards/AuthorizationGuard.ts

import { DomainError } from '@/shared/errors/DomainError'

export type Role = 'ADMIN' | 'KASIR'

export interface Actor {
  id: string
  role: Role
}

export class AuthorizationGuard {
  static allowRoles(
    actor: Actor,
    allowedRoles: Role[],
  ): void {
    if (!allowedRoles.includes(actor.role)) {
      throw new DomainError('FORBIDDEN')
    }
  }
}
