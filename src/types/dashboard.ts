export type DashboardMetrics = {
  totalRevenue: number;
  totalSalesCount: number;
  totalProducts: number;
  lowStockProducts: number;
};

export type DashboardSummary = {
  metrics: DashboardMetrics;
  recentSales: RecentSale[];
  pendingRequests: PendingRequest[];
  lowStockItems: LowStockItem[];
  weeklySalesOverview: WeeklySalesOverview;
};

export type RecentSale = {
  id: number;
  productName: string;
  customerName: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
};

export type PendingRequest = {
  id: number;
  productName: string;
  quantity: number;
  status: string;
  createdAt: Date;
};

export type LowStockItem = {
  id: number;
  name: string;
  stock: number;
  cost: number;
  category: string;
};

export type WeeklySalesOverview = {
  weeklyRevenue: number;
  topProducts: TopProduct[];
};

export type TopProduct = {
  id: number;
  name: string;
  totalQuantitySold: number;
  totalRevenue: number;
};
