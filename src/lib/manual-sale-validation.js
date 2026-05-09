import { z } from "zod";

export const createManualSaleSchema = z.object({
  productId: z.number().int("Product id must be an integer").positive("Product id is required"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  customerPhone: z.string().trim().min(5, "Customer phone is required"),
  customerName: z.string().trim().min(1).optional(),
});
