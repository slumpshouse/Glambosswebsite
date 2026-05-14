import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { requireAdminToken } from "@/src/lib/require-admin-token";
import { normalizePhone } from "@/src/lib/phone-normalization";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});

export async function GET(request) {
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
    return Response.json({ query, results: [] });
  }

  const normalizedPhones = new Set(customers.map((customer) => normalizePhone(customer.phone)));

  const allCustomers = await prisma.customer.findMany({
    select: {
      id: true,
      phone: true,
    },
  });

  const relatedCustomerIds = allCustomers
    .filter((customer) => normalizedPhones.has(normalizePhone(customer.phone)))
    .map((customer) => customer.id);

  const customerIds = relatedCustomerIds.length > 0
    ? relatedCustomerIds
    : customers.map((customer) => customer.id);

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

  const customerMetricsByNormalizedPhone = new Map();

  for (const customer of allCustomers) {
    const normalizedPhone = normalizePhone(customer.phone);
    if (!normalizedPhones.has(normalizedPhone)) {
      continue;
    }

    const existing = customerMetricsByNormalizedPhone.get(normalizedPhone) ?? {
      totalSpend: 0,
      purchaseFrequency: 0,
    };

    const directMetrics = salesMap.get(customer.id);
    existing.totalSpend += directMetrics?.totalSpend ?? 0;
    existing.purchaseFrequency += directMetrics?.purchaseFrequency ?? 0;
    customerMetricsByNormalizedPhone.set(normalizedPhone, existing);
  }

  const payload = {
    query,
    results: customers.map((customer) => {
      const metrics = customerMetricsByNormalizedPhone.get(normalizePhone(customer.phone));
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
