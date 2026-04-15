import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireAdminToken } from "@/src/lib/require-admin-token";
import type { CustomerDetailResponse } from "@/src/types/customer";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(context.params);
  const parsedParams = paramsSchema.safeParse(resolvedParams);

  if (!parsedParams.success) {
    return Response.json(
      { error: "Invalid customer id", details: parsedParams.error.flatten() },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsedQuery.success) {
    return Response.json(
      { error: "Invalid query params", details: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  const customerId = parsedParams.data.id;
  const limit = parsedQuery.data.limit ?? 50;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      instagramHandle: true,
      createdAt: true,
    },
  });

  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  const [summary, sales] = await Promise.all([
    prisma.sale.aggregate({
      where: { customerId },
      _sum: { totalPrice: true },
      _count: { _all: true },
    }),
    prisma.sale.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: {
        id: true,
        quantity: true,
        totalPrice: true,
        createdAt: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const hasMore = sales.length > limit;
  const slicedSales = hasMore ? sales.slice(0, limit) : sales;

  const payload: CustomerDetailResponse = {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      instagramHandle: customer.instagramHandle,
      createdAt: customer.createdAt.toISOString(),
    },
    metrics: {
      totalLifetimeSpend: summary._sum.totalPrice ?? 0,
      purchaseFrequency: summary._count._all,
    },
    purchaseHistory: slicedSales.map((sale) => ({
      saleId: sale.id,
      productName: sale.product.name,
      quantity: sale.quantity,
      totalPrice: sale.totalPrice,
      createdAt: sale.createdAt.toISOString(),
    })),
    hasMore,
  };

  return Response.json(payload);
}
