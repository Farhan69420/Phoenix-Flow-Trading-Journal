import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = () => new TextEncoder().encode(process.env.JWT_SECRET!);
export async function createSession(uid: string) {
  const token = await new SignJWT({ uid }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(key());
  (await cookies()).set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function getUserId(): Promise<string | null> {
  const t = (await cookies()).get("session")?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.uid as string; } catch { return null; }
}
export async function destroySession() { (await cookies()).delete("session"); }
