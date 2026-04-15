import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSaleFindMany, mockProductFindMany, mockCustomerCount } = vi.hoisted(() => ({
  mockSaleFindMany: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockCustomerCount: vi.fn(),
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    sale: {
      findMany: mockSaleFindMany,
    },
    product: {
      findMany: mockProductFindMany,
    },
    customer: {
      count: mockCustomerCount,
    },
  },
}));

import { aggregateWeeklySales } from "../src/lib/weekly-sales-aggregation";

describe("weekly sales aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSaleFindMany.mockResolvedValue([
      {
        productId: 1,
        customerId: 10,
        quantity: 2,
        totalPrice: 40,
        product: { id: 1, name: "Wig" },
        customer: { id: 10, name: "Ada", phone: "555-1000" },
      },
      {
        productId: 1,
        customerId: 10,
        quantity: 1,
        totalPrice: 20,
        product: { id: 1, name: "Wig" },
        customer: { id: 10, name: "Ada", phone: "555-1000" },
      },
      {
        productId: 2,
        customerId: 11,
        quantity: 3,
        totalPrice: 30,
        product: { id: 2, name: "Lashes" },
        customer: { id: 11, name: "Bea", phone: "555-2000" },
      },
    ]);

    mockProductFindMany.mockImplementation(async (args: { orderBy: { stock: "asc" | "desc" } }) => {
      if (args.orderBy.stock === "desc") {
        return [
          { id: 3, name: "Extensions", stock: 20 },
          { id: 1, name: "Wig", stock: 12 },
        ];
      }

      return [
        { id: 4, name: "Gel", stock: 1 },
        { id: 2, name: "Lashes", stock: 3 },
      ];
    });

    mockCustomerCount.mockResolvedValue(2);
  });

  it("aggregates all weekly sales and matches expected total revenue", async () => {
    const result = await aggregateWeeklySales();

    expect(result.totals.revenue).toBe(90);
    expect(result.totals.salesCount).toBe(3);
    expect(result.totals.unitsSold).toBe(6);
  });

  it("calculates product-level sales volume correctly", async () => {
    const result = await aggregateWeeklySales();

    expect(result.productVolume).toEqual([
      {
        productId: 1,
        productName: "Wig",
        unitsSold: 3,
        revenue: 60,
      },
      {
        productId: 2,
        productName: "Lashes",
        unitsSold: 3,
        revenue: 30,
      },
    ]);
  });

  it("identifies high and low performing products correctly from inventory snapshots", async () => {
    const result = await aggregateWeeklySales();

    expect(result.inventory.top[0]).toEqual({
      productId: 3,
      productName: "Extensions",
      stock: 20,
    });
    expect(result.inventory.bottom[0]).toEqual({
      productId: 4,
      productName: "Gel",
      stock: 1,
    });
  });

  it("computes customer purchasing trends (frequency and spend)", async () => {
    const result = await aggregateWeeklySales();

    expect(result.customerTrends.newCustomers).toBe(2);
    expect(result.customerTrends.repeatCustomers).toBe(1);
    expect(result.customerTrends.topCustomers).toContainEqual({
      customerId: 10,
      customerName: "Ada",
      customerPhone: "555-1000",
      orders: 2,
      units: 3,
      revenue: 60,
    });
  });
});
