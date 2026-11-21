import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Direction, compute, defaultLeverage, sessionFor } from "../lib/calc";
const prisma = new PrismaClient();

// [account, direction, class, symbol, entry, stop, exit, size, leverage, daysAgo, hourUTC, tags, grade]
type Row = [number, Direction, string, string, number, number, number | null, number, number, number, number, string[], number];
const rows: Row[] = [
  [0, "LONG", "Index / Futures", "NQ", 20850, 20790, 20940, 2, 20, 28, 14, ["ORB (Opening Range Breakout)", "VWAP"], 5],
  [0, "SHORT", "Index / Futures", "ES", 5920, 5935, 5898, 3, 20, 26, 15, ["Break and Retest"], 4],
  [0, "LONG", "US Stock", "NVDA", 138.4, 135.9, 144.2, 300, 2, 24, 14, ["Fair Value Gap (FVG)", "Order Block"], 4],
  [0, "SHORT", "US Stock", "AAPL", 228.1, 230.4, 229.3, 250, 2, 21, 15, ["9/21 EMA Crossover"], 2],
  [0, "LONG", "US Stock", "MSFT", 421.5, 417, 431.8, 120, 1, 18, 14, ["HTF Support & Resistance", "Volume Profile"], 5],
  [0, "SHORT", "Index / Futures", "NQ", 21180, 21240, 21095, 2, 20, 14, 14, ["Liquidity Sweep & Retest", "ORB (Opening Range Breakout)"], 5],
  [0, "LONG", "US Stock", "NVDA", 141.2, 138.4, 139.1, 250, 4, 9, 16, ["VWAP"], 2],
  [0, "LONG", "Index / Futures", "ES", 6010, 5995, 6034, 3, 20, 5, 14, ["Session Crossover", "Break and Retest"], 4],
  [0, "SHORT", "US Stock", "AAPL", 232.4, 234.9, null, 200, 2, 1, 14, ["Candle Range Theory (HTF)"], 3],
  [1, "LONG", "Index / Futures", "MNQ", 20990, 20940, 21070, 10, 20, 22, 14, ["ORB (Opening Range Breakout)"], 4],
  [1, "SHORT", "Index / Futures", "MES", 5955, 5970, 5968, 12, 20, 16, 15, ["Break and Retest", "VWAP"], 2],
  [1, "SHORT", "Index / Futures", "MNQ", 21240, 21290, 21150, 10, 20, 7, 14, ["Fair Value Gap (FVG)"], 5],
  [2, "LONG", "Commodity", "XAUUSD", 2635, 2625, 2661, 0.5, 20, 20, 13, ["Liquidity Sweep & Retest", "HTF Support & Resistance"], 5],
  [2, "SHORT", "Forex", "EURUSD", 1.0825, 1.0855, 1.0849, 1, 50, 17, 9, ["Session Crossover"], 2],
  [2, "LONG", "Commodity", "USOIL", 68.4, 67.6, 69.9, 2, 20, 12, 15, ["Order Block"], 4],
  [2, "SHORT", "Forex", "EURUSD", 1.0561, 1.0591, 1.0488, 1, 50, 8, 8, ["9/21 EMA Crossover", "HTF Support & Resistance"], 5],
  [2, "LONG", "Commodity", "XAUUSD", 2712, 2702, 2705, 0.5, 20, 4, 14, ["Break and Retest"], 3],
  [2, "LONG", "Forex", "USDJPY", 151.2, 150.7, 152.4, 1, 50, 3, 1, ["Candle Range Theory (HTF)"], 4],
  [2, "LONG", "Crypto", "BTCUSD", 95800, 94200, 99400, 0.4, 10, 11, 14, ["Fair Value Gap (FVG)", "Liquidity Sweep & Retest"], 5],
  [2, "SHORT", "Crypto", "BTCUSD", 98900, 100200, 96400, 0.4, 10, 2, 17, ["VWAP", "Order Block"], 4],
];

async function main() {
  await prisma.user.deleteMany({ where: { email: "demo@journal.dev" } });
  const user = await prisma.user.create({
    data: {
      email: "demo@journal.dev", passwordHash: await bcrypt.hash("demo1234", 10),
      accounts: { create: [
        { name: "US Equities", startingBalance: 200000, maxDrawdownLimitPct: 8, dailyLossLimit: 3000 },
        { name: "Prop Account", startingBalance: 100000, maxDrawdownLimitPct: 6, dailyLossLimit: 2000 },
        { name: "FX & Commodities", startingBalance: 25000, maxDrawdownLimitPct: 10, dailyLossLimit: 750 },
      ] },
    },
    include: { accounts: true },
  });
  const accs = [...user.accounts].sort((a, b) => b.startingBalance - a.startingBalance);
  for (const [ai, dir, cls, symbol, entry, stop, exit, size, lev, ago, hour, tags, grade] of rows) {
    const leverage = lev || defaultLeverage(cls);
    const fees = cls === "US Stock" ? 2 : cls === "Index / Futures" ? size * 2.4 : 0;
    const c = compute({ direction: dir, assetClass: cls, symbol, entryPrice: entry, stopLoss: stop, exitPrice: exit, size, leverage, fees });
    const t0 = new Date(); t0.setUTCDate(t0.getUTCDate() - ago); t0.setUTCHours(hour, 5, 0, 0);
    const t1 = exit == null ? null : new Date(t0.getTime() + 45 * 60000);
    await prisma.trade.create({ data: {
      userId: user.id, accountId: accs[ai].id, direction: dir, assetClass: cls, symbol, entryPrice: entry, stopLoss: stop, exitPrice: exit,
      size, leverage, fees, entryTime: t0, exitTime: t1, timeframe: "5m", session: sessionFor(t0.toISOString()), grade,
      tags, rules: grade >= 4 ? ["HTF Bias Aligned", "Proper Risk Sizing"] : ["Proper Risk Sizing"], mistakes: grade <= 2 ? ["Chased entry"] : [],
      notes: grade >= 4 ? "Clean execution, followed the plan." : "Entry was late; review the setup.", screenshotUrl: "",
      risk: c.risk, pnl: c.pnl, rMultiple: c.r, status: exit == null ? "OPEN" : "CLOSED",
    } });
  }
  console.log("Seeded demo@journal.dev / demo1234");
}
main().finally(() => prisma.$disconnect());
