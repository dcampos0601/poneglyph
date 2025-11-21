import fs from "fs/promises";
import { parse } from "csv-parse/sync";
import { PrismaClient, PlayerType, AumBucket } from "@prisma/client";

const prisma = new PrismaClient();

type AccountCsvRow = {
  Account_ID?: string;
  Account_Name?: string;
  Domain?: string;
  Market?: string;
  Country?: string;
  Player_Type?: string;
  Residential_Operation?: string;
  Multifamily_Exposure?: string;
  Affordable_Only?: string;
  Sunbelt_Flag?: string;
  AUM_Bucket?: string;
  Fit_Score?: string;
  Source_List?: string;
  Notes_Analyst?: string;
  Evidence_URL?: string;
  Last_Updated?: string;
  Analyst_Owner?: string;
};

function parseYesNo(value: string | undefined | null): boolean | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v || v === "unknown" || v === "nan") return null;
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

function mapPlayerType(raw: string | undefined | null): PlayerType {
  const v = (raw ?? "").toLowerCase();
  if (!v) return "OTHER";
  if (v.includes("asset")) return "ASSET_MANAGER";
  if (v.includes("property") || v.includes("mgmt") || v.includes("pm ")) {
    return "PROPERTY_MANAGEMENT";
  }
  if (v.includes("develop")) return "DEVELOPER";
  if (v.includes("family")) return "FAMILY_OFFICE";
  return "OTHER";
}

function mapAumBucket(raw: string | undefined | null): AumBucket | null {
  const v = (raw ?? "").toLowerCase();
  if (!v) return null;
  if (v.includes("<1") || v.includes("lt") || v.includes("0-1")) return "LT_1B";
  if (v.includes("1") && v.includes("3")) return "AUM_1_3B";
  if (v.includes("3") && v.includes("5")) return "AUM_3_5B";
  if (v.includes("5") || v.includes("10") || v.includes("+")) return "GT_5B";
  return null;
}

function parseFitScore(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return Math.round(n * 20);
}

async function importAccountsFromCsv(filePath: string) {
  const file = await fs.readFile(filePath, "utf8");
  const rows = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as AccountCsvRow[];

  for (const row of rows) {
    const name = row.Account_Name?.trim();
    const domain = row.Domain?.trim();

    if (!name && !domain) {
      console.warn("Skipping row without name/domain:", row);
      continue;
    }

    const fitScore = parseFitScore(row.Fit_Score);
    const playerType = mapPlayerType(row.Player_Type);
    const aumBucket = mapAumBucket(row.AUM_Bucket);

    const data = {
      name: name ?? "Unnamed Account",
      website: domain || row.Evidence_URL?.trim() || null,
      market: row.Market?.trim() || null,
      country: row.Country?.trim() || null,
      playerType,
      residentialOperation: parseYesNo(row.Residential_Operation),
      multifamilyExposure: parseYesNo(row.Multifamily_Exposure),
      affordableOnly: parseYesNo(row.Affordable_Only),
      sunbeltFlag: parseYesNo(row.Sunbelt_Flag),
      aumBucket,
      fitScore,
      sourceList: row.Source_List?.trim() || null,
      notesAnalyst: row.Notes_Analyst?.trim() || null,
    };

    try {
      if (domain) {
        const existingByDomain = await prisma.account.findFirst({
          where: { website: domain },
          select: { id: true },
        });
        if (existingByDomain) {
          await prisma.account.update({
            where: { id: existingByDomain.id },
            data,
          });
        } else {
          await prisma.account.create({ data });
        }
      } else if (name) {
        const existingByName = await prisma.account.findFirst({
          where: { name },
          select: { id: true },
        });
        if (existingByName) {
          await prisma.account.update({
            where: { id: existingByName.id },
            data,
          });
        } else {
          await prisma.account.create({ data });
        }
      }
    } catch (err) {
      console.error("Error upserting account", { domain, name, err });
    }
  }
}

async function main() {
  try {
    await importAccountsFromCsv("data/accounts.csv");
    console.log("Account import completed");
  } catch (err) {
    console.error("Account import failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
