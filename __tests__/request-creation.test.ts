import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const { mockFindMany, mockFindUnique, mockCreate, mockProductUpdate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockProductUpdate: vi.fn(),
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    request: {
      findMany: mockFindMany,
      create: mockCreate,
    },
    product: {
      findUnique: mockFindUnique,
      update: mockProductUpdate,
    },
  },
}));

import { GET, POST } from "../app/api/product-requests/route";

describe("Request Creation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Valid request creation", () => {
    it("creates a pending request when quantity is within available stock", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 1, stock: 10 });
      (mockCreate as Mock).mockResolvedValue({
        id: 21,
        productId: 1,
        quantity: 3,
        status: "pending",
        customerId: 99,
      });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 1, quantity: 3, customerId: 99 }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.status).toBe("pending");
      expect(mockCreate).toHaveBeenCalledOnce();
      // Request creation should not reduce stock immediately.
      expect(mockProductUpdate).not.toHaveBeenCalled();
    });

    it("stores the request with the correct productId reference", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 5, stock: 12 });
      (mockCreate as Mock).mockResolvedValue({
        id: 22,
        productId: 5,
        quantity: 4,
        status: "pending",
        customerId: null,
      });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 5, quantity: 4 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 5,
          }),
        })
      );
    });
  });

  describe("Exceeding stock", () => {
    it("rejects request when quantity exceeds stock and does not write to database", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 1, stock: 2 });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 1, quantity: 7 }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Requested quantity cannot exceed current stock");
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockProductUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Data integrity", () => {
    it("throws product not found for non-existent productId", async () => {
      (mockFindUnique as Mock).mockResolvedValue(null);

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 9999, quantity: 1 }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Product not found");
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("rejects invalid customerId values (schema validation)", async () => {
      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 1, quantity: 1, customerId: -5 }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockFindUnique).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Default status", () => {
    it("always stores new requests as pending without requiring manual status", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 2, stock: 5 });
      (mockCreate as Mock).mockResolvedValue({
        id: 30,
        productId: 2,
        quantity: 2,
        status: "pending",
      });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 2, quantity: 2 }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.status).toBe("pending");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "pending",
          }),
        })
      );
    });
  });

  describe("Customer linkage behavior", () => {
    it("links customer info when customerId is provided", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 2, stock: 8 });
      (mockCreate as Mock).mockResolvedValue({
        id: 31,
        productId: 2,
        quantity: 2,
        status: "pending",
        customerId: 77,
      });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 2, quantity: 2, customerId: 77 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 77,
          }),
        })
      );
    });

    it("keeps customer info optional when customerId is not provided", async () => {
      (mockFindUnique as Mock).mockResolvedValue({ id: 2, stock: 8 });
      (mockCreate as Mock).mockResolvedValue({
        id: 32,
        productId: 2,
        quantity: 1,
        status: "pending",
        customerId: null,
      });

      const request = new Request("http://localhost/api/product-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: 2, quantity: 1 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: undefined,
          }),
        })
      );
    });
  });

  describe("Request retrieval", () => {
    it("returns only pending requests ordered by creation date descending", async () => {
      const pendingRows = [
        {
          id: 7,
          status: "pending",
          createdAt: "2026-04-08T10:00:00.000Z",
          product: { id: 1, name: "Wig", stock: 4 },
        },
        {
          id: 6,
          status: "pending",
          createdAt: "2026-04-08T09:00:00.000Z",
          product: { id: 2, name: "Lashes", stock: 10 },
        },
      ];

      (mockFindMany as Mock).mockResolvedValue(pendingRows);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(pendingRows);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
        })
      );
      expect(body.every((row: { status: string }) => row.status === "pending")).toBe(true);
    });
  });
});
