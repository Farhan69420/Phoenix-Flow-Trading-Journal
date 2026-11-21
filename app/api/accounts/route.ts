import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const clean = (b: any) => ({ name: String(b.name || "Account"), startingBalance: +b.startingBalance || 0, currency: String(b.currency || "USD").toUpperCase(), maxDrawdownLimitPct: +b.maxDrawdownLimitPct || 10, dailyLossLimit: +b.dailyLossLimit || 0 });
const deny = () => NextResponse.json({ error: "Not signed in" }, { status: 401 });

export async function GET() {
  const uid = await getUserId(); if (!uid) return deny();
  return NextResponse.json(await prisma.account.findMany({ where: { userId: uid }, orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  return NextResponse.json(await prisma.account.create({ data: { ...clean(await req.json()), userId: uid } }));
}
export async function PUT(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  const b = await req.json();
  await prisma.account.updateMany({ where: { id: b.id, userId: uid }, data: clean(b) });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  const id = new URL(req.url).searchParams.get("id")!;
  if ((await prisma.account.count({ where: { userId: uid } })) < 2) return NextResponse.json({ error: "Keep at least one account." }, { status: 400 });
  await prisma.account.deleteMany({ where: { id, userId: uid } });
  return NextResponse.json({ ok: true });
}
