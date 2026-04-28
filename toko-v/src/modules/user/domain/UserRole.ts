// src/modules/user/domain/UserRole.ts

export const UserRole = {
  ADMIN: "ADMIN",
  SALES: "SALES",
  WAREHOUSE: "WAREHOUSE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];