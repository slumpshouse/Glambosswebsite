"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function safeNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function groupProductsByCategory(items) {
    const grouped = new Map();

    for (const product of items) {
        const category = product?.category?.trim() || "Uncategorized";
        const current = grouped.get(category) ?? [];
        current.push(product);
        grouped.set(category, current);
    }

    return Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, products]) => ({ category, products }));
}

export default function RootPage() {
    const [products, setProducts] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [cart, setCart] = useState([]); // [{product, quantity}]

    const getCartQuantity = (productId) =>
        cart.find((item) => item.product.id === productId)?.quantity ?? 0;

    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch("/api/products", { cache: "no-store" });
                if (!response.ok) throw new Error("Failed to load products");
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                setLoadError("Products are temporarily unavailable. Please try again shortly.");
            }
        }
        fetchProducts();
    }, []);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem("glam_cart_items");
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) {
                setCart(parsed);
            }
        } catch {
            setCart([]);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem("glam_cart_items", JSON.stringify(cart));
        // Notify navbar and other components of cart update
        window.dispatchEvent(new Event("cartUpdated"));
    }, [cart]);

    function addToCart(product) {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, safeNumber(product.stock, 1)) }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    }

    const cartItemCount = cart.reduce((sum, item) => sum + safeNumber(item.quantity, 0), 0);
    const cartTotal = cart.reduce(
        (sum, item) => sum + safeNumber(item.product?.cost, 0) * safeNumber(item.quantity, 0),
        0
    );
    const availableProducts = useMemo(
        () => products.filter((product) => safeNumber(product?.stock, 0) > 0),
        [products]
    );
    const unavailableProducts = useMemo(
        () => products.filter((product) => safeNumber(product?.stock, 0) <= 0),
        [products]
    );
    const availableByCategory = useMemo(
        () => groupProductsByCategory(availableProducts),
        [availableProducts]
    );
    const unavailableByCategory = useMemo(
        () => groupProductsByCategory(unavailableProducts),
        [unavailableProducts]
    );

    function renderProductCard(product, sectionType) {
        const productName = product?.name ?? "Unnamed product";
        const productCategory = product?.category ?? "Uncategorized";
        const productDescription = product?.description ?? "No description available.";
        const productImage = product?.imageUrl || "https://via.placeholder.com/640x480?text=No+Image";
        const productCost = safeNumber(product?.cost, 0);
        const productStock = safeNumber(product?.stock, 0);
        const quantityInCart = getCartQuantity(product.id);
        const isAvailable = sectionType === "available";

        return (
            <article
                key={product.id}
                className="overflow-hidden rounded-2xl border-2 border-pink-100 bg-gradient-to-br from-white to-pink-50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
                <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-purple-100">
                    <img
                        src={productImage}
                        alt={productName}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                                {productCategory}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-purple-900">
                                {productName}
                            </h3>
                        </div>
                        <span
                            className={[
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                isAvailable
                                    ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-700",
                            ].join(" ")}
                        >
                            {isAvailable ? `${productStock} in stock` : "Out of stock"}
                        </span>
                    </div>

                    <p className="text-sm leading-6 text-purple-800">{productDescription}</p>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            ${productCost.toFixed(2)}
                        </p>
                        <button
                            className="rounded-lg border-2 border-pink-300 px-3 py-1.5 text-sm font-semibold text-pink-600 bg-white hover:bg-pink-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => addToCart(product)}
                            disabled={!isAvailable}
                        >
                            {isAvailable
                                ? quantityInCart > 0
                                    ? `Added (${quantityInCart})`
                                    : "Add to cart"
                                : "Not Available"}
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    // ...existing code...
    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 p-6">
            {/* ...existing code... */}
            <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Browse Products</h2>
                        <p className="mt-1 text-sm text-purple-700">
                            Products are organized by section and availability.
                        </p>
                    </div>
                </div>

                {loadError && (
                    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
                        {loadError}
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-8 text-center text-sm text-pink-700 font-medium">
                        No products are available yet.
                    </div>
                ) : (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-semibold text-purple-900">Available Items</h3>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {availableProducts.length}
                                </span>
                            </div>
                            {availableByCategory.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
                                    No available items right now.
                                </div>
                            ) : (
                                availableByCategory.map((group) => (
                                    <div key={group.category} className="space-y-3">
                                        <h4 className="text-lg font-semibold text-pink-700">{group.category}</h4>
                                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                            {group.products.map((product) => renderProductCard(product, "available"))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-semibold text-purple-900">Non Available Items</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    {unavailableProducts.length}
                                </span>
                            </div>
                            {unavailableByCategory.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                                    No non-available items.
                                </div>
                            ) : (
                                unavailableByCategory.map((group) => (
                                    <div key={group.category} className="space-y-3">
                                        <h4 className="text-lg font-semibold text-slate-700">{group.category}</h4>
                                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                            {group.products.map((product) => renderProductCard(product, "unavailable"))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>
                    </div>
                )}
            </section>

            {cartItemCount > 0 && (
                <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-purple-900">Cart summary</h3>
                            <p className="text-sm text-purple-700">
                                {cartItemCount} item{cartItemCount === 1 ? "" : "s"} selected
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-purple-700">Total</p>
                            <p className="text-2xl font-bold text-pink-600">${cartTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link
                            href="/checkout"
                            className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
                        >
                            Checkout cart
                        </Link>
                    </div>
                </section>
            )}
        </main>
    );
}
