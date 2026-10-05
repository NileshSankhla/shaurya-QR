import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AdminOverview,
  GuestInput,
  GuestHistory,
  GuestListFilters,
  GuestSearchResult,
  PlatformStore,
  SlotInput,
  StaffInput,
  StaffUpdateInput,
  VolunteerHome,
} from "./contracts";
import { activeFoodSlotWhere } from "./slot-policy";

function guestResult(guest: {
  id: string;
  name: string;
  college: string;
  contactNo: string;
  email: string;
  status: string;
  active: boolean;
  qrCard?: { uid: string } | null;
  _count?: { entries: number };
}): GuestSearchResult {
  return {
    id: guest.id,
    name: guest.name,
    college: guest.college,
    mobile: guest.contactNo,
    email: guest.email,
    status: guest.status,
    active: guest.active,
    qrToken: guest.qrCard?.uid ?? null,
    mealsVerified: guest._count?.entries ?? 0,
  };
}

const guestInclude = {
  qrCard: { select: { uid: true } },
  _count: { select: { entries: true } },
} satisfies Prisma.GuestInclude;

type AdminSummaryCounts = {
  guests: bigint;
  assigned: bigint;
  availableQrs: bigint;
  verifiedMeals: bigint;
  activeVolunteers: bigint;
};

type AdminCumulativeRow = {
  label: string;
  value: bigint;
};

function normalizeGuest(input: GuestInput) {
  return {
    name: input.name.trim(),
    college: input.college.trim(),
    contactNo: input.mobile.replace(/\D/g, ""),
    email: input.email.trim().toLowerCase(),
  };
}

async function activity(
  tx: Prisma.TransactionClient,
  input: {
    action: string;
    actorName: string;
    guestId?: string;
    guestName?: string;
    qrToken?: string;
    details: string;
  },
) {
  await tx.activityLog.create({
    data: {
      action: input.action,
      volunteerName: input.actorName,
      guestId: input.guestId,
      guestName: input.guestName,
      qrToken: input.qrToken,
      details: input.details,
    },
  });
}

export class PrismaPlatformStore implements PlatformStore {
  async findStaffByUsername(username: string) {
    return prisma.volunteer.findUnique({
      where: { username: username.trim().toLowerCase() },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        name: true,
        role: true,
        active: true,
      },
    });
  }

  async upgradeStaffPassword(id: string, passwordHash: string) {
    await prisma.volunteer.update({ where: { id }, data: { passwordHash } });
  }

  async registerGuest(input: GuestInput) {
    const guest = await prisma.guest.create({
      data: normalizeGuest(input),
      include: guestInclude,
    });
    return guestResult(guest);
  }

  async updateGuest(guestId: string, input: GuestInput, actorName: string) {
    const existing = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!existing) throw new Error("Participant not found");
    const normalized = normalizeGuest(input);
    const [guest] = await prisma.$transaction([
      prisma.guest.update({
        where: { id: guestId },
        data: normalized,
        include: guestInclude,
      }),
      prisma.activityLog.create({
        data: {
          action: "USER_UPDATED",
          volunteerName: actorName,
          guestId,
          guestName: normalized.name,
          details: `${actorName} updated ${normalized.name}`,
        },
      }),
    ]);
    return guestResult(guest);
  }

  async searchGuests(query: string, limit = 10) {
    const q = query.trim();
    if (q.length < 2) return [];
    const guests = await prisma.guest.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { college: { contains: q, mode: "insensitive" } },
          { contactNo: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { qrCard: { is: { uid: { contains: q, mode: "insensitive" } } } },
        ],
      },
      include: guestInclude,
      orderBy: { name: "asc" },
      take: Math.min(Math.max(limit, 1), 20),
    });
    return guests.map(guestResult);
  }

  async createGuestAndAssign(
    input: GuestInput,
    qrToken: string,
    _actorId: string,
    actorName: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const normalized = normalizeGuest(input);
      const existing = await tx.guest.findFirst({
        where: {
          OR: [
            { contactNo: normalized.contactNo },
            { email: normalized.email },
          ],
        },
        include: guestInclude,
      });
      if (existing) {
        const matchingField =
          existing.contactNo === normalized.contactNo
            ? "mobile number"
            : "email address";
        const state = existing.active
          ? "already registered"
          : "currently removed";
        throw new Error(
          `This ${matchingField} belongs to ${existing.name}, who is ${state}. Search for that participant${existing.active ? " and assign the QR" : " or ask an admin to restore the record"}.`,
        );
      }

      const guest = await tx.guest.create({ data: normalized });
      await this.assignQrInTransaction(tx, guest.id, qrToken, actorName);
      const saved = await tx.guest.findUniqueOrThrow({
        where: { id: guest.id },
        include: guestInclude,
      });
      return guestResult(saved);
    });
  }

  private async assignQrInTransaction(
    tx: Prisma.TransactionClient,
    guestId: string,
    rawToken: string,
    actorName: string,
  ) {
    const token = rawToken.trim().toUpperCase();
    const guest = await tx.guest.findUnique({
      where: { id: guestId },
      include: { qrCard: true },
    });
    if (!guest || !guest.active)
      throw new Error("Participant not found or inactive");
    if (guest.qrCard)
      throw new Error(`Participant already has QR ${guest.qrCard.uid}`);

    const card = await tx.qrCard.findUnique({
      where: { uid: token },
      include: { guest: { select: { name: true } } },
    });
    if (!card) throw new Error("QR code was not found in the inventory");
    if (card.guestId || card.status === "ASSIGNED") {
      const owner = card.guest?.name ? ` to ${card.guest.name}` : "";
      throw new Error(`QR code ${token} is already assigned${owner}`);
    }
    if (card.status !== "AVAILABLE")
      throw new Error(`QR code ${token} is not available`);

    const claimed = await tx.qrCard.updateMany({
      where: { uid: token, status: "AVAILABLE", guestId: null },
      data: { status: "ASSIGNED", guestId },
    });
    if (claimed.count !== 1)
      throw new Error(
        "That QR was assigned by another operator. Scan a different QR.",
      );

    await tx.guest.update({
      where: { id: guestId },
      data: { status: "ASSIGNED" },
    });
    await activity(tx, {
      action: "QR_ASSIGNED",
      actorName,
      guestId,
      guestName: guest.name,
      qrToken: token,
      details: `${actorName} assigned ${token} to ${guest.name}`,
    });
  }

  async assignQr(guestId: string, qrToken: string, actorName: string) {
    await prisma.$transaction((tx) =>
      this.assignQrInTransaction(tx, guestId, qrToken, actorName),
    );
  }

  async unassignQr(guestId: string, actorName: string) {
    await prisma.$transaction(async (tx) => {
      const guest = await tx.guest.findUnique({
        where: { id: guestId },
        include: { qrCard: true },
      });
      if (!guest) throw new Error("Participant not found");
      if (!guest.qrCard) throw new Error("Participant has no assigned QR");
      const token = guest.qrCard.uid;
      await tx.qrCard.update({
        where: { uid: token },
        data: { status: "AVAILABLE", guestId: null },
      });
      await tx.guest.update({
        where: { id: guestId },
        data: { status: "UNASSIGNED" },
      });
      await activity(tx, {
        action: "QR_UNASSIGNED",
        actorName,
        guestId,
        guestName: guest.name,
        qrToken: token,
        details: `${actorName} unassigned ${token} from ${guest.name}`,
      });
    });
  }

  async setGuestActive(guestId: string, active: boolean, actorName: string) {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { qrCard: true },
    });
    if (!guest) throw new Error("Participant not found");

    const participantUpdate = prisma.guest.update({
      where: { id: guestId },
      data: {
        active,
        // The legacy database constrains status to assignment states. Account
        // removal is represented by active/removedAt, not another QR status.
        status: "UNASSIGNED",
        removedAt: active ? null : new Date(),
      },
    });
    const auditEntry = prisma.activityLog.create({
      data: {
        action: active ? "USER_RESTORED" : "USER_REMOVED",
        volunteerName: actorName,
        guestId,
        guestName: guest.name,
        details: `${actorName} ${active ? "restored" : "removed"} ${guest.name}`,
      },
    });

    if (!active && guest.qrCard) {
      await prisma.$transaction([
        prisma.qrCard.update({
          where: { uid: guest.qrCard.uid },
          data: { status: "AVAILABLE", guestId: null },
        }),
        participantUpdate,
        auditEntry,
      ]);
    } else {
      await prisma.$transaction([participantUpdate, auditEntry]);
    }
  }

  async verifyMeal(rawToken: string, volunteerId: string) {
    const qrToken = rawToken.trim().toUpperCase();
    const now = new Date();
    const activeSlot = await prisma.foodSlot.findFirst({
      where: activeFoodSlotWhere(now),
      orderBy: { updatedAt: "desc" },
    });
    const card = await prisma.qrCard.findUnique({
      where: { uid: qrToken },
      include: { guest: true },
    });

    const reject = async (reason: string) => {
      await prisma.scanEvent.create({
        data: {
          successful: false,
          reason,
          qrToken,
          volunteerId,
          guestId: card?.guestId,
          slotId: activeSlot?.id,
        },
      });
      return { success: false, reason };
    };

    if (!activeSlot) return reject("No food slot is active");
    if (!card) return reject("QR code not found");
    if (card.status !== "ASSIGNED" || !card.guest || !card.guest.active) {
      return reject("QR code is not assigned to an active participant");
    }

    try {
      await prisma.$transaction([
        prisma.foodEntry.create({
          data: { guestId: card.guest!.id, slotId: activeSlot.id, volunteerId },
        }),
        prisma.scanEvent.create({
          data: {
            successful: true,
            qrToken,
            volunteerId,
            guestId: card.guest!.id,
            slotId: activeSlot.id,
          },
        }),
      ]);
      return {
        success: true,
        guestName: card.guest.name,
        college: card.guest.college,
        slotTitle: activeSlot.title,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return reject(`Food already verified for ${activeSlot.title}`);
      }
      throw error;
    }
  }

  async getVolunteerHome(staffId: string): Promise<VolunteerHome> {
    const now = new Date();
    const [totalGuests, scannedByMe, verifiedByMe, activeSlot, recent] =
      await prisma.$transaction([
        prisma.guest.count({ where: { active: true } }),
        prisma.scanEvent.count({ where: { volunteerId: staffId } }),
        prisma.scanEvent.count({
          where: { volunteerId: staffId, successful: true },
        }),
        prisma.foodSlot.findFirst({
          where: activeFoodSlotWhere(now),
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            day: { select: { label: true } },
            _count: { select: { entries: true } },
          },
        }),
        prisma.scanEvent.findMany({
          where: { volunteerId: staffId },
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            guest: { select: { name: true } },
            slot: { select: { title: true } },
          },
        }),
      ]);

    return {
      totalGuests,
      scannedByMe,
      verifiedByMe,
      activeSlot: activeSlot
        ? {
            id: activeSlot.id,
            title: activeSlot.title,
            dayLabel: activeSlot.day.label,
            startTime: activeSlot.startTime.toISOString(),
            endTime: activeSlot.endTime.toISOString(),
            served: activeSlot._count.entries,
          }
        : null,
      recent: recent.map((event) => ({
        id: event.id,
        successful: event.successful,
        guestName: event.guest?.name ?? event.qrToken,
        slotTitle: event.slot?.title ?? "No active slot",
        reason: event.reason,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  async getAdminOverview(recentPage = 1): Promise<AdminOverview> {
    const activityPageSize = 10;
    const safeRecentPage = Math.max(1, Math.floor(recentPage));
    const now = new Date();
    const [
      summaryRows,
      activeSlot,
      collegeGroups,
      slots,
      staff,
      performanceGroups,
      recent,
      recentCount,
      cumulativeRows,
    ] = await prisma.$transaction([
      prisma.$queryRaw<AdminSummaryCounts[]>`
        SELECT
          (SELECT COUNT(*) FROM "users" WHERE "active" = true) AS "guests",
          (SELECT COUNT(*) FROM "users" WHERE "active" = true AND "status" = 'ASSIGNED') AS "assigned",
          (SELECT COUNT(*) FROM "qr_codes" WHERE "status" = 'AVAILABLE') AS "availableQrs",
          (SELECT COUNT(*) FROM "food_entries") AS "verifiedMeals",
          (SELECT COUNT(*) FROM "volunteers" WHERE "active" = true) AS "activeVolunteers"
      `,
      prisma.foodSlot.findFirst({
        where: activeFoodSlotWhere(now),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          day: { select: { label: true } },
          _count: { select: { entries: true } },
        },
      }),
      prisma.guest.groupBy({
        by: ["college"] as const,
        where: { active: true },
        _count: { id: true } as const,
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.foodSlot.findMany({
        select: {
          title: true,
          day: { select: { label: true } },
          _count: { select: { entries: true } },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.volunteer.findMany({
        select: { id: true, name: true, role: true, active: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
      prisma.scanEvent.groupBy({
        by: ["volunteerId", "successful"] as const,
        _count: { _all: true } as const,
        orderBy: [{ volunteerId: "asc" }, { successful: "asc" }],
      }),
      prisma.scanEvent.findMany({
        skip: (safeRecentPage - 1) * activityPageSize,
        take: activityPageSize,
        orderBy: { createdAt: "desc" },
        include: {
          guest: { select: { name: true } },
          volunteer: { select: { name: true } },
          slot: { select: { title: true } },
        },
      }),
      prisma.scanEvent.count(),
      prisma.$queryRaw<AdminCumulativeRow[]>`
        WITH daily AS (
          SELECT
            ("scanned_at" AT TIME ZONE 'Asia/Kolkata')::date AS "day",
            COUNT(*)::bigint AS "daily_count"
          FROM "food_entries"
          GROUP BY 1
        )
        SELECT
          TO_CHAR("day", 'DD Mon YY') AS "label",
          SUM("daily_count") OVER (ORDER BY "day")::bigint AS "value"
        FROM daily
        ORDER BY "day"
      `,
    ]);

    const summary = summaryRows[0];
    if (!summary) throw new Error("Admin summary query returned no data");
    const guests = Number(summary.guests);
    const assigned = Number(summary.assigned);
    const availableQrs = Number(summary.availableQrs);
    const verifiedMeals = Number(summary.verifiedMeals);
    const activeVolunteers = Number(summary.activeVolunteers);

    const dayMap = new Map<string, Record<string, string | number>>();
    const heatmap: Record<string, Record<string, number>> = {};
    for (const slot of slots) {
      const day = slot.day.label;
      const row = dayMap.get(day) ?? { day };
      row[slot.title] = Number(row[slot.title] ?? 0) + slot._count.entries;
      dayMap.set(day, row);
      heatmap[day] ??= {};
      heatmap[day][slot.title] = slot._count.entries;
    }

    const attemptMap = new Map<string, number>();
    const verifiedMap = new Map<string, number>();
    let scanAttempts = 0;
    for (const row of performanceGroups) {
      const count =
        row._count && typeof row._count !== "boolean"
          ? (row._count._all ?? 0)
          : 0;
      scanAttempts += count;
      attemptMap.set(
        row.volunteerId,
        (attemptMap.get(row.volunteerId) ?? 0) + count,
      );
      if (row.successful) verifiedMap.set(row.volunteerId, count);
    }

    const cumulativeData = cumulativeRows.map((row) => ({
      label: row.label,
      value: Number(row.value),
    }));

    return {
      totals: {
        guests,
        assigned,
        availableQrs,
        verifiedMeals,
        scanAttempts,
        activeVolunteers,
      },
      activeSlot: activeSlot
        ? {
            id: activeSlot.id,
            title: activeSlot.title,
            dayLabel: activeSlot.day.label,
            served: activeSlot._count.entries,
            total: guests,
          }
        : null,
      collegeData: collegeGroups.map((row) => ({
        college: row.college,
        count:
          row._count && typeof row._count !== "boolean"
            ? (row._count.id ?? 0)
            : 0,
      })),
      dayOverview: Array.from(dayMap.values()),
      heatmap,
      cumulativeData,
      volunteerPerformance: staff.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        active: member.active,
        scanned: attemptMap.get(member.id) ?? 0,
        verified: verifiedMap.get(member.id) ?? 0,
      })),
      recent: recent.map((event) => ({
        id: event.id,
        successful: event.successful,
        guestName: event.guest?.name ?? event.qrToken,
        volunteerName: event.volunteer.name,
        slotTitle: event.slot?.title ?? "No active slot",
        reason: event.reason,
        createdAt: event.createdAt.toISOString(),
      })),
      recentPage: safeRecentPage,
      recentPages: Math.max(1, Math.ceil(recentCount / activityPageSize)),
    };
  }

  async getGuestHistory(guestId: string): Promise<GuestHistory | null> {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        ...guestInclude,
        activityLog: { orderBy: { createdAt: "desc" } },
        entries: {
          orderBy: { scannedAt: "desc" },
          include: {
            volunteer: { select: { name: true } },
            slot: { select: { title: true, day: { select: { label: true } } } },
          },
        },
        scanEvents: {
          where: { successful: false },
          orderBy: { createdAt: "desc" },
          include: {
            volunteer: { select: { name: true } },
            slot: { select: { title: true } },
          },
        },
      },
    });
    if (!guest) return null;

    const timeline: GuestHistory["timeline"] = [
      {
        id: `registration-${guest.id}`,
        kind: "REGISTRATION" as const,
        title: "Participant registered",
        description: `${guest.name} was added from ${guest.college}.`,
        actor: null,
        qrToken: null,
        slotTitle: null,
        successful: null,
        createdAt: guest.createdAt.toISOString(),
      },
      ...guest.activityLog.map((event) => ({
        id: `activity-${event.id}`,
        kind: event.action.startsWith("QR_")
          ? ("QR" as const)
          : ("ACCOUNT" as const),
        title:
          event.action === "QR_ASSIGNED"
            ? "QR assigned"
            : event.action === "QR_UNASSIGNED"
              ? "QR unassigned"
              : event.action === "USER_REMOVED"
                ? "Participant removed"
                : event.action === "USER_RESTORED"
                  ? "Participant restored"
                  : event.action === "USER_UPDATED"
                    ? "Participant details updated"
                    : event.action.replaceAll("_", " ").toLowerCase(),
        description:
          event.details ?? event.action.replaceAll("_", " ").toLowerCase(),
        actor: event.volunteerName,
        qrToken: event.qrToken,
        slotTitle: null,
        successful: null,
        createdAt: event.createdAt.toISOString(),
      })),
      ...guest.entries.map((entry) => ({
        id: `meal-${entry.id}`,
        kind: "MEAL" as const,
        title: "Meal verified",
        description: `${entry.slot.day.label} · ${entry.slot.title}`,
        actor: entry.volunteer.name,
        qrToken: null,
        slotTitle: entry.slot.title,
        successful: true,
        createdAt: entry.scannedAt.toISOString(),
      })),
      ...guest.scanEvents.map((event) => ({
        id: `scan-${event.id}`,
        kind: "REJECTED_SCAN" as const,
        title: "Verification rejected",
        description:
          event.reason ?? "The QR verification attempt was rejected.",
        actor: event.volunteer.name,
        qrToken: event.qrToken,
        slotTitle: event.slot?.title ?? null,
        successful: false,
        createdAt: event.createdAt.toISOString(),
      })),
    ].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

    return {
      guest: {
        ...guestResult(guest),
        createdAt: guest.createdAt.toISOString(),
        removedAt: guest.removedAt?.toISOString() ?? null,
      },
      totals: {
        mealsVerified: guest.entries.length,
        scanAttempts: guest.entries.length + guest.scanEvents.length,
        rejectedScans: guest.scanEvents.length,
      },
      timeline,
    };
  }

  async listGuests(
    query: string,
    page: number,
    pageSize: number,
    filters: GuestListFilters = {
      scope: "ACTIVE",
      assignment: "ALL",
      field: "all",
      sortBy: "createdAt",
      direction: "desc",
    },
  ) {
    const q = query.trim();
    const searchByField: Record<
      Exclude<GuestListFilters["field"], "all">,
      Prisma.GuestWhereInput
    > = {
      name: { name: { contains: q, mode: "insensitive" } },
      college: { college: { contains: q, mode: "insensitive" } },
      mobile: { contactNo: { contains: q } },
      email: { email: { contains: q, mode: "insensitive" } },
      qr: { qrCard: { is: { uid: { contains: q, mode: "insensitive" } } } },
    };
    const allFieldSearch: Prisma.GuestWhereInput[] =
      Object.values(searchByField);
    const where: Prisma.GuestWhereInput = {
      ...(filters.scope === "ACTIVE"
        ? { active: true }
        : filters.scope === "REMOVED"
          ? { active: false }
          : {}),
      ...(filters.assignment === "ASSIGNED"
        ? { qrCard: { isNot: null } }
        : filters.assignment === "UNASSIGNED"
          ? { qrCard: { is: null } }
          : {}),
      ...(q
        ? filters.field === "all"
          ? { OR: allFieldSearch }
          : searchByField[filters.field]
        : {}),
    };
    const orderBy: Prisma.GuestOrderByWithRelationInput =
      filters.sortBy === "mobile"
        ? { contactNo: filters.direction }
        : { [filters.sortBy]: filters.direction };
    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const [total, rows] = await Promise.all([
      prisma.guest.count({ where }),
      prisma.guest.findMany({
        where,
        include: guestInclude,
        orderBy,
        skip: (safePage - 1) * safeSize,
        take: safeSize,
      }),
    ]);
    return {
      guests: rows.map(guestResult),
      total,
      page: safePage,
      pageSize: safeSize,
    };
  }

  async listStaff() {
    return prisma.volunteer.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }

  async createStaff(input: StaffInput) {
    await prisma.volunteer.create({
      data: {
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
      },
    });
  }

  async updateStaff(id: string, input: StaffUpdateInput) {
    await prisma.volunteer.update({
      where: { id },
      data: {
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        role: input.role,
        ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
      },
    });
  }

  async setStaffActive(id: string, active: boolean) {
    await prisma.volunteer.update({ where: { id }, data: { active } });
  }

  async listSlots() {
    const slots = await prisma.foodSlot.findMany({
      include: { day: true, _count: { select: { entries: true } } },
      orderBy: { startTime: "asc" },
    });
    return slots.map((slot) => ({
      id: slot.id,
      title: slot.title,
      status: slot.status,
      dayLabel: slot.day.label,
      eventDate: slot.day.eventDate.toISOString(),
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      served: slot._count.entries,
    }));
  }

  async createSlot(input: SlotInput) {
    const eventDate = new Date(`${input.eventDate}T00:00:00.000Z`);
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    if (
      [eventDate, startTime, endTime].some((date) =>
        Number.isNaN(date.getTime()),
      )
    ) {
      throw new Error("Invalid slot date or time");
    }
    if (endTime <= startTime)
      throw new Error("End time must be after start time");

    const day = await prisma.foodDay.upsert({
      where: { eventDate },
      update: { label: input.dayLabel.trim() },
      create: { eventDate, label: input.dayLabel.trim() },
    });
    await prisma.foodSlot.create({
      data: { dayId: day.id, title: input.title.trim(), startTime, endTime },
    });
  }

  async setSlotStatus(
    id: number,
    status: "SCHEDULED" | "ACTIVE" | "PAUSED" | "CLOSED",
  ) {
    await prisma.$transaction(async (tx) => {
      if (status === "ACTIVE") {
        await tx.foodSlot.updateMany({
          where: { status: "ACTIVE", id: { not: id } },
          data: { status: "PAUSED" },
        });
      }
      await tx.foodSlot.update({ where: { id }, data: { status } });
    });
  }

  async deleteSlot(id: number) {
    const entries = await prisma.foodEntry.count({ where: { slotId: id } });
    if (entries > 0)
      throw new Error(
        "Slots with verified meals cannot be deleted; close it instead",
      );
    await prisma.foodSlot.delete({ where: { id } });
  }
}
