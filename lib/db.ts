// lib/db.ts
import {
  PrismaClient,
  Prisma,
  LeadRouteType,
  LeadWorkStatus,
  PlayerType,
} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ------- Tipos de filtros para /sales --------

export type LeadFilters = {
  owner?: string;
  routeType?: LeadRouteType;
  workStatus?: LeadWorkStatus[];
  market?: string;
  minFitScore?: number;
  playerTypes?: PlayerType[];
  search?: string;
};

export async function getLeadsForOwner(
  owner: string | undefined,
  filters: LeadFilters = {},
) {
  const {
    routeType,
    workStatus,
    market,
    minFitScore,
    playerTypes,
    search,
  } = filters;

  const where: Prisma.LeadWhereInput = {};
  if (owner) {
    where.leadOwner = owner;
  }

  if (routeType) {
    where.routeType = routeType;
  }

  if (workStatus && workStatus.length > 0) {
    where.workStatus = { in: workStatus };
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { fullName: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { account: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  const accountWhere: Prisma.AccountWhereInput = {};

  if (market) {
    accountWhere.market = market;
  }

  if (minFitScore != null) {
    accountWhere.fitScore = { gte: minFitScore };
  }

  if (playerTypes && playerTypes.length > 0) {
    accountWhere.playerType = { in: playerTypes };
  }

  const leads = await prisma.lead.findMany({
    where: {
      ...where,
      ...(Object.keys(accountWhere).length > 0 ? { account: accountWhere } : {}),
    },
    include: {
      account: true,
    },
    orderBy: [
      { priority: "desc" },
      { lastTouchDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  return leads;
}

// ------- NUEVO: marcar lead como trabajado hoy --------

export async function markLeadWorkedToday(leadId: string) {
  const existing = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { account: true },
  });

  if (!existing) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const now = new Date();
  const newStatus =
    existing.workStatus === LeadWorkStatus.PENDING
      ? LeadWorkStatus.IN_PROGRESS
      : existing.workStatus;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastTouchDate: now,
      workStatus: newStatus,
    },
    include: { account: true },
  });

  return updated;
}
