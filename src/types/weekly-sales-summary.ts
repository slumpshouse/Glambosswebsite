export type WeeklyProductVolume = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
};

export type InventorySnapshotItem = {
  productId: number;
  productName: string;
  stock: number;
};

export type CustomerTrendItem = {
  customerId: number;
  customerName: string | null;
  customerPhone: string;
  orders: number;
  units: number;
  revenue: number;
};

export type WeeklySalesAggregate = {
  weekStart: string;
  weekEnd: string;
  totals: {
    revenue: number;
    salesCount: number;
    unitsSold: number;
  };
  productVolume: WeeklyProductVolume[];
  inventory: {
    top: InventorySnapshotItem[];
    bottom: InventorySnapshotItem[];
  };
  customerTrends: {
    topCustomers: CustomerTrendItem[];
    newCustomers: number;
    repeatCustomers: number;
  };
};

export type AiWeeklySummaryStructured = {
  headline: string;
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendedActions: string[];
};

export type WeeklySummaryPayload = {
  aggregate: WeeklySalesAggregate;
  structured: AiWeeklySummaryStructured;
  editableSummary: string;
};
