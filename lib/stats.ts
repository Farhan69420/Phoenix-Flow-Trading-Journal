import type { Direction } from "./calc";

export type Account = { id: string; name: string; startingBalance: number; currency: string; maxDrawdownLimitPct: number; dailyLossLimit: number };
export type Trade = {
  id: string;
  accountId: string;
  direction: Direction;
  assetClass: string;
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  exitPrice: number | null;
  size: number;
  leverage: number;
  fees: number;
  entryTime: string;
  exitTime: string | null;
  timeframe: string;
  session: string;
  grade: number;
  tags: string[];
  rules: string[];
  mistakes: string[];
  notes: string;
  screenshotUrl: string;
  risk: number;
  pnl: number | null;
  rMultiple: number | null;
  status: string;
};

export const closedOf = (t: Trade[]) => t.filter((x) => x.status === "CLOSED").sort((a, b) => +new Date(a.exitTime!) - +new Date(b.exitTime!));
export const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function summarize(trades: Trade[], start: number) {
  const c = closedOf(trades);
  let bal = start, peak = start, maxDD = 0;
  const curve: { i: number; label: string; bal: number; symbol: string; direction: Direction; setup: string; pnl: number; r: number }[] = [
    { i: 0, label: "Start", bal: start, symbol: "-", direction: "LONG", setup: "-", pnl: 0, r: 0 },
  ];
  c.forEach((t, k) => {
    bal += t.pnl!; peak = Math.max(peak, bal); maxDD = Math.max(maxDD, peak ? ((peak - bal) / peak) * 100 : 0);
    curve.push({ i: k + 1, label: new Date(t.exitTime!).toLocaleDateString(), bal: +bal.toFixed(2), symbol: t.symbol, direction: t.direction || "LONG", setup: t.tags[0] || "-", pnl: t.pnl!, r: t.rMultiple ?? 0 });
  });
  const gp = c.filter((t) => t.pnl! > 0).reduce((s, t) => s + t.pnl!, 0);
  const gl = Math.abs(c.filter((t) => t.pnl! <= 0).reduce((s, t) => s + t.pnl!, 0));
  const net = bal - start;

  // Current consecutive win/loss streak from most recent closed trade
  let streak = 0;
  let streakType: "WIN" | "LOSS" | null = null;
  for (let i = c.length - 1; i >= 0; i--) {
    const isWin = (c[i].pnl ?? 0) > 0;
    const kind = isWin ? "WIN" : "LOSS";
    if (streakType === null) { streakType = kind; streak = 1; }
    else if (streakType === kind) streak++;
    else break;
  }

  return {
    balance: bal, net, netPct: start ? (net / start) * 100 : 0, count: c.length,
    winRate: c.length ? (c.filter((t) => t.pnl! > 0).length / c.length) * 100 : 0,
    pf: gl ? gp / gl : gp ? Infinity : 0,
    avgR: c.length ? c.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / c.length : 0,
    expectancy: c.length ? net / c.length : 0,
    dd: peak ? ((peak - bal) / peak) * 100 : 0, maxDD, curve,
    streak, streakType,
  };
}

export function group(trades: Trade[], keys: (t: Trade) => string[]) {
  const m = new Map<string, Trade[]>();
  closedOf(trades).forEach((t) => keys(t).forEach((k) => m.set(k, [...(m.get(k) || []), t])));
  return [...m].map(([key, ts]) => ({
    key, n: ts.length, win: (ts.filter((t) => t.pnl! > 0).length / ts.length) * 100,
    avgR: ts.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / ts.length, pnl: ts.reduce((s, t) => s + t.pnl!, 0),
  })).sort((a, b) => b.pnl - a.pnl);
}
