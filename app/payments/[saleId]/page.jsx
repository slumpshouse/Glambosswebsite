import { notFound } from "next/navigation";
import PaymentCheckout from "@/app/components/PaymentCheckout";
import { requireCustomerSaleAccess } from "@/src/lib/payment-authorization";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }) {
  const resolvedParams = await params;
  const saleId = Number(resolvedParams.saleId);

  if (!Number.isInteger(saleId) || saleId <= 0) {
    notFound();
  }

  const access = await requireCustomerSaleAccess(saleId);
  if (!access.authorized) {
    notFound();
  }

  const sale = access.sale;

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <PaymentCheckout
        sale={{
          id: sale.id,
          totalPrice: sale.totalPrice,
          paymentStatus: sale.paymentStatus,
          customerName: sale.customer.name,
          customerPhone: sale.customer.phone,
          productName: sale.product.name,
        }}
      />
    </main>
  );
}
