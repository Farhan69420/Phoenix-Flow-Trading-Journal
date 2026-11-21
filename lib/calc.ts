export const DIRECTIONS = ["LONG", "SHORT"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const ASSET_CLASSES = ["US Stock", "Index / Futures", "Commodity", "Forex", "Crypto"] as const;
export const SESSIONS = ["Asia", "London", "NY Open / ORB", "NY Afternoon", "London-NY Crossover"];
export const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily"];
export const LEVERAGE_PRESETS = [1, 2, 5, 10, 20, 50, 100];
export const DEFAULT_TAGS = ["ORB (Opening Range Breakout)", "Break and Retest", "Session Crossover", "HTF Support & Resistance", "Volume Profile", "VWAP", "9/21 EMA Crossover", "Candle Range Theory (HTF)", "Liquidity Sweep & Retest", "Fair Value Gap (FVG)", "Order Block"];
export const RULES = ["HTF Bias Aligned", "Liquidity Sweep Confirmed", "Proper Risk Sizing"];

const CONTRACT_SIZE: Record<string, number> = { NQ: 20, MNQ: 2, ES: 50, MES: 5, XAUUSD: 100, USOIL: 1000 };

export function contractSize(assetClass: string, symbol: string) {
  const s = symbol.toUpperCase();
  if (CONTRACT_SIZE[s]) return CONTRACT_SIZE[s];
  return assetClass === "Forex" ? 100000 : assetClass === "Commodity" ? 100 : 1;
}

export function defaultLeverage(assetClass: string) {
  switch (assetClass) {
    case "Forex": return 50;
    case "Index / Futures": return 20;
    case "Commodity": return 20;
    case "Crypto": return 10;
    default: return 1;
  }
}

export function normalizeDirection(v?: string | null): Direction {
  return String(v || "LONG").toUpperCase() === "SHORT" ? "SHORT" : "LONG";
}

export function sessionFor(iso: string) {
  const h = new Date(iso).getUTCHours();
  return h < 7 ? "Asia" : h < 12 ? "London" : h < 14 ? "London-NY Crossover" : h < 17 ? "NY Open / ORB" : "NY Afternoon";
}

export type CalcInput = {
  direction?: string;
  assetClass: string;
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  exitPrice?: number | null;
  size: number;
  leverage: number;
  fees: number;
};

// Forex P&L is converted to USD: USD-quote pairs (EURUSD) need no conversion; USD-base pairs (USDJPY) divide by price.
function fx(i: CalcInput, price: number) {
  if (i.assetClass !== "Forex") return 1;
  return i.symbol.toUpperCase().slice(3, 6) === "USD" ? 1 : price > 0 ? 1 / price : 1;
}

export function compute(i: CalcInput, balance = 0) {
  const dir = normalizeDirection(i.direction);
  const sign = dir === "SHORT" ? -1 : 1;
  const leverage = Math.max(1, Number(i.leverage) || 1);
  const unit = i.size * contractSize(i.assetClass, i.symbol);
  const positionValue = i.assetClass === "Forex"
    ? (i.symbol.toUpperCase().startsWith("USD") ? unit : unit * i.entryPrice)
    : i.entryPrice * unit;
  const marginUsed = leverage > 0 ? positionValue / leverage : positionValue;
  const risk = Math.max(0, sign * (i.entryPrice - i.stopLoss) * unit * fx(i, i.entryPrice));
  const closed = i.exitPrice != null && !Number.isNaN(i.exitPrice);
  const pnl = closed ? sign * (i.exitPrice! - i.entryPrice) * unit * fx(i, i.exitPrice!) - i.fees : null;
  return {
    direction: dir,
    leverage,
    positionValue,
    marginUsed,
    risk,
    riskPct: balance ? (risk / balance) * 100 : 0,
    pnl,
    pnlPct: pnl != null && balance ? (pnl / balance) * 100 : null,
    roePct: pnl != null && marginUsed > 0 ? (pnl / marginUsed) * 100 : null,
    r: pnl != null && risk > 0 ? pnl / risk : null,
  };
}
