import { describe, expect, it } from "vitest";

type CustomerRow = {
  id: number;
  name: string | null;
  phone: string;
};

type SaleRow = {
  customerId: number;
  totalPrice: number;
};

function searchCustomers(rows: CustomerRow[], query: string) {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    const name = (row.name ?? "").toLowerCase();
    const phone = row.phone.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });
}

function upsertCustomerByPhone(rows: CustomerRow[], input: Omit<CustomerRow, "id">) {
  const existing = rows.find((row) => row.phone === input.phone);
  if (existing) {
    existing.name = input.name;
    return { customer: existing, created: false };
  }

  const created = {
    id: rows.length + 1,
    name: input.name,
    phone: input.phone,
  };
  rows.push(created);
  return { customer: created, created: true };
}

function calculateLifetimeValue(rows: SaleRow[], customerId: number) {
  return rows
    .filter((row) => row.customerId === customerId)
    .reduce((sum, row) => sum + row.totalPrice, 0);
}

function calculatePurchaseFrequency(rows: SaleRow[], customerId: number) {
  return rows.filter((row) => row.customerId === customerId).length;
}

describe("customer management stubs", () => {
  it("customer search: partial match works for name and phone", () => {
    const rows: CustomerRow[] = [
      { id: 1, name: "Ava", phone: "555-1111" },
      { id: 2, name: "Bianca", phone: "555-2222" },
      { id: 3, name: "Cara", phone: "777-1234" },
    ];

    expect(searchCustomers(rows, "an").map((row) => row.id)).toEqual([2]);
    expect(searchCustomers(rows, "1234").map((row) => row.id)).toEqual([3]);
  });

  it("customer deduplication: unique phone prevents duplicate customer", () => {
    const rows: CustomerRow[] = [{ id: 1, name: "Ava", phone: "555-1111" }];

    const first = upsertCustomerByPhone(rows, { name: "Ava Updated", phone: "555-1111" });

    expect(first.created).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Ava Updated");
  });

  it("lifetime value calculation: sums all customer sales", () => {
    const sales: SaleRow[] = [
      { customerId: 1, totalPrice: 20 },
      { customerId: 1, totalPrice: 30 },
      { customerId: 2, totalPrice: 10 },
    ];

    expect(calculateLifetimeValue(sales, 1)).toBe(50);
    expect(calculateLifetimeValue(sales, 2)).toBe(10);
  });

  it("purchase frequency calculation: counts sales records", () => {
    const sales: SaleRow[] = [
      { customerId: 1, totalPrice: 20 },
      { customerId: 1, totalPrice: 30 },
      { customerId: 2, totalPrice: 10 },
    ];

    expect(calculatePurchaseFrequency(sales, 1)).toBe(2);
    expect(calculatePurchaseFrequency(sales, 2)).toBe(1);
  });
});
