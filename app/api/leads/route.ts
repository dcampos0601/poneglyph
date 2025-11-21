import { NextRequest, NextResponse } from "next/server";
import { LeadRouteType, LeadWorkStatus, PlayerType } from "@prisma/client";
import { getLeadsForOwner } from "@/lib/db";

function parseEnumList<T extends string>(raw: string | null): T[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean) as T[];
  return parts.length ? parts : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const owner = searchParams.get("owner");
    if (!owner) {
      return NextResponse.json({ error: "Missing owner parameter" }, { status: 400 });
    }

    const routeTypeRaw = searchParams.get("routeType");
    const routeType = routeTypeRaw ? (routeTypeRaw as LeadRouteType) : undefined;

    const workStatusList = parseEnumList<LeadWorkStatus>(searchParams.get("workStatus"));

    const market = searchParams.get("market") ?? undefined;

    const minFitScoreParam = searchParams.get("minFitScore");
    const minFitScoreParsed = minFitScoreParam ? Number(minFitScoreParam) : undefined;
    const minFitScore = Number.isFinite(minFitScoreParsed) ? minFitScoreParsed : undefined;

    const playerTypes = parseEnumList<PlayerType>(searchParams.get("playerTypes"));

    const search = searchParams.get("search") ?? undefined;

    const leads = await getLeadsForOwner(owner, {
      routeType,
      workStatus: workStatusList,
      market,
      minFitScore,
      playerTypes,
      search,
    });

    return NextResponse.json({ leads });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
