export type CashClarityDTO = {
  period: {
    from: Date;
    to: Date;
  };
  cashInTotal: number;
  paymentEvents: {
    paymentId: string;
    orderId: string;
    paymentDate: Date;
    amount: number;
    method: string;
  }[];
  outstandingTotal: number;
  outstandingOrders: {
    orderId: string;
    createdAt: Date;
    totalAmount: number;
    outstandingAmount: number;
  }[];
};
