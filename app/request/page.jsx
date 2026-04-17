import { CustomerRequestForm } from "@/app/components/CustomerRequestForm";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  let products = [];
  let loadError = null;

  try {
    products = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  } catch (error) {
    console.error("[RequestPage] Failed to load products", error);
    loadError = "Products are temporarily unavailable. You can refresh and try again in a moment.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      {loadError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {loadError}
        </div>
      )}
      <CustomerRequestForm
        initialProducts={products}
        showBackLink
        backHref="/"
      />
    </main>
  );
}
