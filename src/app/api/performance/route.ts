import { NextResponse } from "next/server";
import { getTelemetryData } from "@/lib/db/telemetry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getTelemetryData();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch telemetry" },
      { status: 500 }
    );
  }
}
