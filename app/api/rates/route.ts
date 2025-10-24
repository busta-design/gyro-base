/**
 * API endpoint to get current exchange rates
 * GET /api/rates
 */

import { NextResponse } from "next/server";

export async function GET() {
  const depositRate = process.env.BOB_USDC_RATE_DEPOSIT || "12.60";
  const withdrawalRate = process.env.BOB_USDC_RATE_WITHDRAWL || "12.40";

  return NextResponse.json({
    depositRate,
    withdrawalRate,
  });
}
