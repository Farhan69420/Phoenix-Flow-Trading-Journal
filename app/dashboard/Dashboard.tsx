"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, FileX2, Flame, Gauge,
  LayoutDashboard, LogOut, Pencil, Plus, Scale, Search, ShieldAlert, Sparkles, Star, Target,
  Trash2, TrendingDown, TrendingUp, Upload, Wallet, X,
} from "lucide-react";
import {
  ASSET_CLASSES, DEFAULT_TAGS, Direction, LEVERAGE_PRESETS, RULES, SESSIONS, TIMEFRAMES,
  compute, defaultLeverage, sessionFor,
} from "@/lib/calc";
import { Account, Trade, closedOf, dayKey, group, summarize } from "@/lib/stats";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeProvider";
import PhoenixLogo from "../components/PhoenixLogo";

const money = (n: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(n);
const tone = (n: number) => (n > 0 ? "text-gain" : n < 0 ? "text-loss" : "");
const num = (s: string) => parseFloat(s) || 0;
const localInput = (d: Date) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

const blank = (accountId: string) => ({
  id: "",
  accountId,
  direction: "LONG" as Direction,
  assetClass: "US Stock",
  symbol: "",
  entryPrice: "",
  stopLoss: "",
  exitPrice: "",
  size: "",
  leverage: "1",
  fees: "0",
  entryTime: localInput(new Date()),
  exitTime: "",
  timeframe: "5m",
  session: sessionFor(new Date().toISOString()),
  grade: 3,
  tags: [] as string[],
  rules: [] as string[],
  mistakes: "",
  notes: "",
  screenshotUrl: "",
});
type Form = ReturnType<typeof blank>;

const toForm = (t: Trade): Form => ({
  id: t.id,
  accountId: t.accountId,
  direction: t.direction || "LONG",
  assetClass: t.assetClass,
  symbol: t.symbol,
  entryPrice: String(t.entryPrice),
  stopLoss: String(t.stopLoss),
  exitPrice: t.exitPrice == null ? "" : String(t.exitPrice),
  size: String(t.size),
  leverage: String(t.leverage || 1),
  fees: String(t.fees),
  entryTime: localInput(new Date(t.entryTime)),
  exitTime: t.exitTime ? localInput(new Date(t.exitTime)) : "",
  timeframe: t.timeframe,
  session: t.session,
  grade: t.grade,
  tags: t.tags,
  rules: t.rules,
  mistakes: t.mistakes.join(", "),
  notes: t.notes,
  screenshotUrl: t.screenshotUrl,
});

const post = (url: string, method: string, body?: unknown) => fetch(url, { method, body: body ? JSON.stringify(body) : undefined });

const leverageBucket = (lev: number) => {
  if (lev <= 1) return "1x (No leverage)";
  if (lev <= 5) return "2x – 5x";
  if (lev <= 20) return "6x – 20x";
  return "21x+";
};

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategyNames, setStrategyNames] = useState<string[]>([]);
  const [sel, setSel] = useState("all");
  const [day, setDay] = useState<string | null>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [tab, setTab] = useState<"asset" | "direction" | "strategy" | "session">("asset");
  const [f, setF] = useState({ q: "", direction: "", asset: "", tag: "", session: "", status: "" });
  const [form, setForm] = useState<Form | null>(null);
  const [acc, setAcc] = useState<Partial<Account> | null>(null);
  const [detail, setDetail] = useState<Trade | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [a, t, s] = await Promise.all([fetch("/api/accounts"), fetch("/api/trades"), fetch("/api/strategies")]);
    if (a.status === 401) return router.push("/login");
    setAccounts(await a.json());
    setTrades(await t.json());
    if (s.ok) {
      const list = await s.json();
      setStrategyNames(Array.isArray(list) ? list.map((x: any) => String(x.name || "")).filter(Boolean) : []);
    }
    setLoaded(true);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const scopedAccounts = sel === "all" ? accounts : accounts.filter((a) => a.id === sel);
  const scoped = useMemo(() => (sel === "all" ? trades : trades.filter((t) => t.accountId === sel)), [trades, sel]);
  const start = scopedAccounts.reduce((s, a) => s + a.startingBalance, 0);
  const cur = sel === "all" ? "USD" : scopedAccounts[0]?.currency || "USD";
  const S = useMemo(() => summarize(scoped, start), [scoped, start]);
  const ddLimit = scopedAccounts.length ? Math.min(...scopedAccounts.map((a) => a.maxDrawdownLimitPct)) : 10;
  const dailyLimit = scopedAccounts.reduce((s, a) => s + a.dailyLossLimit, 0);
  const todayPnl = closedOf(scoped).filter((t) => dayKey(t.exitTime!) === dayKey(new Date().toISOString())).reduce((s, t) => s + t.pnl!, 0);
  const allTags = useMemo(() => [...new Set([...strategyNames, ...DEFAULT_TAGS, ...trades.flatMap((t) => t.tags)])], [strategyNames, trades]);
  const symbols = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades]);
  const balanceOf = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    return (a?.startingBalance || 0) + trades.filter((t) => t.accountId === id && t.status === "CLOSED").reduce((s, t) => s + t.pnl!, 0);
  };

  // Sidebar telemetry metrics
  const closedScoped = useMemo(() => closedOf(scoped), [scoped]);
  const longClosed = useMemo(() => closedScoped.filter((t) => (t.direction || "LONG") === "LONG"), [closedScoped]);
  const shortClosed = useMemo(() => closedScoped.filter((t) => t.direction === "SHORT"), [closedScoped]);
  const longPnl = longClosed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const shortPnl = shortClosed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const longWinRate = longClosed.length ? (longClosed.filter((t) => (t.pnl ?? 0) > 0).length / longClosed.length) * 100 : 0;
  const shortWinRate = shortClosed.length ? (shortClosed.filter((t) => (t.pnl ?? 0) > 0).length / shortClosed.length) * 100 : 0;
  const longSharePct = closedScoped.length ? (longClosed.length / closedScoped.length) * 100 : 50;

  const openTrades = useMemo(() => scoped.filter((t) => t.status === "OPEN"), [scoped]);
  const openRisk = openTrades.reduce((s, t) => s + t.risk, 0);
  const avgLeverage = scoped.length ? scoped.reduce((s, t) => s + (t.leverage || 1), 0) / scoped.length : 1;
  const bestStrategy = useMemo(() => {
    const byTag = group(scoped, (t) => (t.tags.length ? t.tags : []));
    return byTag.length ? byTag[0] : null;
  }, [scoped]);
  const currentSession = sessionFor(new Date().toISOString());

  const shown = scoped.filter((t) =>
    (!day || (t.exitTime && dayKey(t.exitTime) === day)) &&
    (!f.direction || (t.direction || "LONG") === f.direction) &&
    (!f.asset || t.assetClass === f.asset) &&
    (!f.tag || t.tags.includes(f.tag)) &&
    (!f.session || t.session === f.session) &&
    (!f.status || (f.status === "OPEN" ? t.status === "OPEN" : f.status === "WIN" ? (t.pnl ?? 0) > 0 : t.status === "CLOSED" && (t.pnl ?? 0) <= 0)) &&
    (!f.q || t.symbol.toLowerCase().includes(f.q.toLowerCase())));

  async function saveTrade() {
    if (!form) return;
    const r = await post("/api/trades", form.id ? "PUT" : "POST", form);
    if (!r.ok) return alert((await r.json()).error);
    setForm(null);
    load();
  }
  async function closeTrade(t: Trade) {
    const p = prompt(`Exit price for ${t.direction || "LONG"} ${t.symbol}?`);
    if (!p) return;
    const r = await post("/api/trades", "PUT", { ...toForm(t), exitPrice: p, exitTime: localInput(new Date()) });
    if (!r.ok) return alert((await r.json()).error);
    load();
  }
  async function removeTrade(t: Trade) {
    if (confirm(`Delete ${t.direction || "LONG"} ${t.symbol} trade?`)) {
      await post(`/api/trades?id=${t.id}`, "DELETE");
      load();
    }
  }
  async function saveAccount() {
    if (!acc) return;
    const r = await post("/api/accounts", acc.id ? "PUT" : "POST", acc);
    if (!r.ok) return alert((await r.json()).error);
    setAcc(null);
    load();
  }
  async function removeAccount(id: string) {
    if (!confirm("Delete this account and all of its trades?")) return;
    const r = await post(`/api/accounts?id=${id}`, "DELETE");
    if (!r.ok) return alert((await r.json()).error);
    setAcc(null);
    setSel("all");
    load();
  }
  const logout = async () => { await post("/api/auth", "POST", { action: "logout" }); router.push("/login"); };

  const COLS = ["direction", "symbol", "assetClass", "entryPrice", "stopLoss", "exitPrice", "size", "leverage", "fees", "entryTime", "exitTime", "timeframe", "session", "grade", "tags", "notes"];
  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = shown.map((t) => COLS.map((c) => esc(c === "tags" ? t.tags.join("|") : (t as any)[c])).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[COLS.join(","), ...rows].join("\n")], { type: "text/csv" }));
    a.download = "trades.csv";
    a.click();
  }
  async function importCsv(file: File) {
    const target = sel === "all" ? accounts[0]?.id : sel;
    const parse = (line: string) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, COLS.length);
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
    const head = parse(lines[0]);
    const items = lines.slice(1).map((l) => {
      const v = parse(l);
      const o: any = { accountId: target };
      head.forEach((h, i) => (o[h] = v[i]));
      return o;
    });
    const r = await post("/api/trades", "POST", items);
    alert(r.ok ? `Imported ${items.length} trades into the selected account.` : (await r.json()).error);
    load();
  }

  // Calendar
  const dayMap = useMemo(() => {
    const m = new Map<string, { pnl: number; n: number }>();
    closedOf(scoped).forEach((t) => {
      const k = dayKey(t.exitTime!);
      const v = m.get(k) || { pnl: 0, n: 0 };
      m.set(k, { pnl: v.pnl + t.pnl!, n: v.n + 1 });
    });
    return m;
  }, [scoped]);
  const first = month.getDay(), dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const preview = form
    ? compute({
      direction: form.direction,
      assetClass: form.assetClass,
      symbol: form.symbol,
      entryPrice: num(form.entryPrice),
      stopLoss: num(form.stopLoss),
      exitPrice: form.exitPrice === "" ? null : num(form.exitPrice),
      size: num(form.size),
      leverage: Math.max(1, num(form.leverage) || 1),
      fees: num(form.fees),
    }, balanceOf(form.accountId))
    : null;

  const detailCalc = detail
    ? compute({
      direction: detail.direction,
      assetClass: detail.assetClass,
      symbol: detail.symbol,
      entryPrice: detail.entryPrice,
      stopLoss: detail.stopLoss,
      exitPrice: detail.exitPrice,
      size: detail.size,
      leverage: detail.leverage || 1,
      fees: detail.fees,
    }, balanceOf(detail.accountId))
    : null;

  const patch = (p: Partial<Form>) => setForm((x) => (x ? { ...x, ...p } : x));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-iris" />
      </div>
    );
  }

  const field = (label: string, child: React.ReactNode, cls = "") => <div className={cls}><label className="lbl">{label}</label>{child}</div>;
  const assetStyle: Record<string, string> = {
    "US Stock": "bg-sky-500/15 text-sky-300",
    "Index / Futures": "bg-violet-500/15 text-violet-300",
    Commodity: "bg-amber-500/15 text-amber-300",
    Forex: "bg-teal-500/15 text-teal-300",
    Crypto: "bg-orange-500/15 text-orange-300",
  };
  const dirBadge = (d?: string) => {
    const isShort = d === "SHORT";
    return (
      <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${isShort ? "bg-loss/15 text-loss" : "bg-gain/15 text-gain"}`}>
        {isShort ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
        {isShort ? "SHORT" : "LONG"}
      </span>
    );
  };
  const stars = (n: number, size = 13) => (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= n ? "fill-iris text-iris" : "text-white/15"} />)}
    </span>
  );
  const bars = (rows: ReturnType<typeof group>, label: string) => {
    const mx = Math.max(1, ...rows.map((r) => Math.abs(r.pnl)));
    return (
      <div>
        <div className="mb-3 text-xs font-semibold text-slate-400">{label}</div>
        {rows.length ? rows.map((r) => (
          <div key={r.key} className="mb-3">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{r.key}</span>
              <span className={`font-semibold ${tone(r.pnl)}`}>{money(r.pnl, cur)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full ${r.pnl >= 0 ? "bg-gain" : "bg-loss"}`} style={{ width: `${(Math.abs(r.pnl) / mx) * 100}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{r.n} trades · {r.win.toFixed(0)}% win · {r.avgR.toFixed(2)}R average</div>
          </div>
        )) : <p className="text-sm text-slate-500">Close a trade to see this breakdown.</p>}
      </div>
    );
  };
  const sizeLabel = (c: string) => (c === "US Stock" ? "Shares" : c === "Crypto" ? "Quantity" : c === "Index / Futures" ? "Contracts" : "Lots");
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const monthRows = [...dayMap].filter(([k]) => k.startsWith(monthKey));
  const monthPnl = monthRows.reduce((s, [, v]) => s + v.pnl, 0);
  const monthMax = Math.max(1, ...monthRows.map(([, v]) => Math.abs(v.pnl)));
  const todayKey = dayKey(new Date().toISOString());
  const ddPct = Math.min(100, ddLimit ? (S.dd / ddLimit) * 100 : 0);
  const dailyLossPct = dailyLimit > 0 && todayPnl < 0 ? Math.min(100, (Math.abs(todayPnl) / dailyLimit) * 100) : 0;

  const kpis = [
    { l: "Win rate", v: `${S.winRate.toFixed(1)}%`, sub: `${S.count} closed trades`, I: Target, c: "" },
    { l: "Profit factor", v: S.pf === Infinity ? "∞" : S.pf.toFixed(2), sub: "Gross wins ÷ gross losses", I: Scale, c: "" },
    { l: "Average R", v: `${S.avgR.toFixed(2)}R`, sub: "Per closed trade", I: TrendingUp, c: tone(S.avgR) },
    { l: "Expectancy", v: money(S.expectancy, cur), sub: "Expected per trade", I: Activity, c: tone(S.expectancy) },
  ];

  const acctBtn = (id: string, name: string, bal: number, pct: number, c: string) => (
    <button
      key={id}
      onClick={() => { setSel(id); setDay(null); }}
      className={`w-full rounded-xl border px-3 py-2 text-left transition ${sel === id ? "border-iris/60 bg-iris/15 shadow-[0_0_20px_-10px_rgba(139,140,255,0.8)]" : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"}`}
    >
      <div className="truncate text-sm font-medium text-slate-100">{name}</div>
      <div className="mt-0.5 flex items-baseline justify-between text-xs">
        <span className="text-slate-400">{money(bal, c)}</span>
        <span className={tone(pct)}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
      </div>
    </button>
  );
  const pctOf = (a: Account) => (a.startingBalance ? ((balanceOf(a.id) - a.startingBalance) / a.startingBalance) * 100 : 0);
  const allBal = accounts.reduce((s, a) => s + balanceOf(a.id), 0);
  const allStart = accounts.reduce((s, a) => s + a.startingBalance, 0);

  const stopInvalid = form && form.stopLoss !== "" && form.entryPrice !== "" && (
    form.direction === "LONG" ? num(form.stopLoss) >= num(form.entryPrice) : num(form.stopLoss) <= num(form.entryPrice)
  );

  return (
    <div className="theme-scope min-h-screen">
      {/* Filled Left Sidebar */}
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-indigo-200/[0.09] bg-[#060a18]/80 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <Link href="/" className="flex items-center gap-2.5">
            <PhoenixLogo size={38} />
            <div>
              <div className="text-base font-extrabold leading-tight tracking-tight text-white">Phoenix Flow</div>
              <div className="text-[11px] text-indigo-200/60">Long &amp; Short · Multi-Asset</div>
            </div>
          </Link>
          <ThemeToggle compact />
        </div>

        <nav className="mb-4 space-y-1 text-sm">
          {[["#overview", "Overview", LayoutDashboard], ["#insights", "Insights", Activity], ["#trades", "Trade log", Wallet]].map(([h, l, I]: any) => (
            <a key={h} href={h} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
              <I size={15} className="text-iris/90" />{l}
            </a>
          ))}
          <Link href="/strategies" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
            <BookOpen size={15} className="text-iris/90" />Strategies
          </Link>
        </nav>

        <div className="flex-1 space-y-4 overflow-y-auto pr-0.5">
          {/* Accounts */}
          <div>
            <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Accounts
              <button className="icon-btn !p-1" title="New account" onClick={() => setAcc({ currency: "USD", maxDrawdownLimitPct: 10, dailyLossLimit: 0 })}>
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {acctBtn("all", "All accounts", allBal, allStart ? ((allBal - allStart) / allStart) * 100 : 0, "USD")}
              {accounts.map((a) => acctBtn(a.id, a.name, balanceOf(a.id), pctOf(a), a.currency))}
            </div>
          </div>

          {/* Long vs Short Split */}
          <div className="rounded-xl border border-indigo-200/[0.09] bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Long vs Short</span>
              <span className="font-normal normal-case text-slate-500">{closedScoped.length} closed</span>
            </div>
            <div className="mb-2.5 flex h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="bg-gain transition-all" style={{ width: `${longSharePct}%` }} />
              <div className="bg-loss transition-all" style={{ width: `${100 - longSharePct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-gain/15 bg-gain/[0.06] p-2">
                <div className="flex items-center gap-1 font-semibold text-gain"><TrendingUp size={12} />Long ({longClosed.length})</div>
                <div className={`mt-1 font-bold ${tone(longPnl)}`}>{money(longPnl, cur)}</div>
                <div className="text-[10px] text-slate-400">{longWinRate.toFixed(0)}% win</div>
              </div>
              <div className="rounded-lg border border-loss/15 bg-loss/[0.06] p-2">
                <div className="flex items-center gap-1 font-semibold text-loss"><TrendingDown size={12} />Short ({shortClosed.length})</div>
                <div className={`mt-1 font-bold ${tone(shortPnl)}`}>{money(shortPnl, cur)}</div>
                <div className="text-[10px] text-slate-400">{shortWinRate.toFixed(0)}% win</div>
              </div>
            </div>
          </div>

          {/* Risk & Exposure Guardrails */}
          <div className="rounded-xl border border-indigo-200/[0.09] bg-white/[0.03] p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Risk &amp; Exposure</span>
              <Gauge size={13} className="text-iris" />
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Open positions</span>
              <span className="font-semibold text-slate-100">{openTrades.length} · {money(openRisk, cur)} risk</span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Avg leverage</span>
              <span className="font-semibold text-indigo-200">{avgLeverage.toFixed(1)}x</span>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-[11px]">
                <span className="text-slate-400">Drawdown limit</span>
                <span className={S.dd >= ddLimit ? "font-semibold text-loss" : "text-slate-300"}>{S.dd.toFixed(1)}% / {ddLimit}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${ddPct > 80 ? "bg-loss" : ddPct > 50 ? "bg-amber-400" : "bg-gain"}`} style={{ width: `${ddPct}%` }} />
              </div>
            </div>
            {dailyLimit > 0 && (
              <div>
                <div className="mb-1 flex items-baseline justify-between text-[11px]">
                  <span className="text-slate-400">Daily loss limit</span>
                  <span className={tone(todayPnl)}>{money(todayPnl, cur)} / -{money(dailyLimit, cur)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${dailyLossPct > 80 ? "bg-loss" : dailyLossPct > 50 ? "bg-amber-400" : "bg-iris"}`} style={{ width: `${dailyLossPct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Live Session & Edge Telemetry */}
          <div className="rounded-xl border border-indigo-200/[0.09] bg-white/[0.03] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Live Telemetry</span>
              <Clock size={13} className="text-iris" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active session</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-gain shadow-[0_0_8px_#34d399]" />
                {currentSession}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current streak</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${S.streakType === "WIN" ? "text-gain" : S.streakType === "LOSS" ? "text-loss" : "text-slate-400"}`}>
                {S.streak > 0 && <Flame size={12} />}
                {S.streak > 0 ? `${S.streak}${S.streakType === "WIN" ? "W" : "L"}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-slate-400">Top setup</span>
              <span className="truncate font-medium text-slate-200">
                {bestStrategy ? bestStrategy.key.replace(/ \(.*\)/, "") : "—"}
              </span>
            </div>
          </div>
        </div>

        <button className="btn mt-4 justify-center" onClick={logout}><LogOut size={14} />Log out</button>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <main className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6 xl:p-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
            <ThemeToggle compact />
            <Link href="/strategies" className="chip whitespace-nowrap border-iris/40 bg-iris/10 text-indigo-200">Strategies</Link>
            {[{ id: "all", name: "All accounts" }, ...accounts].map((a) => (
              <button key={a.id} onClick={() => { setSel(a.id); setDay(null); }} className={`chip whitespace-nowrap ${sel === a.id ? "chip-on" : ""}`}>{a.name}</button>
            ))}
            <button className="chip whitespace-nowrap" onClick={() => setAcc({ currency: "USD", maxDrawdownLimitPct: 10, dailyLossLimit: 0 })}>+ Account</button>
            <button className="chip whitespace-nowrap" onClick={logout}>Log out</button>
          </div>

          <header id="overview" className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{sel === "all" ? "All accounts" : scopedAccounts[0]?.name}</h1>
              <p className="text-sm text-slate-400">
                {scopedAccounts.length} account{scopedAccounts.length === 1 ? "" : "s"} · {S.count} closed trades ({longClosed.length}L / {shortClosed.length}S) · {scoped.length - S.count} open
              </p>
            </div>
            {sel !== "all" && <button className="btn" onClick={() => setAcc(accounts.find((a) => a.id === sel)!)}><Pencil size={14} />Edit account</button>}
            <button className="btn-primary" onClick={() => setForm(blank(sel === "all" ? accounts[0].id : sel))}><Plus size={15} />Log trade</button>
          </header>

          {dailyLimit > 0 && todayPnl <= -dailyLimit && (
            <div className="flex items-center gap-2 rounded-xl border border-loss/40 bg-loss/10 p-3 text-sm text-loss backdrop-blur">
              <ShieldAlert size={16} />Daily loss limit reached: {money(todayPnl, cur)} today against a {money(dailyLimit, cur)} limit. Stop trading for the day.
            </div>
          )}

          <section className="panel">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400">Account balance</div>
                <div className="mt-1 text-4xl font-extrabold tracking-tight text-white md:text-5xl">{money(S.balance, cur)}</div>
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${S.net >= 0 ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"}`}>
                  {S.net >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {S.net >= 0 ? "+" : ""}{money(S.net, cur)} · {S.netPct.toFixed(2)}% net P&amp;L
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div><div className="text-xs text-slate-400">Starting</div>{money(start, cur)}</div>
                <div><div className="text-xs text-slate-400">Today</div><span className={tone(todayPnl)}>{money(todayPnl, cur)}</span></div>
                <div><div className="text-xs text-slate-400">Max drawdown</div>{S.maxDD.toFixed(2)}%</div>
              </div>
            </div>
            <div className="mt-5 h-72">
              <ResponsiveContainer>
                <AreaChart data={S.curve} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b8cff" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#8b8cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDark ? "rgba(199,210,254,0.06)" : "rgba(99,102,241,0.12)"} vertical={false} />
                  <XAxis dataKey="i" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} label={{ value: "Trade #", position: "insideBottomRight", offset: -2, fill: "#64748b", fontSize: 11 }} />
                  <YAxis stroke="#64748b" fontSize={11} domain={["auto", "auto"]} width={72} tickLine={false} axisLine={false} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                  <Tooltip
                    cursor={{ stroke: "#8b8cff", strokeOpacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p: any = payload[0].payload;
                      return (
                        <div className="app-modal rounded-xl border border-indigo-200/15 bg-panel/95 p-3 text-xs shadow-xl backdrop-blur">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{p.symbol}</span>
                            {p.i > 0 && dirBadge(p.direction)}
                          </div>
                          <div className="text-slate-400">{p.setup}</div>
                          <div className="mt-1.5">Balance {money(p.bal, cur)}</div>
                          <div className={tone(p.pnl)}>{p.pnl >= 0 ? "+" : ""}{money(p.pnl, cur)} · {p.r.toFixed(2)}R</div>
                          <div className="text-slate-500">{p.label}</div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="bal" stroke={isDark ? "#8b8cff" : "#4f46e5"} strokeWidth={2.5} fill="url(#g)" activeDot={{ r: 5, fill: isDark ? "#8b8cff" : "#4f46e5", stroke: isDark ? "#04060f" : "#ffffff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {kpis.map(({ l, v, sub, I, c }) => (
              <div key={l} className="panel !p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">{l}<I size={14} className="text-iris/80" /></div>
                <div className={`mt-2 text-xl font-bold ${c}`}>{v}</div>
                <div className="mt-1 text-[11px] text-slate-500">{sub}</div>
              </div>
            ))}
            <div className="panel col-span-2 !p-4 lg:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-400">Drawdown<ShieldAlert size={14} className="text-iris/80" /></div>
              <div className={`mt-2 text-xl font-bold ${S.dd >= ddLimit ? "text-loss" : ""}`}>{S.dd.toFixed(2)}%</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${ddPct > 80 ? "bg-loss" : ddPct > 50 ? "bg-amber-400" : "bg-gain"}`} style={{ width: `${ddPct}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Limit {ddLimit}%</div>
            </div>
          </section>

          <div id="insights" className="grid gap-5 lg:grid-cols-2">
            <section className="panel">
              <div className="mb-4 flex items-center gap-2">
                <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                <div className="flex-1 text-center">
                  <div className="text-sm font-semibold text-white">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                  <div className={`text-xs ${tone(monthPnl)}`}>{money(monthPnl, cur)} this month</div>
                </div>
                <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pb-1 text-slate-500">{d}</div>)}
                {Array.from({ length: first }).map((_, i) => <div key={`b${i}`} />)}
                {Array.from({ length: dim }).map((_, i) => {
                  const k = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
                  const v = dayMap.get(k);
                  const bg = v ? `rgba(${v.pnl >= 0 ? "52,211,153" : "251,113,133"},${0.1 + 0.4 * (Math.abs(v.pnl) / monthMax)})` : undefined;
                  return (
                    <button
                      key={k}
                      onClick={() => setDay(day === k ? null : k)}
                      style={{ background: bg }}
                      className={`h-14 rounded-lg border p-1.5 text-left transition hover:border-iris/60 ${day === k ? "border-iris ring-1 ring-iris" : k === todayKey ? "border-indigo-300/40" : "border-indigo-200/[0.08]"}`}
                    >
                      <div className="text-slate-400">{i + 1}</div>
                      {v && (
                        <>
                          <div className={`text-[11px] font-bold ${tone(v.pnl)}`}>{Math.abs(v.pnl) >= 1000 ? `${(v.pnl / 1000).toFixed(1)}k` : v.pnl.toFixed(0)}</div>
                          <div className="text-[10px] text-slate-400">{v.n} trade{v.n > 1 ? "s" : ""}</div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {day && <button className="mt-3 text-xs text-iris" onClick={() => setDay(null)}>Showing trades closed on {day}. Clear filter</button>}
            </section>

            <section className="panel">
              <div className="mb-4 flex flex-wrap gap-1.5">
                {([["asset", "Asset & symbol"], ["direction", "Long / Short & leverage"], ["strategy", "Strategy"], ["session", "Session & day"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? "chip-on" : ""}`}>{l}</button>
                ))}
              </div>
              <div className="max-h-[27rem] space-y-5 overflow-y-auto pr-1">
                {tab === "asset" && <>{bars(group(scoped, (t) => [t.assetClass]), "By asset class")}{bars(group(scoped, (t) => [t.symbol]), "By symbol")}</>}
                {tab === "direction" && <>{bars(group(scoped, (t) => [t.direction || "LONG"]), "Long vs Short")}{bars(group(scoped, (t) => [leverageBucket(t.leverage || 1)]), "By leverage tier")}</>}
                {tab === "strategy" && bars(group(scoped, (t) => (t.tags.length ? t.tags : ["Untagged"])), "By confluence tag")}
                {tab === "session" && <>{bars(group(scoped, (t) => [t.session]), "By session")}{bars(group(scoped, (t) => [new Date(t.exitTime!).toLocaleDateString("en-US", { weekday: "long" })]), "By day of week")}</>}
              </div>
            </section>
          </div>

          <section id="trades" className="panel">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold text-white">Trade log <span className="text-sm font-normal text-slate-500">{shown.length} shown</span></h2>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                <input className="inp !w-36 !pl-8" placeholder="Symbol" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} list="syms" />
              </div>
              <datalist id="syms">{symbols.map((s) => <option key={s} value={s} />)}</datalist>
              <select className="inp !w-auto" value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })}>
                <option value="">All sides</option>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
              <select className="inp !w-auto" value={f.asset} onChange={(e) => setF({ ...f, asset: e.target.value })}>
                <option value="">All assets</option>
                {ASSET_CLASSES.map((a) => <option key={a}>{a}</option>)}
              </select>
              <select className="inp !w-auto" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })}>
                <option value="">All strategies</option>
                {allTags.map((a) => <option key={a}>{a}</option>)}
              </select>
              <select className="inp !w-auto" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })}>
                <option value="">All sessions</option>
                {SESSIONS.map((a) => <option key={a}>{a}</option>)}
              </select>
              <select className="inp !w-auto" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                <option value="">Win, loss or open</option>
                <option value="WIN">Wins</option>
                <option value="LOSS">Losses</option>
                <option value="OPEN">Open</option>
              </select>
              <button className="btn" onClick={exportCsv}><Download size={14} />Export</button>
              <label className="btn cursor-pointer"><Upload size={14} />Import<input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} /></label>
            </div>

            {shown.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Entry</th>
                      <th className="font-medium">Symbol</th>
                      <th className="font-medium">Side / Lev</th>
                      <th className="font-medium">Setup</th>
                      <th className="font-medium">Grade</th>
                      <th className="font-medium">R</th>
                      <th className="text-right font-medium">P&amp;L</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((t) => (
                      <tr key={t.id} className="group cursor-pointer border-t border-indigo-200/[0.07] transition hover:bg-white/[0.04]" onClick={() => setDetail(t)}>
                        <td className="py-3 pr-3">
                          <div>{new Date(t.entryTime).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-500">{t.session}</div>
                        </td>
                        <td className="pr-3">
                          <div className="font-bold text-white">{t.symbol}</div>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${assetStyle[t.assetClass]}`}>{t.assetClass}</span>
                        </td>
                        <td className="pr-3">
                          <div className="flex items-center gap-1.5">
                            {dirBadge(t.direction)}
                            <span className="rounded border border-indigo-200/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-200">{t.leverage || 1}x</span>
                          </div>
                        </td>
                        <td className="max-w-[220px] pr-3">
                          <div className="flex flex-wrap gap-1">
                            {t.tags.slice(0, 2).map((x) => <span key={x} className="truncate rounded-full bg-white/5 px-2 py-0.5 text-[11px]">{x.replace(/ \(.*\)/, "")}</span>)}
                            {t.tags.length > 2 && <span className="text-[11px] text-slate-500">+{t.tags.length - 2}</span>}
                            {!t.tags.length && <span className="text-slate-600">-</span>}
                          </div>
                        </td>
                        <td className="pr-3">{stars(t.grade, 12)}</td>
                        <td className="pr-3">
                          {t.rMultiple == null
                            ? <span className="rounded-full bg-iris/15 px-2 py-0.5 text-[11px] font-semibold text-iris">Open</span>
                            : <span className={`font-semibold ${tone(t.rMultiple)}`}>{t.rMultiple.toFixed(2)}R</span>}
                        </td>
                        <td className={`text-right font-semibold ${tone(t.pnl ?? 0)}`}>
                          {t.pnl == null ? "-" : `${t.pnl > 0 ? "+" : ""}${money(t.pnl, cur)}`}
                        </td>
                        <td className="whitespace-nowrap pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                          {t.status === "OPEN" && <button title="Close trade" className="icon-btn !text-iris" onClick={() => closeTrade(t)}><CheckCircle2 size={16} /></button>}
                          <button title="Edit" className="icon-btn" onClick={() => setForm(toForm(t))}><Pencil size={15} /></button>
                          <button title="Delete" className="icon-btn hover:!text-loss" onClick={() => removeTrade(t)}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid place-items-center gap-3 py-14 text-center">
                <FileX2 size={32} className="text-slate-600" />
                <div>
                  <div className="font-medium">No trades match these filters</div>
                  <div className="text-sm text-slate-500">Log a long or short trade to start building your edge.</div>
                </div>
                <button className="btn-primary" onClick={() => setForm(blank(sel === "all" ? accounts[0].id : sel))}><Plus size={15} />Log trade</button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Trade Detail Drawer */}
      {detail && detailCalc && (
        <>
          <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <aside className="app-drawer fixed inset-y-0 right-0 z-30 w-full max-w-md overflow-y-auto border-l border-indigo-200/15 bg-panel/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">{detail.symbol}</h3>
                  {dirBadge(detail.direction)}
                  <span className="rounded border border-indigo-200/15 bg-white/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-indigo-200">{detail.leverage || 1}x</span>
                </div>
                <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${assetStyle[detail.assetClass]}`}>{detail.assetClass}</span>
              </div>
              <button className="icon-btn" aria-label="Close" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="mb-4 rounded-xl border border-indigo-200/10 bg-white/[0.04] p-4">
              <div className="text-xs text-slate-400">Result</div>
              <div className={`text-2xl font-extrabold ${tone(detail.pnl ?? 0)}`}>{detail.pnl == null ? "Open position" : money(detail.pnl, cur)}</div>
              <div className="text-sm text-slate-400">
                {detail.rMultiple == null
                  ? `Risking ${money(detail.risk, cur)}`
                  : `${detail.rMultiple.toFixed(2)}R on ${money(detail.risk, cur)} risk${detailCalc.roePct != null ? ` · ${detailCalc.roePct >= 0 ? "+" : ""}${detailCalc.roePct.toFixed(1)}% ROE` : ""}`}
              </div>
            </div>
            {detail.screenshotUrl
              ? <img src={detail.screenshotUrl} alt="Chart screenshot" className="mb-4 w-full rounded-xl border border-indigo-200/15" />
              : <div className="mb-4 rounded-xl border border-dashed border-indigo-200/15 p-4 text-center text-xs text-slate-500">No chart screenshot attached</div>}
            <dl className="grid grid-cols-3 gap-3 text-sm">
              {[
                ["Entry", detail.entryPrice],
                ["Stop", detail.stopLoss],
                ["Exit", detail.exitPrice ?? "Open"],
                [sizeLabel(detail.assetClass), detail.size],
                ["Leverage", `${detail.leverage || 1}x`],
                ["Fees", money(detail.fees, cur)],
                ["Position", money(detailCalc.positionValue, cur)],
                ["Margin", money(detailCalc.marginUsed, cur)],
                ["Timeframe", detail.timeframe],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-100">{String(v)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 text-sm"><div className="text-xs text-slate-500">Session</div>{detail.session}</div>
            <div className="mt-4"><div className="mb-1 text-xs text-slate-500">Execution grade</div>{stars(detail.grade, 18)}</div>
            <div className="mt-4">
              <div className="mb-1.5 text-xs text-slate-500">Confluences</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((x) => <span key={x} className="chip chip-on cursor-default">{x}</span>)}
                {!detail.tags.length && <span className="text-sm text-slate-500">None</span>}
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 text-xs text-slate-500">Rule checklist</div>
              {RULES.map((r) => (
                <div key={r} className={`flex items-center gap-2 text-sm ${detail.rules.includes(r) ? "" : "text-slate-600 line-through"}`}>
                  <CheckCircle2 size={14} className={detail.rules.includes(r) ? "text-gain" : ""} />{r}
                </div>
              ))}
            </div>
            {detail.mistakes.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-xs text-slate-500">Mistakes</div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.mistakes.map((x) => <span key={x} className="rounded-full bg-loss/15 px-2.5 py-1 text-xs text-loss">{x}</span>)}
                </div>
              </div>
            )}
            {detail.notes && (
              <div className="mt-4">
                <div className="mb-1 text-xs text-slate-500">Notes</div>
                <p className="whitespace-pre-wrap text-sm text-slate-300">{detail.notes}</p>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button className="btn-primary" onClick={() => { setForm(toForm(detail)); setDetail(null); }}><Pencil size={14} />Edit trade</button>
              {detail.status === "OPEN" && <button className="btn" onClick={() => { closeTrade(detail); setDetail(null); }}>Close trade</button>}
            </div>
          </aside>
        </>
      )}

      {/* Account Modal */}
      {acc && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel app-modal w-full max-w-md space-y-4 !bg-panel/95">
            <h3 className="text-lg font-bold text-white">{acc.id ? "Edit account" : "New account"}</h3>
            {field("Account name", <input className="inp" value={acc.name || ""} onChange={(e) => setAcc({ ...acc, name: e.target.value })} placeholder="US Equities" autoFocus />)}
            <div className="grid grid-cols-2 gap-3">
              {field("Starting balance", <input className="inp" type="number" value={acc.startingBalance ?? ""} onChange={(e) => setAcc({ ...acc, startingBalance: +e.target.value })} />)}
              {field("Currency", <input className="inp" value={acc.currency || ""} onChange={(e) => setAcc({ ...acc, currency: e.target.value })} />)}
              {field("Max drawdown limit (%)", <input className="inp" type="number" value={acc.maxDrawdownLimitPct ?? ""} onChange={(e) => setAcc({ ...acc, maxDrawdownLimitPct: +e.target.value })} />)}
              {field("Daily loss limit", <input className="inp" type="number" value={acc.dailyLossLimit ?? ""} onChange={(e) => setAcc({ ...acc, dailyLossLimit: +e.target.value })} />)}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveAccount}>Save account</button>
              <button className="btn" onClick={() => setAcc(null)}>Cancel</button>
              {acc.id && <button className="btn ml-auto !text-loss" onClick={() => removeAccount(acc.id!)}>Delete</button>}
            </div>
          </div>
        </div>
      )}

      {/* Log / Edit Trade Modal */}
      {form && preview && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:p-6">
          <div className="panel app-modal mx-auto w-full max-w-5xl !bg-panel/95">
            <div className="mb-5 flex items-center">
              <h3 className="flex-1 text-xl font-extrabold text-white">{form.id ? "Edit trade" : "Log trade"}</h3>
              <button className="icon-btn" aria-label="Close" onClick={() => setForm(null)}><X size={18} /></button>
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_285px]">
              <div className="space-y-6">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-white">Setup</legend>
                  {/* Long / Short Toggle */}
                  <div className="mb-3">
                    <label className="lbl">Direction</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => patch({ direction: "LONG" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition ${form.direction === "LONG" ? "border-gain/60 bg-gain/15 text-gain shadow-[0_0_20px_-8px_rgba(52,211,153,0.7)]" : "border-indigo-200/15 bg-white/[0.03] text-slate-400 hover:border-gain/35 hover:text-slate-200"}`}
                      >
                        <TrendingUp size={16} />LONG (Buy)
                      </button>
                      <button
                        type="button"
                        onClick={() => patch({ direction: "SHORT" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition ${form.direction === "SHORT" ? "border-loss/60 bg-loss/15 text-loss shadow-[0_0_20px_-8px_rgba(251,113,133,0.7)]" : "border-indigo-200/15 bg-white/[0.03] text-slate-400 hover:border-loss/35 hover:text-slate-200"}`}
                      >
                        <TrendingDown size={16} />SHORT (Sell)
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {field("Account", <select className="inp" value={form.accountId} onChange={(e) => patch({ accountId: e.target.value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>)}
                    {field("Asset class", (
                      <select
                        className="inp"
                        value={form.assetClass}
                        onChange={(e) => patch({ assetClass: e.target.value, leverage: String(defaultLeverage(e.target.value)) })}
                      >
                        {ASSET_CLASSES.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    ))}
                    {field("Symbol", <input className="inp" value={form.symbol} onChange={(e) => patch({ symbol: e.target.value.toUpperCase() })} placeholder="NVDA, NQ, BTCUSD" />)}
                    {field(sizeLabel(form.assetClass), <input className="inp" type="number" step="any" value={form.size} onChange={(e) => patch({ size: e.target.value })} />)}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-white">Execution</legend>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {field("Entry price", <input className="inp" type="number" step="any" value={form.entryPrice} onChange={(e) => patch({ entryPrice: e.target.value })} />)}
                    {field(
                      form.direction === "SHORT" ? "Stop loss (above entry)" : "Stop loss (below entry)",
                      <input className="inp" type="number" step="any" value={form.stopLoss} onChange={(e) => patch({ stopLoss: e.target.value })} />
                    )}
                    {field(
                      "Exit price (blank = open)",
                      <input className="inp" type="number" step="any" value={form.exitPrice} onChange={(e) => patch({ exitPrice: e.target.value, exitTime: form.exitTime || localInput(new Date()) })} />
                    )}
                    {field("Leverage (x)", <input className="inp" type="number" min="1" step="any" value={form.leverage} onChange={(e) => patch({ leverage: e.target.value })} />)}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] text-slate-500">Quick leverage:</span>
                    {LEVERAGE_PRESETS.map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => patch({ leverage: String(lv) })}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${num(form.leverage) === lv ? "border-iris bg-iris/20 text-indigo-200" : "border-indigo-200/15 bg-white/[0.03] text-slate-400 hover:border-iris/50 hover:text-slate-200"}`}
                      >
                        {lv}x
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {field("Fees", <input className="inp" type="number" step="any" value={form.fees} onChange={(e) => patch({ fees: e.target.value })} />)}
                    {field("Entry time", <input className="inp" type="datetime-local" value={form.entryTime} onChange={(e) => patch({ entryTime: e.target.value, session: sessionFor(new Date(e.target.value).toISOString()) })} />)}
                    {field("Exit time", <input className="inp" type="datetime-local" value={form.exitTime} onChange={(e) => patch({ exitTime: e.target.value })} />)}
                    {field("Timeframe", <select className="inp" value={form.timeframe} onChange={(e) => patch({ timeframe: e.target.value })}>{TIMEFRAMES.map((a) => <option key={a}>{a}</option>)}</select>)}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-white">Playbook</legend>
                  <div className="mb-3 grid gap-3 md:grid-cols-2">
                    {field("Session (set from entry time, editable)", <select className="inp" value={form.session} onChange={(e) => patch({ session: e.target.value })}>{SESSIONS.map((a) => <option key={a}>{a}</option>)}</select>)}
                    {field("Execution grade", (
                      <div className="flex gap-1 pt-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" aria-label={`${n} stars`} onClick={() => patch({ grade: n })}>
                            <Star size={22} className={n <= form.grade ? "fill-iris text-iris" : "text-white/15"} />
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  {field("Confluences", (
                    <div className="flex flex-wrap gap-1.5">
                      {allTags.concat(form.tags.filter((t) => !allTags.includes(t))).map((t) => (
                        <button key={t} type="button" className={`chip ${form.tags.includes(t) ? "chip-on" : ""}`} onClick={() => patch({ tags: toggle(form.tags, t) })}>{t}</button>
                      ))}
                      <input
                        className="inp !w-44 !rounded-full !py-1 text-xs"
                        placeholder="+ Custom tag, press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = e.currentTarget.value.trim();
                            if (v && !form.tags.includes(v)) patch({ tags: [...form.tags, v] });
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  ))}
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-white">Review</legend>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {RULES.map((r) => (
                      <label key={r} className={`chip flex items-center gap-1.5 ${form.rules.includes(r) ? "chip-on" : ""}`}>
                        <input type="checkbox" className="hidden" checked={form.rules.includes(r)} onChange={() => patch({ rules: toggle(form.rules, r) })} />
                        <CheckCircle2 size={13} />{r}
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {field("Mistake tags (comma separated)", <input className="inp" value={form.mistakes} onChange={(e) => patch({ mistakes: e.target.value })} placeholder="Moved stop, Chased entry" />)}
                    {field("Chart screenshot URL", <input className="inp" value={form.screenshotUrl} onChange={(e) => patch({ screenshotUrl: e.target.value })} placeholder="https://…" />)}
                  </div>
                  <div className="mt-3">
                    {field("Notes", <textarea className="inp" rows={3} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="What was the plan, and did you follow it?" />)}
                  </div>
                </fieldset>
              </div>

              <div className="md:sticky md:top-4 md:self-start">
                <div className="rounded-xl border border-iris/30 bg-iris/[0.08] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Live preview</span>
                    {dirBadge(form.direction)}
                  </div>
                  {[
                    ["Position value", money(preview.positionValue), ""],
                    [`Margin (${preview.leverage}x)`, money(preview.marginUsed), "text-indigo-200"],
                    ["Initial risk (1R)", `${money(preview.risk)} · ${preview.riskPct.toFixed(2)}%`, ""],
                    [form.exitPrice === "" ? "P&L (open)" : "Realized P&L", preview.pnl == null ? "-" : `${money(preview.pnl)} · ${preview.pnlPct?.toFixed(2)}%`, tone(preview.pnl ?? 0)],
                    ["ROE (on margin)", preview.roePct == null ? "-" : `${preview.roePct >= 0 ? "+" : ""}${preview.roePct.toFixed(2)}%`, tone(preview.roePct ?? 0)],
                    ["R-multiple", preview.r == null ? "-" : `${preview.r.toFixed(2)}R`, tone(preview.r ?? 0)],
                    ["Account balance", money(balanceOf(form.accountId)), ""],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex items-baseline justify-between gap-2 border-t border-indigo-200/[0.08] py-2 text-sm first:border-0">
                      <span className="text-slate-400">{k}</span>
                      <span className={`text-right font-semibold ${c}`}>{v}</span>
                    </div>
                  ))}
                  {stopInvalid && (
                    <p className="mt-2 rounded-lg bg-loss/10 p-2 text-xs text-loss">
                      {form.direction === "SHORT"
                        ? "Stop loss must be above entry for a short."
                        : "Stop loss must be below entry for a long."}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 justify-center py-2.5" onClick={saveTrade}>Save trade</button>
                  <button className="btn" onClick={() => setForm(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
