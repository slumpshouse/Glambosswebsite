import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";

export default async function MyRequestsPage() {
  const cookieStore = await cookies();
  const customerPhone = cookieStore.get("customer_phone")?.value;

  if (!customerPhone) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="mt-3 text-gray-600">
          We could not find your request history yet. Submit a request first and we will save your request list for this browser.
        </p>
        <Link
          href="/request"
          className="mt-6 inline-flex rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          Submit a Request
        </Link>
      </main>
    );
  }

  const requests = await prisma.request.findMany({
    where: {
      customer: {
        phone: customerPhone,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          imageUrl: true,
          cost: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="mt-1 text-sm text-gray-600">Showing requests for {customerPhone}</p>
        </div>
        <Link
          href="/request"
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
          No requests found for this account yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <img
                    src={request.product.imageUrl}
                    alt={request.product.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {request.product.category}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900">{request.product.name}</h2>
                    <p className="text-sm text-gray-600">
                      {request.quantity} x ${request.product.cost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-sm">
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      request.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                  >
                    {request.status}
                  </span>
                  <p className="mt-2 text-gray-500">
                    {new Date(request.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {request.notes && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {request.notes}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
