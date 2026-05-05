import { NextResponse } from "next/server";

import { clearPortalSession } from "@/lib/dev-portal-auth";

export async function POST() {
  await clearPortalSession();
  return NextResponse.json({ success: true });
}
