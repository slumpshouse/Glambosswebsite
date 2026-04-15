export type ManualSaleInput = {
  productId: number;
  quantity: number;
  customerPhone: string;
  customerName?: string;
};

export type ManualSaleResult = {
  sale: {
    id: number;
    requestId: number | null;
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
