import { NextRequest, NextResponse } from "next/server";
import { markLeadWorkedToday } from "@/lib/db";

type Params = {
  params: { id: string };
};

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  try {
    const updated = await markLeadWorkedToday(id);
    return NextResponse.json({ lead: updated });
  } catch (err) {
    console.error(`POST /api/leads/${id}/work error:`, err);
    return NextResponse.json({ error: "Could not update lead" }, { status: 500 });
  }
}
