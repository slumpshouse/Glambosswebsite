import { z } from "zod";

function isValidImageSource(value: string): boolean {
  const trimmed = value.trim();

  // Accept imported image data URLs (from file upload in the admin form).
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const baseProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  cost: z.number().nonnegative("Cost must be >= 0"),
  stock: z.number().int("Stock must be an integer").nonnegative("Stock cannot go below 0"),
  imageUrl: z
    .string()
    .trim()
    .refine(isValidImageSource, "Image URL must be a valid URL or imported image"),
  description: z.string().trim().min(1, "Description is required"),
});

export const createProductSchema = baseProductSchema;

export const updateProductSchema = baseProductSchema.partial().refine(
  (data) => (data.stock === undefined ? true : data.stock >= 0),
  { message: "Stock cannot go below 0", path: ["stock"] }
);

export function assertNonNegativeStock(stock: number): void {
  if (stock < 0) {
    throw new Error("Stock cannot go below 0");
  }
}
