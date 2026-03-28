import { headers } from "next/headers";
import { NATIVE_APP_USER_AGENT_TOKEN } from "@/lib/native/constants";

export function isNativeAppUserAgent(userAgent: string | null | undefined) {
  return (userAgent ?? "").includes(NATIVE_APP_USER_AGENT_TOKEN);
}

export async function isNativeAppRequest() {
  const requestHeaders = await headers();
  return isNativeAppUserAgent(requestHeaders.get("user-agent"));
}
