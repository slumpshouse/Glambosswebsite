import { notFound } from "next/navigation";
import PaymentCheckout from "@/app/components/PaymentCheckout";
import { requireCustomerSalesAccess } from "@/src/lib/payment-authorization";

export const dynamic = "force-dynamic";

function parseSaleIds(searchParams) {
  const raw = String(searchParams?.sales ?? "");

  return raw
    .split(",")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export default async function CartPaymentPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const saleIds = parseSaleIds(resolvedSearchParams);

  if (saleIds.length === 0) {
    notFound();
  }

  const access = await requireCustomerSalesAccess(saleIds);
  if (!access.authorized) {
    notFound();
  }

  const sales = access.sales;
  const customer = sales[0].customer;

  const totalPrice = sales.reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <PaymentCheckout
        sale={{
          id: sales[0].id,
          saleIds: sales.map((sale) => sale.id),
          totalPrice,
          paymentStatus: sales.every((sale) => sale.paymentStatus === "paid")
            ? "paid"
            : "pending",
          customerName: customer.name,
          customerPhone: customer.phone,
          items: sales.map((sale) => ({
            saleId: sale.id,
            productName: sale.product.name,
            quantity: sale.quantity,
            totalPrice: sale.totalPrice,
          })),
        }}
      />
    </main>
  );
}
