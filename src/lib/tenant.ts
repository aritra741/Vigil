"use server";

import { DEMO_TENANT_ID } from "@/types";

export async function getTenantId(): Promise<string> {
  return DEMO_TENANT_ID;
}
