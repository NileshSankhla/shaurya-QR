import type { Prisma } from "@prisma/client";

export type FoodSlotStatus = "SCHEDULED" | "ACTIVE" | "PAUSED" | "CLOSED";

/**
 * Manual activation is allowed to override the scheduled start time. Scheduled
 * slots auto-open once their start time arrives. Paused and closed slots never
 * accept scans, even when their time window is still open.
 */
export function foodSlotAcceptsScans(
  status: FoodSlotStatus | string,
  startTime: Date,
  endTime: Date,
  now: Date,
) {
  if (endTime <= now) return false;
  return status === "ACTIVE" || (status === "SCHEDULED" && startTime <= now);
}

export function activeFoodSlotWhere(now: Date): Prisma.FoodSlotWhereInput {
  return {
    endTime: { gt: now },
    OR: [
      { status: "ACTIVE" },
      { status: "SCHEDULED", startTime: { lte: now } },
    ],
  };
}
