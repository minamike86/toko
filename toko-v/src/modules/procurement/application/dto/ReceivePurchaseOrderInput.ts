import type { UserRole } from "@/modules/user/domain/UserRole";

export type ReceivePurchaseOrderInput = {
  purchaseOrderId: string;
  receivedAt?: Date;
  actor: {
    actorId: string;
    role: UserRole;
  };
};