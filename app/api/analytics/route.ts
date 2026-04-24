import { NextResponse } from "next/server";
import { getMockAnalytics } from "@/lib/backend-data";

export async function GET() {
  return NextResponse.json(getMockAnalytics());
}
