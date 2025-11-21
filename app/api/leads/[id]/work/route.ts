import { NextRequest, NextResponse } from "next/server";
import { markLeadWorkedToday } from "@/lib/db";

type RouteParams = { id: string } & Record<string, string>;

function extractId(req: NextRequest, params: Partial<RouteParams>) {
  const fromParams =
    params.id ??
    (params as Record<string, string | undefined>).leadId ??
    Object.values(params).find(Boolean);

  if (fromParams) return fromParams;

  const { pathname } = new URL(req.url);
  const segments = pathname.split("/").filter(Boolean);
  const leadsIndex = segments.indexOf("leads");
  if (leadsIndex >= 0 && segments[leadsIndex + 1]) {
    return segments[leadsIndex + 1];
  }
  return undefined;
}

export async function POST(
  req: NextRequest,
  context: { params: RouteParams },
) {
  try {
    const params = context.params || {};
    const id = extractId(req, params);

    if (!id) {
      console.error("POST /api/leads/[id]/work called without valid id. Params:", params);
      return NextResponse.json(
        { error: "Missing lead id in route params" },
        { status: 400 },
      );
    }

    const lead = await markLeadWorkedToday(id);

    // Placeholder for HubSpot sync
    if (lead.hubspotContactId) {
      console.log(`[PENDING] Would sync Lead ${id} to HubSpot ID ${lead.hubspotContactId}`);
      // await updateHubSpotContact(...)
    }

    return NextResponse.json({ lead, success: true });
  } catch (error) {
    console.error("Error in POST /api/leads/[id]/work:", error);
    return NextResponse.json(
      { error: "Failed to mark lead as worked" },
      { status: 500 },
    );
  }
}
