import { jwtVerify, SignJWT } from "jose";

// Reuses next-auth's own AUTH_SECRET rather than introducing a second
// secret to manage — acceptable here since this app has exactly two users
// and a compromised secret would already mean a compromised deployment.
const MOBILE_TOKEN_TTL = "90d";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(MOBILE_TOKEN_TTL)
    .sign(getSecretKey());
}

export async function verifyMobileToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
