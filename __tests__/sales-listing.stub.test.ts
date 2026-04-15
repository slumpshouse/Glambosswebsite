import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken, mockSaleFindMany } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockSaleFindMany: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: mockGetToken,
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    sale: {
      findMany: mockSaleFindMany,
    },
  },
}));

import { GET } from "../app/api/sales/route";

describe("sales listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves all sales sorted chronologically", async () => {
    mockGetToken.mockResolvedValue({ role: "admin" });
    mockSaleFindMany.mockResolvedValue([
      {
        id: 1,
        quantity: 2,
        unitPrice: 20,
        totalPrice: 40,
        createdAt: "2026-04-01T10:00:00.000Z",
        product: { id: 10, name: "Wig" },
        customer: { id: 100, name: "Ada", phone: "555-1000" },
      },
      {
        id: 2,
        quantity: 1,
        unitPrice: 30,
        totalPrice: 30,
        createdAt: "2026-04-02T10:00:00.000Z",
        product: { id: 11, name: "Lashes" },
        customer: { id: 101, name: "Bea", phone: "555-2000" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/sales"));
    const body = (await response.json()) as Array<{ id: number; createdAt: string }>;

    expect(response.status).toBe(200);
    expect(body.map((sale) => sale.id)).toEqual([1, 2]);
    expect(mockSaleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    );
  });

  it("returns each sale linked to the correct product and customer", async () => {
    mockGetToken.mockResolvedValue({ role: "admin" });
    mockSaleFindMany.mockResolvedValue([
      {
        id: 3,
        quantity: 4,
        unitPrice: 15,
        totalPrice: 60,
        createdAt: "2026-04-03T10:00:00.000Z",
        product: { id: 12, name: "Extension" },
        customer: { id: 102, name: "Cara", phone: "555-3000" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/sales"));
    const [sale] = (await response.json()) as Array<{
      product: { id: number; name: string };
      customer: { id: number; name: string | null; phone: string };
    }>;

    expect(sale.product).toEqual({ id: 12, name: "Extension" });
    expect(sale.customer).toEqual({ id: 102, name: "Cara", phone: "555-3000" });
  });

  it("includes both manual and confirmed sales in listing", async () => {
    mockGetToken.mockResolvedValue({ role: "admin" });
    mockSaleFindMany.mockResolvedValue([
      {
        id: 4,
        requestId: null,
        quantity: 1,
        unitPrice: 25,
        totalPrice: 25,
        createdAt: "2026-04-04T10:00:00.000Z",
        product: { id: 13, name: "Spray" },
        customer: { id: 103, name: "Dana", phone: "555-4000" },
      },
      {
        id: 5,
        requestId: 900,
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20,
        createdAt: "2026-04-05T10:00:00.000Z",
        product: { id: 14, name: "Gel" },
        customer: { id: 104, name: "Elle", phone: "555-5000" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/sales"));
    const body = (await response.json()) as Array<{ id: number }>;

    expect(body.map((sale) => sale.id)).toEqual([4, 5]);
  });

  it("totals in listing match the sum of individual sales", async () => {
    mockGetToken.mockResolvedValue({ role: "admin" });
    mockSaleFindMany.mockResolvedValue([
      {
        id: 6,
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        createdAt: "2026-04-06T10:00:00.000Z",
        product: { id: 15, name: "Bundle A" },
        customer: { id: 105, name: "Fae", phone: "555-6000" },
      },
      {
        id: 7,
        quantity: 3,
        unitPrice: 15,
        totalPrice: 45,
        createdAt: "2026-04-07T10:00:00.000Z",
        product: { id: 16, name: "Bundle B" },
        customer: { id: 106, name: "Gia", phone: "555-7000" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/sales"));
    const body = (await response.json()) as Array<{ totalPrice: number }>;

    const computedTotal = body.reduce((sum, sale) => sum + sale.totalPrice, 0);
    expect(computedTotal).toBe(95);
  });

  it("uses stable chronological sorting when multiple sales share the same timestamp", async () => {
    mockGetToken.mockResolvedValue({ role: "admin" });
    mockSaleFindMany.mockResolvedValue([
      {
        id: 8,
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10,
        createdAt: "2026-04-08T10:00:00.000Z",
        product: { id: 17, name: "Edge A" },
        customer: { id: 107, name: "Hana", phone: "555-8000" },
      },
      {
        id: 9,
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10,
        createdAt: "2026-04-08T10:00:00.000Z",
        product: { id: 18, name: "Edge B" },
        customer: { id: 108, name: "Ivy", phone: "555-9000" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/sales"));
    const body = (await response.json()) as Array<{ id: number; createdAt: string }>;

    expect(body.map((sale) => sale.id)).toEqual([8, 9]);
    expect(mockSaleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      })
    );
  });
});
