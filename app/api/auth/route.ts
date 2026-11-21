import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  const { action, email, password } = await req.json();
  if (action === "logout") { await destroySession(); return NextResponse.json({ ok: true }); }
  const e = String(email || "").trim().toLowerCase();
  if (!e || String(password || "").length < 6) return NextResponse.json({ error: "Enter a username or email and a password of at least 6 characters." }, { status: 400 });
  if (action === "signup") {
    if (await prisma.user.findUnique({ where: { email: e } })) return NextResponse.json({ error: "That name is already taken." }, { status: 409 });
    const user = await prisma.user.create({
      data: { email: e, passwordHash: await bcrypt.hash(password, 10), accounts: { create: { name: "Main Account", startingBalance: 10000 } } },
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  }
  const user = await prisma.user.findUnique({ where: { email: e } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
