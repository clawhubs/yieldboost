import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  type SettingsPatchInput,
} from "@/lib/backend-data";
import {
  getSettingsResponse,
  updateSettingsState,
} from "@/lib/server/runtime-store";

const settingsPatchSchema = z.object({
  riskProfile: z.enum(["Low", "Moderate", "High"]).optional(),
  maxSlippage: z.string().min(3).max(12).optional(),
  autoExecute: z.boolean().optional(),
  notificationMode: z.enum(["Realtime", "Digest"]).optional(),
});

export async function GET() {
  return NextResponse.json(await getSettingsResponse());
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as SettingsPatchInput;
  const patch = settingsPatchSchema.parse(body);
  await updateSettingsState(patch);

  return NextResponse.json({
    success: true,
    updatedAt: new Date().toISOString(),
  });
}
