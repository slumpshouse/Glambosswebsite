import { prisma } from "./prisma";
import type {
  WeeklySalesAggregate,
  WeeklyProductVolume,
  CustomerTrendItem,
} from "../types/weekly-sales-summary";

export async function aggregateWeeklySales(): Promise<WeeklySalesAggregate> {
  const weekEnd = new Date();
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totals = sales.reduce(
    (acc, sale) => {
      acc.revenue += sale.totalPrice;
      acc.salesCount += 1;
      acc.unitsSold += sale.quantity;
      return acc;
    },
    { revenue: 0, salesCount: 0, unitsSold: 0 }
  );

  const productMap = new Map<number, WeeklyProductVolume>();
  for (const sale of sales) {
    const current = productMap.get(sale.productId) ?? {
      productId: sale.productId,
      productName: sale.product.name,
      unitsSold: 0,
      revenue: 0,
    };

    current.unitsSold += sale.quantity;
    current.revenue += sale.totalPrice;
    productMap.set(sale.productId, current);
  }

  const productVolume = Array.from(productMap.values()).sort(
    (a, b) => b.unitsSold - a.unitsSold
  );

  const [topInventory, bottomInventory] = await Promise.all([
    prisma.product.findMany({
      orderBy: { stock: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        stock: true,
      },
    }),
    prisma.product.findMany({
      orderBy: { stock: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        stock: true,
      },
    }),
  ]);

  const customerMap = new Map<number, CustomerTrendItem>();
  for (const sale of sales) {
    const current = customerMap.get(sale.customerId) ?? {
      customerId: sale.customerId,
      customerName: sale.customer.name,
      customerPhone: sale.customer.phone,
      orders: 0,
      units: 0,
      revenue: 0,
    };

    current.orders += 1;
    current.units += sale.quantity;
    current.revenue += sale.totalPrice;
    customerMap.set(sale.customerId, current);
  }

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  const repeatCustomers = Array.from(customerMap.values()).filter(
    (trend) => trend.orders > 1
  ).length;

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    totals,
    productVolume,
    inventory: {
      top: topInventory.map((item) => ({
        productId: item.id,
        productName: item.name,
        stock: item.stock,
      })),
      bottom: bottomInventory.map((item) => ({
        productId: item.id,
        productName: item.name,
        stock: item.stock,
      })),
    },
    customerTrends: {
      topCustomers,
      newCustomers,
      repeatCustomers,
    },
  };
}
