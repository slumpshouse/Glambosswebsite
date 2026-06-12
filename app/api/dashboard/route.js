import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * Fetch dashboard metrics and recent activity
 * Protected endpoint - requires admin authentication
 */
export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch metrics in parallel
    const [
      metrics,
      recentSales,
      lowStockItems,
      weeklySalesOverview,
    ] = await Promise.all([
      fetchMetrics(),
      fetchRecentSales(),
      fetchLowStockItems(),
      fetchWeeklySalesOverview(),
    ]);

    const summary = {
      metrics,
      recentSales,
      lowStockItems,
      weeklySalesOverview,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

async function fetchMetrics() {
  const [totalSales, productCount, lowStockCount] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.product.count(),
    prisma.product.count({
      where: { stock: { lte: 5 } },
    }),
  ]);

  return {
    totalRevenue: totalSales._sum.totalPrice || 0,
    totalSalesCount: totalSales._count,
    totalProducts: productCount,
    lowStockProducts: lowStockCount,
  };
}

async function fetchRecentSales() {
  const sales = await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  return sales.map((sale) => ({
    id: sale.id,
    productName: sale.product.name,
    customerName: sale.customer.name || null,
    quantity: sale.quantity,
    totalPrice: sale.totalPrice,
    paymentStatus: sale.paymentStatus,
    createdAt: sale.createdAt,
  }));
}

async function fetchLowStockItems() {
  const products = await prisma.product.findMany({
    where: { stock: { lte: 5 } },
    orderBy: { stock: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    stock: product.stock,
    cost: product.cost,
    category: product.category,
  }));
}

async function fetchWeeklySalesOverview() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Calculate weekly revenue
  const weeklySales = await prisma.sale.aggregate({
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    _sum: { totalPrice: true },
  });

  // Get top 3 products by quantity sold in this week
  const topProducts = await prisma.sale.groupBy({
    by: ["productId"],
    where: {
      createdAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 3,
  });

  // Fetch product details for top products
  const topProductDetails = await prisma.product.findMany({
    where: {
      id: { in: topProducts.map((p) => p.productId) },
    },
  });

  const topProductsWithDetails = topProducts.map((tp) => {
    const product = topProductDetails.find((p) => p.id === tp.productId);
    return {
      id: tp.productId,
      name: product?.name || "Unknown",
      totalQuantitySold: tp._sum.quantity || 0,
      totalRevenue: tp._sum.totalPrice || 0,
    };
  });

  return {
    weeklyRevenue: weeklySales._sum.totalPrice || 0,
    topProducts: topProductsWithDetails,
  };
}
