import { getToken } from "next-auth/jwt";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  const token = await getToken({
    req: request as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sales = await prisma.sale.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      createdAt: true,
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
  });

  return Response.json(sales);
}
