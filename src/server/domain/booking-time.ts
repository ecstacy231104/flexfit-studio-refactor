
/**
 * Shared time/membership helpers used across bookings, reschedules, and
 * corporate-bookings routers.
 *
 * These were previously copy-pasted verbatim into all three router files.
 * Extracted here so a fix or change only needs to happen once.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { memberships } from "@/db/schema";

/** Hours between now and the given ISO timestamp. Negative if already past. */
export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 36e5;
}

/**
 * The member's current active membership, if any (status "active" and not
 * past its end date). Picks the one with the furthest end date if somehow
 * more than one is active.
 */
export async function activeMembershipFor(
  db: typeof import("@/db").db,
  userId: number,
) {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        sql`${memberships.endDate} >= ${today}`,
      ),
    )
    .orderBy(desc(memberships.endDate))
    .get();
}