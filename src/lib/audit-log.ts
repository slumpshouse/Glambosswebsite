import { prisma } from "@/src/lib/prisma";
import type { AuditLogEntry } from "@/src/types/auth";

/**
 * Logs an admin action.
 * - Always emits structured JSON to stdout.
 * - Persists a row to the Postgres `AuditLog` table via Prisma.
 */
export async function logAdminAction(
  action: string,
  userId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
  };

  // Emit to stdout so logs are visible in the server/terminal.
  console.log(`[AUDIT] ${JSON.stringify(entry)}`);

  // Persist to Postgres.
  try {
    // Normalize unknown values to a JSON-safe structure before writing.
    const jsonDetails = JSON.parse(JSON.stringify(details));

    await prisma.auditLog.create({
      data: { action, userId, details: jsonDetails },
    });
  } catch (err) {
    // DB write failure must never crash the auth flow — log and continue.
    console.error("[AUDIT] Failed to persist to database:", err);
  }
}
