export type ConfirmPendingRequestInput = {
  requestId: number;
  customerPhone: string;
  customerName?: string;
};

export type ConfirmPendingRequestResult = {
  request: {
    id: number;
    status: "completed";
    productId: number;
    quantity: number;
    customerId: number | null;
  };
  sale: {
    id: number;
    requestId: number;
    productId: number;
    customerId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };
  customer: {
    id: number;
    phone: string;
    name: string | null;
  };
};
