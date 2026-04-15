import { z } from "zod";

export const createRequestSchema = z.object({
  productId: z.number().int("Product id must be an integer").positive("Product id is required"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  customerId: z.number().int("Customer id must be an integer").positive().optional(),
  customerName: z.string().trim().min(1, "Customer name is required").max(100).optional(),
  customerPhone: z.string().trim().min(5, "Customer phone is required").max(30).optional(),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less").optional(),
});

export function assertQuantityWithinStock(quantity: number, stock: number): void {
  if (quantity > stock) {
    throw new Error("Requested quantity cannot exceed current stock");
  }
}
