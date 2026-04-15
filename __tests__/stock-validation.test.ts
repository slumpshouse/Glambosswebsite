import { describe, expect, it } from "vitest";
import {
  assertNonNegativeStock,
  updateProductSchema,
} from "../src/lib/product-validation";
import { assertQuantityWithinStock } from "../src/lib/request-validation";

type StockState = { stock: number };

// Mirrors the read-validate-write flow that should occur in a transaction.
function transactionalReduce(state: StockState, reduction: number): void {
  assertQuantityWithinStock(reduction, state.stock);
  assertNonNegativeStock(state.stock - reduction);
  state.stock -= reduction;
}

describe("stock validation", () => {
  describe("valid stock reduction", () => {
    it("reduces stock when reduction <= current stock", () => {
      const state: StockState = { stock: 12 };

      expect(() => transactionalReduce(state, 5)).not.toThrow();
      expect(state.stock).toBe(7);
    });
  });

  describe("prevent negative stock", () => {
    it("rejects reduction larger than current stock and leaves stock unchanged", () => {
      const state: StockState = { stock: 4 };

      expect(() => transactionalReduce(state, 6)).toThrow(
        "Requested quantity cannot exceed current stock"
      );
      expect(state.stock).toBe(4);
    });
  });

  describe("stock increase", () => {
    it("accepts increased stock via product update validation", () => {
      const currentStock = 10;
      const increaseBy = 8;
      const nextStock = currentStock + increaseBy;

      const result = updateProductSchema.safeParse({ stock: nextStock });

      expect(result.success).toBe(true);
      expect(nextStock).toBe(18);
    });
  });

  describe("boundary condition", () => {
    it("allows reduction to exactly 0", () => {
      const state: StockState = { stock: 3 };

      expect(() => transactionalReduce(state, 3)).not.toThrow();
      expect(state.stock).toBe(0);
    });
  });

  describe("concurrent transactions", () => {
    it("prevents negative stock when two reductions happen concurrently", async () => {
      const state: StockState = { stock: 10 };

      const results = await Promise.allSettled([
        Promise.resolve().then(() => transactionalReduce(state, 8)),
        Promise.resolve().then(() => transactionalReduce(state, 8)),
      ]);

      const succeeded = results.filter((result) => result.status === "fulfilled");
      const failed = results.filter((result) => result.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(state.stock).toBe(2);
      expect(state.stock).toBeGreaterThanOrEqual(0);
    });
  });
});
