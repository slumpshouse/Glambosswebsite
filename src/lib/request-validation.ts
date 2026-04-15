import { z } from "zod";

export const createRequestSchema = z.object({
  productId: z.number().int("Product id must be an integer").positive("Product id is required"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  customerId: z.number().int("Customer id must be an integer").positive().optional(),
});

export function assertQuantityWithinStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new Error("Requested quantity cannot exceed current stock");
  }
}
