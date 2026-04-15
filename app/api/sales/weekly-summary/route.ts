import OpenAI from "openai";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/src/lib/prisma";
import { aggregateWeeklySales } from "@/src/lib/weekly-sales-aggregation";
import type {
  AiWeeklySummaryStructured,
  WeeklySalesAggregate,
} from "@/src/types/weekly-sales-summary";

type SaveWeeklySummaryPayload = {
  weekStart: string;
  weekEnd: string;
  editableSummary: string;
  structured: AiWeeklySummaryStructured;
  aggregate: WeeklySalesAggregate;
};

const globalRateLimitState = globalThis as unknown as {
  weeklySummaryRateLimit?: Map<string, number>;
};

const weeklySummaryRateLimit =
  globalRateLimitState.weeklySummaryRateLimit ?? new Map<string, number>();

if (!globalRateLimitState.weeklySummaryRateLimit) {
  globalRateLimitState.weeklySummaryRateLimit = weeklySummaryRateLimit;
}

function enforceSummaryRateLimit(key: string, minIntervalMs = 20_000): number {
  const now = Date.now();
  const lastRun = weeklySummaryRateLimit.get(key) ?? 0;

  if (now - lastRun < minIntervalMs) {
    return minIntervalMs - (now - lastRun);
  }

  weeklySummaryRateLimit.set(key, now);
  return 0;
}

function buildEditableSummary(structured: AiWeeklySummaryStructured): string {
  return [
    structured.headline,
    "",
    structured.summary,
    "",
    "Key Insights:",
    ...structured.keyInsights.map((item) => `- ${item}`),
    "",
    "Risks:",
    ...structured.risks.map((item) => `- ${item}`),
    "",
    "Recommended Actions:",
    ...structured.recommendedActions.map((item) => `- ${item}`),
  ].join("\n");
}

async function requireAdminToken(request: Request) {
  const token = await getToken({
    req: request as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return null;
  }

  return token;
}

async function generateStructuredSummary(
  aggregate: WeeklySalesAggregate
): Promise<AiWeeklySummaryStructured> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });

  const prompt = `You are a retail sales analyst. Return JSON only with this exact shape:
{
  "headline": string,
  "summary": string,
  "keyInsights": string[],
  "risks": string[],
  "recommendedActions": string[]
}
Use the weekly aggregate below:\n${JSON.stringify(aggregate)}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You create concise weekly sales executive summaries." },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = JSON.parse(content) as Partial<AiWeeklySummaryStructured>;

  return {
    headline: parsed.headline ?? "Weekly Sales Summary",
    summary: parsed.summary ?? "No summary was generated.",
    keyInsights: parsed.keyInsights ?? [],
    risks: parsed.risks ?? [],
    recommendedActions: parsed.recommendedActions ?? [],
  };
}

export async function GET(request: Request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [aggregate, latest] = await Promise.all([
      aggregateWeeklySales(),
      prisma.weeklySalesSummary.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return Response.json({ aggregate, latest });
  } catch (error) {
    console.error("[weekly-summary GET]", error);
    const message = error instanceof Error ? error.message : "Failed to load weekly sales data";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = String(token.email ?? token.sub ?? "admin");
  const waitMs = enforceSummaryRateLimit(key);

  if (waitMs > 0) {
    return Response.json(
      {
        error: "Rate limit exceeded. Try again shortly.",
        retryAfterMs: waitMs,
      },
      { status: 429 }
    );
  }

  try {
    const aggregate = await aggregateWeeklySales();
    const structured = await generateStructuredSummary(aggregate);

    return Response.json({
      aggregate,
      structured,
      editableSummary: buildEditableSummary(structured),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate summary";
    console.error("[weekly-summary POST]", error);

    if (message.includes("rate")) {
      return Response.json({ error: message }, { status: 429 });
    }

    if (message === "OPENAI_API_KEY is not set") {
      return Response.json({ error: message }, { status: 500 });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const token = await requireAdminToken(request);
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<SaveWeeklySummaryPayload>;

    if (
      !body.weekStart ||
      !body.weekEnd ||
      !body.editableSummary ||
      !body.structured ||
      !body.aggregate
    ) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    const saved = await prisma.weeklySalesSummary.create({
      data: {
        weekStart: new Date(body.weekStart),
        weekEnd: new Date(body.weekEnd),
        summary: body.editableSummary,
        structured: body.structured,
        aggregate: body.aggregate,
        createdBy: String(token.email ?? token.sub ?? "admin"),
      },
    });

    return Response.json(saved, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to save summary" }, { status: 500 });
  }
}
