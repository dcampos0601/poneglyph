import {
  PrismaClient,
  Prisma,
  LeadRouteType,
  LeadWorkStatus,
  PlayerType,
} from "@prisma/client";

// Avoid creating multiple instances in dev (Next App Router)
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (!globalThis.prisma) {
  globalThis.prisma = prisma;
}

// ---- Supporting types ----

export type LeadWithAccount = Prisma.LeadGetPayload<{
  include: { account: true };
}>;

export type LeadFilters = {
  owner?: string;
  routeType?: LeadRouteType;
  workStatus?: LeadWorkStatus[];
  market?: string;
  minFitScore?: number;
  playerTypes?: PlayerType[];
  search?: string;
};

// ---- Domain functions ----

export async function getLeadsForOwner(
  owner: string | undefined,
  filters: LeadFilters = {},
): Promise<LeadWithAccount[]> {
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

  // Filters based on Account (ICP)
  const accountWhere: Prisma.AccountWhereInput = {};
  if (market) {
    accountWhere.market = market;
  }
  if (minFitScore !== undefined) {
    accountWhere.fitScore = { gte: minFitScore };
  }
  if (playerTypes && playerTypes.length > 0) {
    accountWhere.playerType = { in: playerTypes };
  }
  if (Object.keys(accountWhere).length > 0) {
    where.account = accountWhere;
  }

  if (search && search.trim().length > 0) {
    const q = search.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      {
        account: {
          name: { contains: q, mode: "insensitive" },
        },
      },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: [
      // Note: enums are not ordered as HIGH > MEDIUM > LOW; refine in frontend later.
      { workStatus: "asc" },
      { lastTouchDate: "asc" },
      { createdAt: "asc" },
    ],
    take: 200, // safety cap
  });

  return leads;
}

// Mark lead as worked today
export async function markLeadWorkedToday(
  leadId: string,
): Promise<LeadWithAccount> {
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
