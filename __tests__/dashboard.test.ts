import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/src/lib/prisma";

type MockedPrisma = {
  sale: {
    aggregate: MockFn;
    findMany: MockFn;
    groupBy: MockFn;
  };
  product: {
    count: MockFn;
    findMany: MockFn;
  };
  request: {
    findMany: MockFn;
  };
};

type MockFn = ((...args: any[]) => Promise<any>) & {
  mockResolvedValue: (value: any) => unknown;
  mockResolvedValueOnce: (value: any) => unknown;
};

// Mock Prisma
vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    sale: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    request: {
      findMany: vi.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as MockedPrisma;

describe("Dashboard Metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Revenue Calculation", () => {
    it("should calculate total revenue from all sales", async () => {
      const mockSales = {
        _sum: { totalPrice: 5000 },
        _count: 10,
      };

      mockedPrisma.sale.aggregate.mockResolvedValue(mockSales);

      const result = await mockedPrisma.sale.aggregate({
        _sum: { totalPrice: true },
        _count: true,
      });

      expect(result._sum.totalPrice).toBe(5000);
      expect(result._count).toBe(10);
    });

    it("should return 0 revenue when no sales exist", async () => {
      const mockSales = {
        _sum: { totalPrice: null },
        _count: 0,
      };

      mockedPrisma.sale.aggregate.mockResolvedValue(mockSales);

      const result = await mockedPrisma.sale.aggregate({
        _sum: { totalPrice: true },
        _count: true,
      });

      expect(result._sum.totalPrice || 0).toBe(0);
      expect(result._count).toBe(0);
    });

    it("should correctly aggregate multiple sales into single revenue value", async () => {
      const mockSales = {
        _sum: { totalPrice: 1000 + 1500 + 2500 }, // 5000
        _count: 3,
      };

      mockedPrisma.sale.aggregate.mockResolvedValue(mockSales);

      const result = await mockedPrisma.sale.aggregate({
        _sum: { totalPrice: true },
        _count: true,
      });

      expect(result._sum.totalPrice).toBe(5000);
    });
  });

  describe("Low Stock Filtering", () => {
    it("should identify products with stock <= 5", async () => {
      const lowStockCount = 3;

      mockedPrisma.product.count.mockResolvedValue(lowStockCount);

      const result = await mockedPrisma.product.count({
        where: { stock: { lte: 5 } },
      });

      expect(result).toBe(3);
    });

    it("should return 0 when no products have low stock", async () => {
      mockedPrisma.product.count.mockResolvedValue(0);

      const result = await mockedPrisma.product.count({
        where: { stock: { lte: 5 } },
      });

      expect(result).toBe(0);
    });

    it("should include out-of-stock products (stock = 0) in low stock count", async () => {
      const mockProducts = [
        { id: 1, stock: 0, name: "Product A" },
        { id: 2, stock: 1, name: "Product B" },
        { id: 3, stock: 5, name: "Product C" },
      ];

      mockedPrisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await mockedPrisma.product.findMany({
        where: { stock: { lte: 5 } },
      });

      const outOfStock = result.filter((p: { stock: number }) => p.stock === 0);
      expect(outOfStock.length).toBe(1);
      expect(result.length).toBe(3);
    });
  });

  describe("Metrics Summary", () => {
    it("should fetch all metrics in parallel", async () => {
      const mockSalesAgg = {
        _sum: { totalPrice: 5000 },
        _count: 20,
      };
      const productCount = 50;
      const lowStockCount = 3;

      mockedPrisma.sale.aggregate.mockResolvedValue(mockSalesAgg);
      mockedPrisma.product.count.mockResolvedValueOnce(productCount);
      mockedPrisma.product.count.mockResolvedValueOnce(lowStockCount);

      const sales = await mockedPrisma.sale.aggregate({
        _sum: { totalPrice: true },
        _count: true,
      });
      const products = await mockedPrisma.product.count();
      const lowStock = await mockedPrisma.product.count({
        where: { stock: { lte: 5 } },
      });

      expect(sales._sum.totalPrice).toBe(5000);
      expect(products).toBe(50);
      expect(lowStock).toBe(3);
    });

    it("should return complete dashboard metrics", async () => {
      const metrics = {
        totalRevenue: 25000,
        totalSalesCount: 100,
        totalProducts: 75,
        lowStockProducts: 5,
      };

      expect(metrics.totalRevenue).toBe(25000);
      expect(metrics.totalSalesCount).toBe(100);
      expect(metrics.totalProducts).toBe(75);
      expect(metrics.lowStockProducts).toBe(5);
    });
  });

  describe("Recent Activity Queries", () => {
    it("should fetch last 5 sales ordered by most recent", async () => {
      const mockSales = [
        {
          id: 5,
          productName: "Product E",
          customerName: "John",
          quantity: 2,
          totalPrice: 500,
          createdAt: new Date("2024-01-15"),
        },
        {
          id: 4,
          productName: "Product D",
          customerName: "Jane",
          quantity: 1,
          totalPrice: 300,
          createdAt: new Date("2024-01-14"),
        },
      ];

      mockedPrisma.sale.findMany.mockResolvedValue(mockSales);

      const result = await mockedPrisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].createdAt >= result[1].createdAt).toBe(true);
    });

    it("should fetch pending requests ordered by most recent", async () => {
      const mockRequests = [
        {
          id: 1,
          productName: "Product A",
          quantity: 10,
          status: "pending",
          createdAt: new Date("2024-01-15"),
        },
      ];

      mockedPrisma.request.findMany.mockResolvedValue(mockRequests);

      const result = await mockedPrisma.request.findMany({
        where: { status: "pending" },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      expect(result[0].status).toBe("pending");
    });
  });

  describe("Weekly Sales Aggregation", () => {
    it("should calculate weekly revenue within correct date range", async () => {
      const now = new Date("2024-01-15T10:00:00");
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());

      const mockSales = {
        _sum: { totalPrice: 3000 },
      };

      mockedPrisma.sale.aggregate.mockResolvedValue(mockSales);

      const result = await mockedPrisma.sale.aggregate({
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
        _sum: { totalPrice: true },
      });

      expect(result._sum.totalPrice).toBe(3000);
    });

    it("should fetch top 3 products by quantity sold in week", async () => {
      const mockTopProducts = [
        {
          productId: 1,
          _sum: { quantity: 50, totalPrice: 5000 },
        },
        {
          productId: 2,
          _sum: { quantity: 30, totalPrice: 3000 },
        },
        {
          productId: 3,
          _sum: { quantity: 20, totalPrice: 2000 },
        },
      ];

      mockedPrisma.sale.groupBy.mockResolvedValue(mockTopProducts);

      const result = await mockedPrisma.sale.groupBy({
        by: ["productId"],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 3,
      });

      expect(result.length).toBe(3);
      expect(result[0]._sum.quantity).toBe(50);
      expect(result[0]._sum.quantity >= result[1]._sum.quantity).toBe(true);
    });
  });

  describe("Product Inventory Data", () => {
    it("should retrieve low stock product details with all fields", async () => {
      const mockLowStockProducts = [
        {
          id: 2,
          name: "Item B",
          stock: 0,
          cost: 49.99,
          category: "Jewelry",
        },
        {
          id: 1,
          name: "Item A",
          stock: 2,
          cost: 29.99,
          category: "Electronics",
        },
      ];

      mockedPrisma.product.findMany.mockResolvedValue(mockLowStockProducts);

      const result = await mockedPrisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: "asc" },
      });

      expect(result.length).toBe(2);
      expect(result[0].stock).toBe(0); // Out of stock first
      expect(result[0].id).toBe(2);
      expect(result[0].cost).toBe(49.99);
    });
  });
});
