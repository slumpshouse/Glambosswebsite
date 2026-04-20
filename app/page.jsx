import Link from "next/link";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RootPage() {
    let products = [];
    let loadError = null;

    function safeNumber(value, fallback = 0) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    try {
        products = await prisma.product.findMany({
            where: { stock: { gt: 0 } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
    } catch (error) {
        console.error("[RootPage] Failed to load products", error);
        loadError = "Products are temporarily unavailable. Please try again shortly.";
    }

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 p-6">
            <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-orange-50 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        Glam Goddess Shop
                    </p>
                    <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">
                        Browse products and send your request in one place.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
                        Customers land directly on available products first, then submit a request for the item and quantity they want.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/request"
                            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                        >
                            Submit a Request
                        </Link>
                        <Link
                            href="/login"
                            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Admin Login
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                    <p className="text-sm font-semibold text-gray-900">Customer Flow</p>
                    <div className="mt-4 grid gap-3 text-sm text-gray-600">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            1. View in-stock products.
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            2. Choose a product and quantity.
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            3. Submit your request for admin follow-up.
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Available Products</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Customers should see products first before filling out the request form.
                        </p>
                    </div>
                    <Link href="/request" className="text-sm font-medium text-gray-700 hover:text-black">
                        Open request-only page
                    </Link>
                </div>

                {loadError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        {loadError}
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
                        No products are currently available for request.
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => {
                            const productName = product?.name ?? "Unnamed product";
                            const productCategory = product?.category ?? "Uncategorized";
                            const productDescription = product?.description ?? "No description available.";
                            const productImage = product?.imageUrl || "https://via.placeholder.com/640x480?text=No+Image";
                            const productCost = safeNumber(product?.cost, 0);
                            const productStock = safeNumber(product?.stock, 0);

                            return (
                            <article
                                key={product.id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                            >
                                <div className="aspect-[4/3] bg-gray-100">
                                    <img
                                        src={productImage}
                                        alt={productName}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="space-y-3 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                {productCategory}
                                            </p>
                                            <h3 className="mt-1 text-lg font-semibold text-gray-900">
                                                {productName}
                                            </h3>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            {productStock} in stock
                                        </span>
                                    </div>

                                    <p className="text-sm leading-6 text-gray-600">{productDescription}</p>

                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-bold text-gray-900">
                                            ${productCost.toFixed(2)}
                                        </p>
                                        <Link
                                            href={`/request?product=${product.id}`}
                                            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            Request this
                                        </Link>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
