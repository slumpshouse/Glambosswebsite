export type CustomerSearchItem = {
  id: number;
  name: string | null;
  phone: string;
  instagramHandle: string | null;
  totalSpend: number;
  purchaseFrequency: number;
  createdAt: string;
};

export type CustomerSearchResponse = {
  query: string;
  results: CustomerSearchItem[];
};

export type CustomerPurchaseHistoryItem = {
  saleId: number;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
};

export type CustomerDetailResponse = {
  customer: {
    id: number;
    name: string | null;
    phone: string;
    instagramHandle: string | null;
    createdAt: string;
  };
  metrics: {
    totalLifetimeSpend: number;
    purchaseFrequency: number;
  };
  purchaseHistory: CustomerPurchaseHistoryItem[];
  hasMore: boolean;
};
