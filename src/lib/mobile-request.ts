import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { type CurrentMember, getCurrentMemberFromToken } from "@/lib/session";

export async function requireMobileAuth(request: NextRequest): Promise<CurrentMember | NextResponse> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const member = await getCurrentMemberFromToken(token);
  if (!member) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return member;
}
