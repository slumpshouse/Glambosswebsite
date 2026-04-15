import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireAdminToken } from "@/src/lib/require-admin-token";
import type { CustomerSearchResponse } from "@/src/types/customer";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export async function GET(request: Request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({ q: searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const query = parsed.data.q;

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      phone: true,
      instagramHandle: true,
      createdAt: true,
    },
  });

  if (customers.length === 0) {
    const empty: CustomerSearchResponse = {
      query,
      results: [],
    };
    return Response.json(empty);
  }

  const customerIds = customers.map((customer) => customer.id);

  const salesByCustomer = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customerIds } },
    _sum: { totalPrice: true },
    _count: { _all: true },
  });

  const salesMap = new Map(
    salesByCustomer.map((row) => [
      row.customerId,
      {
        totalSpend: row._sum.totalPrice ?? 0,
        purchaseFrequency: row._count._all,
      },
    ])
  );

  const payload: CustomerSearchResponse = {
    query,
    results: customers.map((customer) => {
      const metrics = salesMap.get(customer.id);
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        instagramHandle: customer.instagramHandle,
        totalSpend: metrics?.totalSpend ?? 0,
        purchaseFrequency: metrics?.purchaseFrequency ?? 0,
        createdAt: customer.createdAt.toISOString(),
      };
    }),
  };

  return Response.json(payload);
}
