import { describe, expect, it } from "vitest";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/testdb";

type ProductRow = {
  id: number;
  stock: number;
  cost: number;
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

type FakeState = {
  products: ProductRow[];
  customers: CustomerRow[];
  sales: SaleRow[];
  nextCustomerId: number;
  nextSaleId: number;
};

function createTx(state: FakeState) {
  return {
    product: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        const product = state.products.find((row) => row.id === where.id);
        if (!product) return null;
        return {
          id: product.id,
          stock: product.stock,
          cost: product.cost,
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

async function runManualSaleTx(
  tx: unknown,
  input: {
    productId: number;
    quantity: number;
    customerPhone: string;
    customerName?: string;
  }
) {
  const { executeSaleTransaction } = await import("../src/lib/sale-transaction");
  return executeSaleTransaction(tx as Parameters<typeof executeSaleTransaction>[0], input);
}

describe("manual sale transaction", () => {
  it("creates manual sale for available stock and updates stock correctly", async () => {
    const state: FakeState = {
      products: [{ id: 1, stock: 10, cost: 25 }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };

    const result = await runManualSaleTx(createTx(state), {
      productId: 1,
      quantity: 3,
      customerPhone: "555-1000",
      customerName: "Nia",
    });

    expect(result.sale.quantity).toBe(3);
    expect(result.sale.totalPrice).toBe(75);
    expect(state.products[0].stock).toBe(7);
  });

  it("fails when quantity exceeds stock and leaves stock unchanged", async () => {
    const state: FakeState = {
      products: [{ id: 1, stock: 2, cost: 20 }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };

    await expect(
      runManualSaleTx(createTx(state), {
        productId: 1,
        quantity: 5,
        customerPhone: "555-2000",
      })
    ).rejects.toThrow("Requested quantity cannot exceed current stock");

    expect(state.products[0].stock).toBe(2);
    expect(state.sales).toHaveLength(0);
  });

  it("links manual sale to an existing customer", async () => {
    const state: FakeState = {
      products: [{ id: 1, stock: 8, cost: 30 }],
      customers: [{ id: 7, phone: "555-3000", name: "Existing" }],
      sales: [],
      nextCustomerId: 8,
      nextSaleId: 1,
    };

    const result = await runManualSaleTx(createTx(state), {
      productId: 1,
      quantity: 2,
      customerPhone: "555-3000",
      customerName: "Existing",
    });

    expect(result.customer.id).toBe(7);
    expect(state.customers).toHaveLength(1);
    expect(state.sales[0].customerId).toBe(7);
  });

  it("creates a new customer automatically for manual sale", async () => {
    const state: FakeState = {
      products: [{ id: 1, stock: 8, cost: 15 }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };

    const result = await runManualSaleTx(createTx(state), {
      productId: 1,
      quantity: 2,
      customerPhone: "555-4000",
      customerName: "New Customer",
    });

    expect(result.customer.id).toBe(1);
    expect(state.customers).toHaveLength(1);
    expect(state.customers[0].phone).toBe("555-4000");
  });

  it("includes manual sales in total revenue aggregation sum", async () => {
    const state: FakeState = {
      products: [{ id: 1, stock: 20, cost: 10 }],
      customers: [],
      sales: [],
      nextCustomerId: 1,
      nextSaleId: 1,
    };

    await runManualSaleTx(createTx(state), {
      productId: 1,
      quantity: 2,
      customerPhone: "555-5000",
      customerName: "A",
    });

    await runManualSaleTx(createTx(state), {
      productId: 1,
      quantity: 3,
      customerPhone: "555-5001",
      customerName: "B",
    });

    const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    expect(totalRevenue).toBe(50);
  });
});
