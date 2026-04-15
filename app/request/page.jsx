import { CustomerRequestForm } from "@/app/components/CustomerRequestForm";
import { prisma } from "@/src/lib/prisma";

export default async function RequestPage() {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <CustomerRequestForm
        initialProducts={products}
        showBackLink
        backHref="/"
      />
    </main>
  );
}
