"use client";

import { useEffect } from "react";

export default function AppError({ error, unstable_retry }) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-semibold text-red-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-red-800">
          We could not load this page right now. Please try again.
        </p>
        {error?.digest ? (
          <p className="mt-3 text-xs text-red-700">Reference: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-4 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
