"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 p-6">
        <main className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold text-red-900">Application error</h1>
            <p className="mt-2 text-sm text-red-800">
              An unexpected error occurred while loading the app.
            </p>
            {error?.digest ? (
              <p className="mt-3 text-xs text-red-700">Reference: {error.digest}</p>
            ) : null}
            <button
              type="button"
              onClick={() => reset()}
              className="mt-4 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Reload app
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
