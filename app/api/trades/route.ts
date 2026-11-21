import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { compute, normalizeDirection } from "@/lib/calc";

const list = (v: any) => (Array.isArray(v) ? v : String(v || "").split(/[,|]/)).map((s: string) => s.trim()).filter(Boolean);

function build(b: any) {
  const direction = normalizeDirection(b.direction);
  const entry = +b.entryPrice, stop = +b.stopLoss, size = +b.size;
  const leverage = Math.max(1, +(b.leverage ?? 1) || 1);
  if (!(entry > 0) || !(size > 0)) throw new Error("Entry price and size must be above zero.");
  if (direction === "LONG" && !(stop < entry)) throw new Error("For a long trade, stop loss must be below entry price.");
  if (direction === "SHORT" && !(stop > entry)) throw new Error("For a short trade, stop loss must be above entry price.");
  const closed = b.exitPrice !== "" && b.exitPrice != null;
  const c = compute({
    direction,
    assetClass: b.assetClass,
    symbol: b.symbol,
    entryPrice: entry,
    stopLoss: stop,
    exitPrice: closed ? +b.exitPrice : null,
    size,
    leverage,
    fees: +b.fees || 0,
  });
  return {
    accountId: b.accountId,
    direction,
    assetClass: b.assetClass,
    symbol: String(b.symbol).toUpperCase().trim(),
    entryPrice: entry,
    stopLoss: stop,
    exitPrice: closed ? +b.exitPrice : null,
    size,
    leverage,
    fees: +b.fees || 0,
    entryTime: new Date(b.entryTime),
    exitTime: closed ? new Date(b.exitTime || Date.now()) : null,
    timeframe: b.timeframe || "5m",
    session: b.session || "NY Open / ORB",
    grade: Math.min(5, Math.max(1, +b.grade || 3)),
    tags: list(b.tags),
    rules: list(b.rules),
    mistakes: list(b.mistakes),
    notes: String(b.notes || ""),
    screenshotUrl: String(b.screenshotUrl || ""),
    risk: c.risk,
    pnl: c.pnl,
    rMultiple: c.r,
    status: closed ? "CLOSED" : "OPEN",
  };
}

const deny = () => NextResponse.json({ error: "Not signed in" }, { status: 401 });
const bad = (e: any) => NextResponse.json({ error: e.message || "Invalid trade" }, { status: 400 });

export async function GET() {
  const uid = await getUserId(); if (!uid) return deny();
  return NextResponse.json(await prisma.trade.findMany({ where: { userId: uid }, orderBy: { entryTime: "desc" } }));
}
export async function POST(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  const body = await req.json();
  try {
    const items = (Array.isArray(body) ? body : [body]).map(build);
    const owned = new Set((await prisma.account.findMany({ where: { userId: uid }, select: { id: true } })).map((a) => a.id));
    if (items.some((t) => !owned.has(t.accountId))) throw new Error("Unknown account.");
    await prisma.trade.createMany({ data: items.map((t) => ({ ...t, userId: uid })) });
    return NextResponse.json({ ok: true, count: items.length });
  } catch (e) { return bad(e); }
}
export async function PUT(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  const b = await req.json();
  try {
    await prisma.trade.updateMany({ where: { id: b.id, userId: uid }, data: build(b) });
    return NextResponse.json({ ok: true });
  } catch (e) { return bad(e); }
}
export async function DELETE(req: Request) {
  const uid = await getUserId(); if (!uid) return deny();
  await prisma.trade.deleteMany({ where: { id: new URL(req.url).searchParams.get("id")!, userId: uid } });
  return NextResponse.json({ ok: true });
}
