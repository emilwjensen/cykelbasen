import { NextResponse } from "next/server";
import { getApplicationDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const database = getApplicationDatabase();
    await database`select 1 as healthy`;
    return NextResponse.json(
      {
        status: "ok",
        database: "reachable",
        responseTimeMs: Date.now() - startedAt,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
      },
      {
        headers: { "Cache-Control": "no-store" },
        status: 503,
      },
    );
  }
}
