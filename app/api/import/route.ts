import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let rows: any[] = [];

    if (name.endsWith(".csv")) {
      const content = buffer.toString("utf-8");
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV or Excel." },
        { status: 400 },
      );
    }

    // TODO: map and persist rows to Prisma (accounts/leads). For now, just return the parsed count.
    return NextResponse.json({ success: true, rows: rows.length });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 },
    );
  }
}
