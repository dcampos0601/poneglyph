/**
 * Quick connectivity test for Prisma + PostgreSQL (local).
 *
 * Goal:
 * - Instantiate PrismaClient.
 * - Create a dummy AccountList and one Account.
 * - Read them back and log to console.
 *
 * Important:
 * - This script is ONLY for local dev testing, not used in production.
 * - Run with: npx ts-node scripts/test-db.ts  (if you add ts-node),
 *   or transpile to plain JS and run with node.
 */

import { PrismaClient, AumBucket, PlayerType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const listName = `Dev Test List ${new Date().toISOString()}`;

  const accountList = await prisma.accountList.create({
    data: {
      name: listName,
      source: "local-dev-script",
      notes: "Temporary list created by scripts/test-db.ts",
    },
  });

  const account = await prisma.account.create({
    data: {
      accountListId: accountList.id,
      name: "Test Account",
      website: "https://example.dev",
      playerType: PlayerType.ASSET_MANAGER,
      residentialOperation: true,
      multifamilyExposure: true,
      affordableOnly: false,
      sunbeltFlag: false,
      aumBucket: AumBucket.AUM_1_3B,
      fitScore: 80,
      market: "US - Sunbelt",
      country: "US",
      sourceList: "local-dev-script",
    },
  });

  const saved = await prisma.accountList.findUnique({
    where: { id: accountList.id },
    include: { accounts: true },
  });

  console.log("Created AccountList:", saved);
  console.log("Created Account:", account);
}

main()
  .catch((error) => {
    console.error("Error running test-db script:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
