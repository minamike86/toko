// src/shared/system/types/actor-context.ts

import { UserRole } from "@/modules/user/domain/UserRole";

export type ActorContext = {
  actorId: string;
  role: UserRole;
};