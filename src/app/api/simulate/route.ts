import { NextResponse } from "next/server";
import { simulateTransactionBurst } from "@/lib/actions/transactions";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await simulateTransactionBurst();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
