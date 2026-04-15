export type ProductRequestStatus = "pending" | "approved" | "rejected" | "completed";

export type ProductRequest = {
  id: number;
  productId: number;
  quantity: number;
  status: ProductRequestStatus;
  customerId: number | null;
  createdAt: string;
};

export type ProductRequestInput = {
  productId: number;
  quantity: number;
  customerId?: number;
};

export type PendingProductRequest = ProductRequest & {
  product: {
    id: number;
    name: string;
    stock: number;
  };
};
