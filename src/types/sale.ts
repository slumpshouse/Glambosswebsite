export type SaleListItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  product: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    name: string | null;
    phone: string;
  };
};
