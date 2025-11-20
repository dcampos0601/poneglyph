import {
  PrismaClient,
  PlayerType,
  AumBucket,
  LeadRouteType,
  LeadPriority,
  LeadWorkStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) Lista de origen (ej: Preqin DEV)
  const list = await prisma.accountList.create({
    data: {
      name: "DEV Seed",
      source: "SCRIPT",
    },
  });

  // 2) Cuentas con PlayerType distinto
  const blackstone = await prisma.account.create({
    data: {
      accountListId: list.id,
      name: "Blackstone Real Estate",
      website: "https://www.blackstone.com",
      market: "US - Sunbelt",
      country: "US",
      playerType: PlayerType.ASSET_MANAGER,
      residentialOperation: true,
      multifamilyExposure: true,
      affordableOnly: false,
      sunbeltFlag: true,
      aumBucket: AumBucket.GT_5B,
      fitScore: 95,
      sourceList: "DEV",
    },
  });

  const greystar = await prisma.account.create({
    data: {
      accountListId: list.id,
      name: "Greystar",
      website: "https://www.greystar.com",
      market: "US - Sunbelt",
      country: "US",
      playerType: PlayerType.DEVELOPER,
      residentialOperation: true,
      multifamilyExposure: true,
      affordableOnly: false,
      sunbeltFlag: true,
      aumBucket: AumBucket.AUM_3_5B,
      fitScore: 88,
      sourceList: "DEV",
    },
  });

  // 3) Leads repartidos por routeType / priority / status
  await prisma.lead.createMany({
    data: [
      {
        accountId: blackstone.id,
        fullName: "Sarah Jenkins",
        title: "VP Acquisitions",
        email: "sarah.jenkins@example.com",
        linkedinUrl: "https://www.linkedin.com/in/sarah-jenkins",
        market: blackstone.market,
        fitScore: blackstone.fitScore,
        routeType: LeadRouteType.WARM,
        leadOwner: "Martin",
        priority: LeadPriority.HIGH,
        workStatus: LeadWorkStatus.PENDING,
        sourceList: "Preqin DEV",
      },
      {
        accountId: blackstone.id,
        fullName: "David Chen",
        title: "Director Capital Formation",
        email: "david.chen@example.com",
        linkedinUrl: "https://www.linkedin.com/in/david-chen",
        market: blackstone.market,
        fitScore: blackstone.fitScore,
        routeType: LeadRouteType.DIRECT_AFFINITY,
        leadOwner: "Capitan",
        priority: LeadPriority.MEDIUM,
        workStatus: LeadWorkStatus.IN_PROGRESS,
        lastTouchDate: new Date(),
        sourceList: "SFR DEV",
      },
      {
        accountId: greystar.id,
        fullName: "Emily Torres",
        title: "SVP Investments",
        email: "emily.torres@example.com",
        linkedinUrl: "https://www.linkedin.com/in/emily-torres",
        market: greystar.market,
        fitScore: greystar.fitScore,
        routeType: LeadRouteType.COLD,
        leadOwner: "Martin",
        priority: LeadPriority.LOW,
        workStatus: LeadWorkStatus.PENDING,
        sourceList: "Costar DEV",
      },
    ],
  });

  // 4) Verificar round-trip
  const accounts = await prisma.account.findMany({
    include: { leads: true, accountList: true },
  });

  console.dir(accounts, { depth: null });
}

main()
  .catch((err) => {
    console.error("Error in test-import:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
