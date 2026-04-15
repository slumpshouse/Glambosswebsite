import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const { mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaTransaction: vi.fn(),
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    $transaction: mockPrismaTransaction,
  },
}));

import { confirmPendingRequest } from "../src/lib/request-confirmation";

type ProductRow = {
  id: number;
  price: number;
  stock: number;
};

type RequestRow = {
  id: number;
  productId: number;
  quantity: number;
  status: "pending" | "completed";
  customerId: number | null;
};

type CustomerRow = {
  id: number;
  phone: string;
  name: string | null;
};

type SaleRow = {
  id: number;
  requestId: number | null;
  productId: number;
  customerId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type FakeDb = {
  products: ProductRow[];
  requests: RequestRow[];
  customers: CustomerRow[];
  sales: SaleRow[];
  nextCustomerId: number;
  nextSaleId: number;
};

function deepCloneDb(db: FakeDb): FakeDb {
  return JSON.parse(JSON.stringify(db)) as FakeDb;
}

function createTx(state: FakeDb) {
  return {
    request: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        const request = state.requests.find((row) => row.id === where.id);
        if (!request) return null;

        const product = state.products.find((row) => row.id === request.productId);
        if (!product) return null;

        return {
          id: request.id,
          productId: request.productId,
          quantity: request.quantity,
          status: request.status,
          customerId: request.customerId,
          product: {
            id: product.id,
            price: product.price,
            stock: product.stock,
          },
        };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: { status: "completed"; customerId: number };
      }) => {
        const request = state.requests.find((row) => row.id === where.id);
        if (!request) throw new Error("Request not found");
        request.status = data.status;
        request.customerId = data.customerId;
        return {
          id: request.id,
          status: request.status,
          productId: request.productId,
          quantity: request.quantity,
          customerId: request.customerId,
        };
      },
    },
    product: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        const product = state.products.find((row) => row.id === where.id);
        if (!product) return null;
        return {
          id: product.id,
          stock: product.stock,
          price: product.price,
        };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: { stock: { decrement: number } };
      }) => {
        const product = state.products.find((row) => row.id === where.id);
        if (!product) throw new Error("Product not found");
        product.stock -= data.stock.decrement;
        return product;
      },
    },
    customer: {
      upsert: async ({
        where,
        update,
        create,
      }: {
        where: { phone: string };
        update: { name?: string | undefined };
        create: { phone: string; name?: string | undefined };
      }) => {
        let customer = state.customers.find((row) => row.phone === where.phone);

        if (customer) {
          if (update.name !== undefined) {
            customer.name = update.name;
          }
        } else {
          customer = {
            id: state.nextCustomerId++,
            phone: create.phone,
            name: create.name ?? null,
          };
          state.customers.push(customer);
        }

        return {
          id: customer.id,
          phone: customer.phone,
          name: customer.name,
        };
      },
    },
    sale: {
      create: async ({
        data,
      }: {
        data: {
          requestId?: number;
          productId: number;
          customerId: number;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        };
      }) => {
        const sale: SaleRow = {
          id: state.nextSaleId++,
          requestId: data.requestId ?? null,
          productId: data.productId,
          customerId: data.customerId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice,
        };
        state.sales.push(sale);
        return sale;
      },
    },
  };
}

function wireAtomicTransaction(db: FakeDb): void {
  (mockPrismaTransaction as Mock).mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const working = deepCloneDb(db);
    const tx = createTx(working);

    try {
      const result = await callback(tx);
      db.products = working.products;
      db.requests = working.requests;
      db.customers = working.customers;
      db.sales = working.sales;
      db.nextCustomerId = working.nextCustomerId;
      db.nextSaleId = working.nextSaleId;
      return result;
    } catch (error) {
      throw error;
    }
  });
}

describe("confirmPendingRequest transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds when request quantity <= stock and marks request completed", async () => {
    const db: FakeDb = {
      products: [{ id: 1, price: 25, stock: 10 }],
      requests: [{ id: 100, productId: 1, quantity: 4, status: "pending", customerId: null }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };
    wireAtomicTransaction(db);

    const result = await confirmPendingRequest({
      requestId: 100,
      customerPhone: "555-7000",
      customerName: "Tina",
    });

    expect(result.request.status).toBe("completed");
    expect(db.requests[0].status).toBe("completed");
  });

  it("rolls back when requested quantity exceeds stock and keeps request pending", async () => {
    const db: FakeDb = {
      products: [{ id: 1, price: 25, stock: 2 }],
      requests: [{ id: 101, productId: 1, quantity: 5, status: "pending", customerId: null }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };
    wireAtomicTransaction(db);

    await expect(
      confirmPendingRequest({
        requestId: 101,
        customerPhone: "555-7001",
      })
    ).rejects.toThrow("Requested quantity cannot exceed current stock");

    expect(db.requests[0].status).toBe("pending");
    expect(db.products[0].stock).toBe(2);
    expect(db.sales).toHaveLength(0);
    expect(db.customers).toHaveLength(0);
  });

  it("decreases stock by requested quantity only on success", async () => {
    const db: FakeDb = {
      products: [{ id: 1, price: 40, stock: 12 }],
      requests: [{ id: 102, productId: 1, quantity: 3, status: "pending", customerId: null }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };
    wireAtomicTransaction(db);

    await confirmPendingRequest({
      requestId: 102,
      customerPhone: "555-7002",
    });

    expect(db.products[0].stock).toBe(9);
  });

  it("creates sale record with correct details", async () => {
    const db: FakeDb = {
      products: [{ id: 2, price: 15, stock: 8 }],
      requests: [{ id: 103, productId: 2, quantity: 2, status: "pending", customerId: null }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };
    wireAtomicTransaction(db);

    await confirmPendingRequest({
      requestId: 103,
      customerPhone: "555-7003",
      customerName: "Zee",
    });

    expect(db.sales).toHaveLength(1);
    expect(db.sales[0]).toMatchObject({
      requestId: 103,
      productId: 2,
      quantity: 2,
      unitPrice: 15,
      totalPrice: 30,
    });
  });

  it("links existing customer when phone exists, otherwise creates a new customer", async () => {
    const db: FakeDb = {
      products: [
        { id: 3, price: 20, stock: 10 },
        { id: 4, price: 20, stock: 10 },
      ],
      requests: [
        { id: 104, productId: 3, quantity: 1, status: "pending", customerId: null },
        { id: 105, productId: 4, quantity: 1, status: "pending", customerId: null },
      ],
      customers: [{ id: 9, phone: "555-9999", name: "Existing" }],
      sales: [],
      nextCustomerId: 10,
      nextSaleId: 1,
    };
    wireAtomicTransaction(db);

    await confirmPendingRequest({
      requestId: 104,
      customerPhone: "555-9999",
      customerName: "Existing",
    });

    await confirmPendingRequest({
      requestId: 105,
      customerPhone: "555-8888",
      customerName: "New",
    });

    expect(db.customers).toHaveLength(2);
    expect(db.requests.find((row) => row.id === 104)?.customerId).toBe(9);
    expect(db.requests.find((row) => row.id === 105)?.customerId).toBe(10);
  });
});
