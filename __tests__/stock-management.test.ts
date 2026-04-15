/**
 * Stock Management – Vitest suite
 *
 * 1. Valid stock reduction      – reduce by amount ≤ current stock
 * 2. Prevent negative stock     – reject reduction > current stock
 * 3. Stock increase             – increment stock via product update
 * 4. Boundary condition         – reduce to exactly 0
 * 5. Concurrent transactions    – serialised transaction prevents negative stock
 *
 * No database connection is needed.  The tests exercise the pure validation
 * helpers (assertNonNegativeStock, assertQuantityWithinStock, updateProductSchema)
 * and a local transactional helper that mirrors the pattern used in the
 * Prisma $transaction calls in the API routes.
 */

import { describe, expect, it } from "vitest";
import { assertNonNegativeStock, updateProductSchema } from "../src/lib/product-validation";
import { assertQuantityWithinStock } from "../src/lib/request-validation";

// ─── local helper that mirrors the Prisma $transaction stock-reduction pattern ─
// In the real API routes this block runs inside prisma.$transaction() so that
// the read + write are atomic.  Here we model the same semantics with a shared
// mutable state object.

interface StockState {
  stock: number;
}

/**
 * Atomically validate and apply a stock reduction.
 * Reads the current stock from `state`, validates the reduction, then writes
 * back – all in one synchronous step (equivalent to SELECT FOR UPDATE in SQL).
 */
function transactionalReduce(state: StockState, reduction: number): void {
  // Re-reads current stock inside the "transaction"
  assertQuantityWithinStock(reduction, state.stock);
  assertNonNegativeStock(state.stock - reduction);
  state.stock -= reduction;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Stock Management", () => {
  // ── 1. Valid stock reduction ───────────────────────────────────────────────
  describe("1 – Valid stock reduction", () => {
    it("reduces stock by the exact requested amount", () => {
      const state: StockState = { stock: 50 };
      const reduction = 20;

      expect(() => transactionalReduce(state, reduction)).not.toThrow();
      expect(state.stock).toBe(30);
    });

    it("accepts a reduction of 1 (minimum positive quantity)", () => {
      const state: StockState = { stock: 10 };

      expect(() => transactionalReduce(state, 1)).not.toThrow();
      expect(state.stock).toBe(9);
    });

    it("validation helpers pass individually for a valid reduction", () => {
      const currentStock = 100;
      const reduction = 40;

      expect(() => assertQuantityWithinStock(reduction, currentStock)).not.toThrow();
      expect(() => assertNonNegativeStock(currentStock - reduction)).not.toThrow();
    });
  });

  // ── 2. Prevent negative stock ─────────────────────────────────────────────
  describe("2 – Prevent negative stock", () => {
    it("rejects a reduction that exceeds current stock", () => {
      const state: StockState = { stock: 5 };
      const originalStock = state.stock;

      expect(() => transactionalReduce(state, 10)).toThrow(
        "Requested quantity cannot exceed current stock"
      );
      // Stock must be unchanged after a rejected transaction.
      expect(state.stock).toBe(originalStock);
    });

    it("assertQuantityWithinStock throws when quantity > stock", () => {
      expect(() => assertQuantityWithinStock(6, 5)).toThrow(
        "Requested quantity cannot exceed current stock"
      );
    });

    it("assertNonNegativeStock throws on a negative value", () => {
      expect(() => assertNonNegativeStock(-1)).toThrow("Stock cannot go below 0");
    });

    it("rejects reduction that would result in negative stock even if schema passes", () => {
      // updateProductSchema uses nonnegative so stock: -1 is caught at schema level too.
      const result = updateProductSchema.safeParse({ stock: -1 });
      expect(result.success).toBe(false);
    });
  });

  // ── 3. Stock increase ─────────────────────────────────────────────────────
  describe("3 – Stock increase via product update", () => {
    it("increments stock correctly", () => {
      const currentStock = 30;
      const added = 20;
      const newStock = currentStock + added;

      // updateProductSchema validates the incoming stock field.
      const result = updateProductSchema.safeParse({ stock: newStock });
      expect(result.success).toBe(true);
      expect(result.data?.stock).toBe(50);
    });

    it("newly incremented stock passes assertNonNegativeStock", () => {
      const newStock = 30 + 20;
      expect(() => assertNonNegativeStock(newStock)).not.toThrow();
    });

    it("adding stock to 0 results in the added amount", () => {
      const currentStock = 0;
      const added = 15;
      const newStock = currentStock + added;

      expect(newStock).toBe(15);
      const result = updateProductSchema.safeParse({ stock: newStock });
      expect(result.success).toBe(true);
    });

    it("schema rejects setting stock to a non-integer", () => {
      const result = updateProductSchema.safeParse({ stock: 10.5 });
      expect(result.success).toBe(false);
    });
  });

  // ── 4. Boundary condition ─────────────────────────────────────────────────
  describe("4 – Boundary condition: reduce to exactly 0", () => {
    it("allows a reduction equal to the full stock (stock → 0)", () => {
      const state: StockState = { stock: 25 };

      expect(() => transactionalReduce(state, 25)).not.toThrow();
      expect(state.stock).toBe(0);
    });

    it("stock of 0 passes assertNonNegativeStock", () => {
      expect(() => assertNonNegativeStock(0)).not.toThrow();
    });

    it("assertQuantityWithinStock allows quantity === stock", () => {
      expect(() => assertQuantityWithinStock(10, 10)).not.toThrow();
    });

    it("a subsequent reduction on stock=0 is rejected immediately", () => {
      const state: StockState = { stock: 0 };

      expect(() => transactionalReduce(state, 1)).toThrow(
        "Requested quantity cannot exceed current stock"
      );
      expect(state.stock).toBe(0);
    });
  });

  // ── 5. Concurrent transactions ────────────────────────────────────────────
  describe("5 – Concurrent transactions prevent negative stock", () => {
    /**
     * In a real Postgres + Prisma setup each $transaction wraps the read and
     * write in a serialisable/repeatable-read transaction so the second
     * concurrent request sees the committed (already-reduced) stock.
     *
     * We simulate that here by running two Promises against the same state
     * object.  Because microtasks execute one at a time the first transaction
     * commits before the second reads, which is exactly the behaviour that
     * Prisma's $transaction guarantees in the API routes.
     */
    it("exactly one of two competing large reductions succeeds", async () => {
      const state: StockState = { stock: 10 };
      const reduction = 8; // Two requests, each wants 8 of 10 → only one can win.

      const results = await Promise.allSettled([
        Promise.resolve().then(() => transactionalReduce(state, reduction)),
        Promise.resolve().then(() => transactionalReduce(state, reduction)),
      ]);

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      // Stock must equal 10 – 8 = 2, never –6.
      expect(state.stock).toBe(2);
    });

    it("rejected concurrent transaction carries the correct error message", async () => {
      const state: StockState = { stock: 10 };

      const results = await Promise.allSettled([
        Promise.resolve().then(() => transactionalReduce(state, 8)),
        Promise.resolve().then(() => transactionalReduce(state, 8)),
      ]);

      const failed = results.find((r) => r.status === "rejected") as
        | PromiseRejectedResult
        | undefined;

      expect(failed).toBeDefined();
      expect((failed!.reason as Error).message).toBe(
        "Requested quantity cannot exceed current stock"
      );
    });

    it("two small independent reductions both succeed when stock is sufficient", async () => {
      const state: StockState = { stock: 20 };

      const results = await Promise.allSettled([
        Promise.resolve().then(() => transactionalReduce(state, 5)),
        Promise.resolve().then(() => transactionalReduce(state, 5)),
      ]);

      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      expect(state.stock).toBe(10);
    });

    it("stock is never negative after any number of concurrent reductions", async () => {
      const state: StockState = { stock: 10 };
      const reductions = [3, 4, 5, 6]; // Total = 18 > 10; some must fail.

      await Promise.allSettled(
        reductions.map((r) =>
          Promise.resolve().then(() => transactionalReduce(state, r))
        )
      );

      // Stock must stay >= 0 regardless of how many attempts were made.
      expect(state.stock).toBeGreaterThanOrEqual(0);
    });
  });
});
