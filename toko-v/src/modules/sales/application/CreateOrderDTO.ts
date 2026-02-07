import { OrderType } from "../domain/OrderType";

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  orderId: string;
  type: OrderType;
  payment: "CASH" | "CREDIT";
  items: CreateOrderItemInput[];
  createdBy: string;
  createdAt?: Date;
};

export type CreateOrderResult = {
  orderId: string;
  status: string;
  totalAmount: number;
  outstandingAmount: number;
};
