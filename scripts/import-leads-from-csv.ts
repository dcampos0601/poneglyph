import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  LeadPriority,
  LeadRouteType,
  LeadWorkStatus,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

type RawLeadRow = {
  Lead_ID: string;
  Account_Name: string;
  Domain: string;
  Lead_Name: string;
  Title: string;
  Email: string;
  LinkedIn_URL: string;
  Market: string;
  Route_Type: string;
  Lead_Owner: string;
  Fit_Score: string;
  Priority: string;
  Work_Status: string;
  Last_Touch_Date: string;
  Hubspot_Contact_ID: string;
  Hubspot_Contact_URL: string;
  Source_List: string;
  Notes_Internal: string;
};

function mapRouteType(raw: string): LeadRouteType {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("warm")) return "WARM";
  if (v.includes("affinity")) return "DIRECT_AFFINITY";
  if (v.includes("direct")) return "DIRECT_AFFINITY";
  return "COLD";
}

function mapPriority(raw: string): LeadPriority {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("high") || v === "1") return "HIGH";
  if (v.includes("medium") || v === "2") return "MEDIUM";
  return "LOW";
}

function mapWorkStatus(raw: string): LeadWorkStatus {
  const v = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  if (v.includes("pending")) return "PENDING";
  if (v.includes("in_progress") || v.includes("progress")) return "IN_PROGRESS";
  if (v.includes("closed") || v.includes("hubspot")) return "CLOSED_IN_HUBSPOT";
  if (v.includes("lost")) return "LOST";
  return "PENDING";
}

function mapFitScore(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return Math.round(n * 20);
}

async function importLeadsFromCsv(filePath: string) {
  const csvPath = path.resolve(filePath);
  const file = fs.readFileSync(csvPath, "utf8");
  const rows = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RawLeadRow[];

  for (const row of rows) {
    const accountName = row.Account_Name?.trim();
    const domain = row.Domain?.trim();
    if (!accountName && !domain) {
      console.warn("Skipping row without Account_Name or Domain:", row);
      continue;
    }

    // Locate account by name or website
    let account = await prisma.account.findFirst({
      where: {
        OR: [
          accountName ? { name: accountName } : undefined,
          domain ? { website: domain } : undefined,
        ].filter(Boolean) as { name?: string; website?: string }[],
      },
      select: { id: true },
    });

    if (!account) {
      // Create a minimal account if it doesn't exist yet
      if (!accountName && !domain) {
        console.warn("No account found for lead row and no name/domain provided", row);
        continue;
      }
      try {
        const created = await prisma.account.create({
          data: {
            name: accountName || domain || "Unnamed Account",
            website: domain || null,
            playerType: "OTHER",
          },
          select: { id: true },
        });
        account = created;
      } catch (err) {
        console.warn("Failed to create account for lead row", { accountName, domain, err });
        continue;
      }
    }

    const email = row.Email?.toLowerCase();
    if (!email) {
      console.warn("Skipping lead without email", { accountName, domain, row });
      continue;
    }

    try {
      const existing = await prisma.lead.findFirst({
        where: {
          accountId: account.id,
          email,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            fullName: row.Lead_Name,
            title: row.Title,
            market: row.Market || null,
            fitScore: mapFitScore(row.Fit_Score),
            routeType: mapRouteType(row.Route_Type),
            leadOwner: row.Lead_Owner || "Martin",
            priority: mapPriority(row.Priority),
            workStatus: mapWorkStatus(row.Work_Status),
            hubspotContactId: row.Hubspot_Contact_ID || null,
            hubspotContactUrl: row.Hubspot_Contact_URL || null,
            sourceList: row.Source_List || null,
            internalNotes: row.Notes_Internal || null,
            lastTouchDate: row.Last_Touch_Date ? new Date(row.Last_Touch_Date) : null,
            linkedinUrl: row.LinkedIn_URL || null,
          },
        });
      } else {
        await prisma.lead.create({
          data: {
            accountId: account.id,
            fullName: row.Lead_Name,
            title: row.Title,
            email,
            linkedinUrl: row.LinkedIn_URL || null,
            routeType: mapRouteType(row.Route_Type),
            leadOwner: row.Lead_Owner || "Martin",
            priority: mapPriority(row.Priority),
            workStatus: mapWorkStatus(row.Work_Status),
            fitScore: mapFitScore(row.Fit_Score),
            market: row.Market || null,
            hubspotContactId: row.Hubspot_Contact_ID || null,
            hubspotContactUrl: row.Hubspot_Contact_URL || null,
            sourceList: row.Source_List || null,
            internalNotes: row.Notes_Internal || null,
            lastTouchDate: row.Last_Touch_Date ? new Date(row.Last_Touch_Date) : null,
          },
        });
      }
    } catch (err) {
      console.error("Error upserting lead", { email, accountId: account.id, err });
    }
  }
}

async function main() {
  try {
    await importLeadsFromCsv("./data/leads.csv");
    console.log("Lead import completed");
  } catch (err) {
    console.error("Lead import failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
