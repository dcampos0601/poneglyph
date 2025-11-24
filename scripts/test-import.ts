import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("test-import script: seeding mock data is disabled. Ready for real data imports.");
}

main()
  .catch((err) => {
    console.error("Error in test-import:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
