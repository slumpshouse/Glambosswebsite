import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken, mockSaleFindMany, mockProductFindMany, mockCustomerCount } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockSaleFindMany: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockCustomerCount: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: mockGetToken,
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    weeklySalesSummary: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/weekly-sales-aggregation", () => ({
  aggregateWeeklySales: vi.fn(async () => ({
    weekStart: "2026-04-01T00:00:00.000Z",
    weekEnd: "2026-04-07T23:59:59.999Z",
    totals: { revenue: 120, salesCount: 3, unitsSold: 5 },
    productVolume: [],
    inventory: { top: [], bottom: [] },
    customerTrends: { topCustomers: [], newCustomers: 1, repeatCustomers: 0 },
  })),
}));

vi.mock("openai", () => {
  class OpenAI {
    chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headline: "Strong Week",
                  summary: "Revenue increased with stable conversion.",
                  keyInsights: ["Top product held steady"],
                  risks: ["Low stock on one SKU"],
                  recommendedActions: ["Reorder low stock SKU"],
                }),
              },
            },
          ],
        })),
      },
    };

    constructor(_config: { apiKey: string }) {}
  }

  return { default: OpenAI };
});

import { POST } from "../app/api/sales/weekly-summary/route";

describe("weekly summary endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    mockGetToken.mockResolvedValue({ role: "admin", email: `admin+${Date.now()}@example.com` });
  });

  it("returns editable content in AI summary response", async () => {
    const response = await POST(new Request("http://localhost/api/sales/weekly-summary", { method: "POST" }));
    const body = (await response.json()) as {
      editableSummary?: string;
      structured?: { headline?: string };
    };

    expect(response.status).toBe(200);
    expect(body.structured?.headline).toBe("Strong Week");
    expect(body.editableSummary).toContain("Strong Week");
    expect(body.editableSummary).toContain("Key Insights:");
    expect(body.editableSummary).toContain("Recommended Actions:");
  });
});
