export const PURCHASE_ORDER_STATUSES = {
  CREATED: "CREATED",
  RECEIVED: "RECEIVED",
  CANCELED: "CANCELED",
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[keyof typeof PURCHASE_ORDER_STATUSES];

export function isPurchaseOrderStatus(
  value: string,
): value is PurchaseOrderStatus {
  return Object.values(PURCHASE_ORDER_STATUSES).includes(
    value as PurchaseOrderStatus,
  );
}