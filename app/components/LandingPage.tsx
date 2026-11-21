"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, BookOpen, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Compass, FileText, Gauge, Layers, Plus, ShieldAlert, SlidersHorizontal, Sparkles,
  Target, TrendingDown, TrendingUp, Upload, ZoomIn, ZoomOut,
} from "lucide-react";
import { Direction, LEVERAGE_PRESETS, compute } from "@/lib/calc";
import { useTheme } from "./ThemeProvider";
import ThemeToggle from "./ThemeToggle";
import PhoenixLogo from "./PhoenixLogo";
import LandingMouseGlow from "./LandingMouseGlow";

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const CHAPTERS = [
  { id: "hero", label: "Overview" },
  { id: "simulator", label: "Long / Short & Leverage" },
  { id: "analytics", label: "Edge & Analytics" },
  { id: "vault", label: "Strategy Vault" },
  { id: "cta", label: "Get Started" },
] as const;

const DARK_BACKDROPS = [
  "radial-gradient(1000px 620px at 18% 12%, rgba(99, 102, 241, 0.28), transparent 62%), radial-gradient(800px 540px at 86% 24%, rgba(167, 139, 250, 0.18), transparent 60%)",
  "radial-gradient(960px 600px at 14% 40%, rgba(16, 185, 129, 0.22), transparent 60%), radial-gradient(960px 600px at 88% 55%, rgba(244, 63, 94, 0.20), transparent 60%)",
  "radial-gradient(1000px 620px at 20% 45%, rgba(56, 189, 248, 0.24), transparent 62%), radial-gradient(880px 560px at 84% 30%, rgba(99, 102, 241, 0.24), transparent 60%)",
  "radial-gradient(1000px 620px at 22% 40%, rgba(168, 85, 247, 0.26), transparent 62%), radial-gradient(860px 560px at 84% 62%, rgba(236, 72, 153, 0.18), transparent 60%)",
  "radial-gradient(960px 600px at 50% 60%, rgba(99, 102, 241, 0.26), transparent 64%), radial-gradient(760px 500px at 24% 80%, rgba(16, 185, 129, 0.18), transparent 60%)",
];

const LIGHT_BACKDROPS = [
  "radial-gradient(1000px 620px at 18% 12%, rgba(99, 102, 241, 0.18), transparent 62%), radial-gradient(800px 540px at 86% 24%, rgba(167, 139, 250, 0.16), transparent 60%)",
  "radial-gradient(960px 600px at 14% 40%, rgba(16, 185, 129, 0.16), transparent 60%), radial-gradient(960px 600px at 88% 55%, rgba(244, 63, 94, 0.14), transparent 60%)",
  "radial-gradient(1000px 620px at 20% 45%, rgba(14, 165, 233, 0.17), transparent 62%), radial-gradient(880px 560px at 84% 30%, rgba(99, 102, 241, 0.16), transparent 60%)",
  "radial-gradient(1000px 620px at 22% 40%, rgba(168, 85, 247, 0.17), transparent 62%), radial-gradient(860px 560px at 84% 62%, rgba(236, 72, 153, 0.13), transparent 60%)",
  "radial-gradient(960px 600px at 50% 60%, rgba(99, 102, 241, 0.18), transparent 64%), radial-gradient(760px 500px at 24% 80%, rgba(16, 185, 129, 0.14), transparent 60%)",
];

const SIM_PRESETS = [
  { label: "BTCUSD", assetClass: "Crypto", entry: 95000, stopLong: 93800, exitLong: 98600, stopShort: 96200, exitShort: 91400, size: 0.4, leverage: 10, fees: 12 },
  { label: "NVDA", assetClass: "US Stock", entry: 140, stopLong: 136.5, exitLong: 149.8, stopShort: 143.5, exitShort: 130.2, size: 200, leverage: 4, fees: 2 },
  { label: "NQ", assetClass: "Index / Futures", entry: 21200, stopLong: 21140, exitLong: 21350, stopShort: 21260, exitShort: 21050, size: 2, leverage: 20, fees: 4.8 },
  { label: "EURUSD", assetClass: "Forex", entry: 1.084, stopLong: 1.081, exitLong: 1.092, stopShort: 1.087, exitShort: 1.076, size: 1, leverage: 50, fees: 7 },
  { label: "XAUUSD", assetClass: "Commodity", entry: 2680, stopLong: 2668, exitLong: 2714, stopShort: 2692, exitShort: 2646, size: 0.5, leverage: 20, fees: 4 },
];

const DEMO_CALENDAR: Record<number, { pnl: number; trades: { symbol: string; dir: Direction; r: number; pnl: number; setup: string }[] }> = {
  3: { pnl: 1480, trades: [{ symbol: "NQ", dir: "LONG", r: 2.1, pnl: 1480, setup: "NY Open ORB" }] },
  5: { pnl: -520, trades: [{ symbol: "NVDA", dir: "SHORT", r: -1.0, pnl: -520, setup: "VWAP Reject" }] },
  8: { pnl: 2340, trades: [{ symbol: "BTCUSD", dir: "SHORT", r: 2.8, pnl: 1620, setup: "HTF FVG Short" }, { symbol: "EURUSD", dir: "LONG", r: 1.4, pnl: 720, setup: "London Sweep" }] },
  11: { pnl: 910, trades: [{ symbol: "XAUUSD", dir: "LONG", r: 1.85, pnl: 910, setup: "Order Block" }] },
  14: { pnl: -380, trades: [{ symbol: "ES", dir: "LONG", r: -0.75, pnl: -380, setup: "Break & Retest" }] },
  17: { pnl: 3120, trades: [{ symbol: "NQ", dir: "SHORT", r: 3.1, pnl: 2240, setup: "Liquidity Sweep" }, { symbol: "AAPL", dir: "LONG", r: 1.7, pnl: 880, setup: "9/21 EMA" }] },
  20: { pnl: 1190, trades: [{ symbol: "BTCUSD", dir: "LONG", r: 2.2, pnl: 1190, setup: "HTF FVG" }] },
  24: { pnl: 1860, trades: [{ symbol: "EURUSD", dir: "SHORT", r: 2.6, pnl: 1860, setup: "Session Crossover" }] },
};

const DEMO_STRATEGIES = [
  {
    id: "orb",
    name: "NY Open ORB Sweep",
    bias: "BOTH" as const,
    accent: "bg-indigo-500",
    pdfName: "NY_Open_ORB_Playbook_v3.pdf",
    fields: [
      { label: "Entry Trigger", value: "1m MSS after 15m range sweep" },
      { label: "Target R:R", value: "1:2.5 minimum to opposing liquidity" },
      { label: "Best Session", value: "NY Open / ORB (13:30–15:30 UTC)" },
      { label: "Max Risk", value: "0.75% per setup · Max 2 attempts" },
    ],
    pages: [
      { title: "1. Market Context & Opening Range", bullets: ["Mark 09:30–09:45 EST high and low on 5m chart.", "Confirm HTF 1H/4H directional bias before open.", "Identify resting buy-side & sell-side liquidity pools."] },
      { title: "2. Liquidity Sweep & Entry Model", bullets: ["Wait for clean raid of ORB high (short) or low (long).", "Require displacement candle leaving a 1m Fair Value Gap.", "Enter on FVG retest with stop 2 ticks beyond sweep wick."] },
      { title: "3. Trade Management & Scaling", bullets: ["Move stop to breakeven at +1.2R.", "Take 50% partial at opposing ORB boundary.", "Trail runner behind 5m structure swings."] },
    ],
  },
  {
    id: "fvg",
    name: "HTF FVG Short Reversal",
    bias: "SHORT" as const,
    accent: "bg-rose-500",
    pdfName: "HTF_Bearish_FVG_Short_Guide.pdf",
    fields: [
      { label: "Entry Trigger", value: "4H FVG mitigation + 5m bearish engulfing" },
      { label: "Invalidation", value: "Candle body close above 4H FVG 100% level" },
      { label: "Leverage Cap", value: "10x max on Crypto / 20x Futures" },
    ],
    pages: [
      { title: "1. HTF Supply & Premium Zone", bullets: ["Price must trade above 50% Fibonacci (Premium).", "Prior swing high swept with declining delta/volume.", "Align with London–NY crossover volatility window."] },
      { title: "2. Short Execution Rules", bullets: ["Place stop loss strictly above entry swing high.", "Calculate position size from fixed 1R dollar risk.", "Avoid shorting directly into HTF daily demand."] },
      { title: "3. Post-Trade Review Checklist", bullets: ["Grade execution 1–5 stars inside Phoenix Flow.", "Attach screenshot URL and log any mistake tags.", "Review R-multiple vs target expectancy weekly."] },
    ],
  },
  {
    id: "london",
    name: "London Liquidity Breakout",
    bias: "LONG" as const,
    accent: "bg-emerald-500",
    pdfName: "London_FX_Breakout_SOP.pdf",
    fields: [
      { label: "Pairs", value: "EURUSD, XAUUSD, USDJPY" },
      { label: "Entry Trigger", value: "Asian range low sweep + VWAP reclaim" },
      { label: "Target R:R", value: "1:3 to previous day high" },
    ],
    pages: [
      { title: "1. Asian Range Framing", bullets: ["Mark 00:00–06:00 UTC tight consolidation box.", "Skip days where Asian range exceeds 60% of ADR.", "Focus on clean institutional expansion days."] },
      { title: "2. Confirmation & Risk", bullets: ["Wait for London open fakeout below Asian low.", "Enter long on strong reclaim above VWAP.", "Use 50x FX leverage strictly for margin efficiency, not oversizing."] },
      { title: "3. Session Exit Discipline", bullets: ["Flatten remaining size before major US CPI/FOMC prints.", "Log session performance to validate edge over 30+ trades.", "Respect daily loss guardrail without exception."] },
    ],
  },
];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.14 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage({ signedIn }: { signedIn: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Scroll-driven background transition + progress bar
  const [activeChapter, setActiveChapter] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollPct(Math.min(100, Math.max(0, (window.scrollY / max) * 100)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const sections = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = CHAPTERS.findIndex((c) => c.id === e.target.id);
            if (idx !== -1) setActiveChapter(idx);
          }
        });
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: 0.05 }
    );
    sections.forEach((s) => obs.observe(s));

    return () => {
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, []);

  // Hero interactive preview tab
  const [heroTab, setHeroTab] = useState<"equity" | "split" | "guardrails">("equity");

  // Interactive Simulator state
  const [presetIdx, setPresetIdx] = useState(0);
  const [simDir, setSimDir] = useState<Direction>("SHORT");
  const [simEntry, setSimEntry] = useState("95000");
  const [simStop, setSimStop] = useState("96200");
  const [simExit, setSimExit] = useState("91400");
  const [simSize, setSimSize] = useState("0.4");
  const [simLev, setSimLev] = useState(10);

  const applyPreset = (idx: number, dir: Direction) => {
    const p = SIM_PRESETS[idx];
    setPresetIdx(idx);
    setSimDir(dir);
    setSimEntry(String(p.entry));
    setSimStop(String(dir === "SHORT" ? p.stopShort : p.stopLong));
    setSimExit(String(dir === "SHORT" ? p.exitShort : p.exitLong));
    setSimSize(String(p.size));
    setSimLev(p.leverage);
  };

  const simPreset = SIM_PRESETS[presetIdx];
  const simResult = useMemo(
    () =>
      compute(
        {
          direction: simDir,
          assetClass: simPreset.assetClass,
          symbol: simPreset.label,
          entryPrice: parseFloat(simEntry) || 0,
          stopLoss: parseFloat(simStop) || 0,
          exitPrice: simExit === "" ? null : parseFloat(simExit) || 0,
          size: parseFloat(simSize) || 0,
          leverage: simLev,
          fees: simPreset.fees,
        },
        25000
      ),
    [simDir, simPreset, simEntry, simStop, simExit, simSize, simLev]
  );

  const simStopInvalid =
    simDir === "LONG"
      ? (parseFloat(simStop) || 0) >= (parseFloat(simEntry) || 0)
      : (parseFloat(simStop) || 0) <= (parseFloat(simEntry) || 0);

  // Interactive Analytics tab state
  const [analyticsTab, setAnalyticsTab] = useState<"calendar" | "edge" | "risk">("calendar");
  const [selectedDay, setSelectedDay] = useState<number>(17);
  const [edgeSide, setEdgeSide] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [simDrawdown, setSimDrawdown] = useState(3.4);

  const edgeRows = useMemo(() => {
    const all = [
      { label: "NY Open / ORB", side: "BOTH", trades: 24, win: 67, avgR: 1.42, pnl: 6840 },
      { label: "London–NY Crossover", side: "SHORT", trades: 14, win: 71, avgR: 1.65, pnl: 4120 },
      { label: "London Open", side: "LONG", trades: 16, win: 63, avgR: 1.18, pnl: 2950 },
      { label: "NY Afternoon", side: "SHORT", trades: 9, win: 44, avgR: -0.25, pnl: -640 },
    ];
    if (edgeSide === "ALL") return all;
    return all.map((row) => {
      const mult = edgeSide === "LONG" ? (row.side === "SHORT" ? 0.55 : 1.05) : (row.side === "LONG" ? 0.6 : 1.15);
      return {
        ...row,
        trades: Math.max(3, Math.round(row.trades * 0.52)),
        win: Math.min(82, Math.max(38, Math.round(row.win * (edgeSide === "SHORT" ? 1.04 : 0.97)))),
        avgR: +(row.avgR * mult).toFixed(2),
        pnl: Math.round(row.pnl * mult * 0.65),
      };
    });
  }, [edgeSide]);

  // Interactive Strategy Vault demo state
  const [vaultIdx, setVaultIdx] = useState(0);
  const [vaultPage, setVaultPage] = useState(0);
  const [vaultZoom, setVaultZoom] = useState(100);
  const [customDemoFields, setCustomDemoFields] = useState<Record<string, { label: string; value: string }[]>>({
    orb: DEMO_STRATEGIES[0].fields,
    fvg: DEMO_STRATEGIES[1].fields,
    london: DEMO_STRATEGIES[2].fields,
  });
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldVal, setNewFieldVal] = useState("");

  const activeDemoStrat = DEMO_STRATEGIES[vaultIdx];
  const activeDemoFields = customDemoFields[activeDemoStrat.id] || [];

  const addDemoField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldVal.trim()) return;
    setCustomDemoFields((prev) => ({
      ...prev,
      [activeDemoStrat.id]: [...(prev[activeDemoStrat.id] || []), { label: newFieldName.trim(), value: newFieldVal.trim() }],
    }));
    setNewFieldName("");
    setNewFieldVal("");
  };

  const backdrops = isDark ? DARK_BACKDROPS : LIGHT_BACKDROPS;
  const primaryHref = signedIn ? "/dashboard" : "/login";

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100">
      {/* Scroll-Transitioning Ambient Background Layers */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        {backdrops.map((bg, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000 ease-out"
            style={{ background: bg, opacity: activeChapter === i ? 1 : 0 }}
          />
        ))}
      </div>

      {/* Landing-Page-Only Interactive Mouse Hover Cosmic Highlight */}
      <LandingMouseGlow />

      {/* Sticky Glass Navbar */}
      <header className="sticky top-0 z-30 border-b border-indigo-500/10 bg-white/75 backdrop-blur-xl transition-colors duration-300 dark:border-indigo-200/[0.09] dark:bg-[#050816]/75">
        <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-4 px-6 py-4 md:px-10 xl:px-14">
          <Link href="/" className="flex items-center gap-3">
            <PhoenixLogo size={42} />
            <div>
              <div className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-xl">Phoenix Flow</div>
              <div className="text-xs font-medium text-indigo-600 dark:text-indigo-300/80">Long &amp; Short Cockpit</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-base font-semibold text-slate-600 dark:text-slate-200 md:flex">
            <a href="#simulator" className="transition hover:text-indigo-600 dark:hover:text-white">Calculator</a>
            <a href="#analytics" className="transition hover:text-indigo-600 dark:hover:text-white">Analytics</a>
            <a href="#vault" className="transition hover:text-indigo-600 dark:hover:text-white">Strategy Vault</a>
            {signedIn && (
              <Link href="/strategies" className="transition hover:text-indigo-600 dark:hover:text-white">My Strategies</Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="!px-3.5 !py-2 !text-sm" />
            {!signedIn && (
              <Link href="/login" className="btn hidden !px-4 !py-2 text-sm font-medium sm:inline-flex">
                Log in
              </Link>
            )}
            <Link href={primaryHref} className="btn-primary !px-4 !py-2 text-sm">
              {signedIn ? "Open Dashboard" : "Start Free"}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        {/* Scroll progress hairline */}
        <div className="h-[2px] w-full bg-indigo-500/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-[width] duration-150"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
      </header>

      {/* Right-Side Floating Chapter Progress Indicator */}
      <aside aria-label="Page sections" className="fixed right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
        {CHAPTERS.map((ch, idx) => (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className="group flex items-center justify-end gap-2.5"
            title={ch.label}
          >
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                activeChapter === idx
                  ? "bg-indigo-500/15 text-indigo-700 opacity-100 dark:bg-indigo-400/20 dark:text-indigo-200"
                  : "text-slate-500 opacity-0 group-hover:opacity-100 dark:text-slate-400"
              }`}
            >
              {ch.label}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border transition-all ${
                activeChapter === idx
                  ? "scale-125 border-indigo-500 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.75)] dark:border-indigo-300 dark:bg-indigo-400"
                  : "border-slate-400/50 bg-transparent hover:border-indigo-400"
              }`}
            />
          </a>
        ))}
      </aside>

      {/* =====================================================================
          CHAPTER 1: HERO SECTION
         ===================================================================== */}
      <section id="hero" className="mx-auto max-w-[1580px] px-6 pb-20 pt-14 md:px-10 md:pb-24 md:pt-20 xl:px-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr] xl:gap-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-700 backdrop-blur dark:border-indigo-300/25 dark:bg-indigo-400/15 dark:text-indigo-200">
              <Sparkles size={13} />
              Long &amp; Short · Leverage Analytics · Live PDF Playbooks
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl xl:text-[4rem]">
              Master both sides of the market in{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-violet-500 bg-clip-text text-transparent dark:from-amber-300 dark:via-rose-400 dark:to-indigo-300">
                Phoenix Flow.
              </span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              Log every long and short trade across Stocks, Futures, Commodities, Forex, and Crypto. Track real leverage, margin ROE, R-multiples, risk guardrails, and keep your strategy PDFs open in live view.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href={primaryHref} className="btn-primary px-6 py-3 text-sm">
                {signedIn ? "Go to Dashboard" : "Launch Your Journal"}
                <ArrowRight size={16} />
              </Link>
              <a href="#simulator" className="btn px-6 py-3 text-sm">
                <Gauge size={16} className="text-indigo-500 dark:text-indigo-300" />
                Try Live Simulator
              </a>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-5 border-t border-indigo-500/15 pt-6 text-xs dark:border-indigo-200/10">
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">5 Assets</div>
                <div className="text-slate-500 dark:text-slate-400">Stocks, FX, Crypto, Futures, Gold</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">1x – 100x</div>
                <div className="text-slate-500 dark:text-slate-400">Margin &amp; ROE% auto-computed</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">Live PDFs</div>
                <div className="text-slate-500 dark:text-slate-400">Custom fields + strategy vault</div>
              </div>
            </div>
          </div>

          {/* Interactive Hero Cockpit Card */}
          <div className="panel relative overflow-hidden !p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Live Cockpit Preview</span>
              </div>
              <div className="flex gap-1">
                {([["equity", "Equity"], ["split", "Long/Short"], ["guardrails", "Guardrails"]] as const).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setHeroTab(k)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      heroTab === k
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "bg-indigo-500/10 text-slate-600 hover:bg-indigo-500/20 dark:bg-white/[0.06] dark:text-slate-300"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {heroTab === "equity" && (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Portfolio Balance</div>
                    <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">$218,640.00</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={13} />+$18,640 · +9.32%
                  </span>
                </div>

                {/* Sleek Interactive SVG Equity Curve */}
                <div className="rounded-xl border border-indigo-500/15 bg-indigo-50/60 p-3 dark:border-indigo-200/10 dark:bg-[#050916]/70">
                  <svg viewBox="0 0 420 155" className="h-36 w-full overflow-visible">
                    <defs>
                      <linearGradient id="heroCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[30, 75, 120].map((y) => (
                      <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="currentColor" className="text-indigo-500/15" strokeDasharray="4 4" />
                    ))}
                    <path
                      d="M 0 132 C 45 128, 62 110, 95 114 C 130 118, 152 84, 190 88 C 228 92, 248 58, 286 64 C 325 70, 352 32, 420 18 L 420 150 L 0 150 Z"
                      fill="url(#heroCurveGrad)"
                    />
                    <path
                      d="M 0 132 C 45 128, 62 110, 95 114 C 130 118, 152 84, 190 88 C 228 92, 248 58, 286 64 C 325 70, 352 32, 420 18"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="420" cy="18" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-indigo-500/15 bg-white/70 p-2.5 dark:border-indigo-200/10 dark:bg-white/[0.04]">
                    <div className="text-slate-500 dark:text-slate-400">Win Rate</div>
                    <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">68.4%</div>
                  </div>
                  <div className="rounded-xl border border-indigo-500/15 bg-white/70 p-2.5 dark:border-indigo-200/10 dark:bg-white/[0.04]">
                    <div className="text-slate-500 dark:text-slate-400">Avg R</div>
                    <div className="mt-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400">+1.48R</div>
                  </div>
                  <div className="rounded-xl border border-indigo-500/15 bg-white/70 p-2.5 dark:border-indigo-200/10 dark:bg-white/[0.04]">
                    <div className="text-slate-500 dark:text-slate-400">Profit Factor</div>
                    <div className="mt-1 text-base font-extrabold text-indigo-600 dark:text-indigo-300">2.64</div>
                  </div>
                </div>
              </div>
            )}

            {heroTab === "split" && (
              <div className="space-y-4 py-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Directional Edge Distribution</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">58 Closed Trades</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="bg-emerald-500" style={{ width: "57%" }} />
                  <div className="bg-rose-500" style={{ width: "43%" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={14} />LONG (33 trades)
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">+$10,920</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">66.7% win · +1.35R avg</div>
                  </div>
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <TrendingDown size={14} />SHORT (25 trades)
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">+$7,720</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">72.0% win · +1.64R avg</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instantly spot whether your true edge comes from longs, shorts, or specific leverage tiers.
                </p>
              </div>
            )}

            {heroTab === "guardrails" && (
              <div className="space-y-4 py-1">
                <div className="rounded-xl border border-indigo-500/15 bg-white/70 p-4 dark:border-indigo-200/10 dark:bg-white/[0.04]">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Max Drawdown Buffer</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">2.1% / 8.0%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: "26%" }} />
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-500/15 bg-white/70 p-4 dark:border-indigo-200/10 dark:bg-white/[0.04]">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Daily Loss Guardrail</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-300">+$1,420 today / -$2,000 limit</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: "12%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-2"><CheckCircle2 size={15} />All prop-firm &amp; personal guardrails clear</span>
                  <span className="font-bold">NY Open</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wide translucent feature strip — fills horizontal breadth while letting the starfield shine through */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TrendingUp, title: "Long & Short Native", desc: "Automatic stop validation, directional win rates & side-by-side P&L.", tone: "text-emerald-500" },
            { icon: Gauge, title: "Real Leverage & ROE", desc: "Instant margin required & return-on-margin across 1x–100x setups.", tone: "text-amber-500" },
            { icon: ShieldAlert, title: "Live Risk Guardrails", desc: "Daily loss & max drawdown trackers built for personal & prop accounts.", tone: "text-rose-500" },
            { icon: BookOpen, title: "PDF Strategy Vault", desc: "Upload strategy PDFs with custom named fields & view live anytime.", tone: "text-indigo-500 dark:text-indigo-300" },
          ].map(({ icon: Icon, title, desc, tone }) => (
            <div
              key={title}
              className="rounded-2xl border border-indigo-500/15 bg-white/55 p-4 backdrop-blur-sm transition hover:border-indigo-400/40 dark:border-indigo-200/[0.08] dark:bg-[#0a1024]/45"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Icon size={16} className={tone} />
                {title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          CHAPTER 2: INTERACTIVE LONG / SHORT & LEVERAGE SIMULATOR
         ===================================================================== */}
      <section id="simulator" className="mx-auto max-w-[1580px] px-6 py-20 md:px-10 md:py-28 xl:px-14">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Gauge size={14} />Interactive Trade Engine
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Simulate Longs, Shorts &amp; Leverage live.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Powered by the exact calculation engine inside the journal. Pick an asset, flip between Long and Short, dial in your leverage, and watch Margin, 1R Risk, ROE%, and R-Multiple respond instantly.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="panel grid gap-6 !p-6 lg:grid-cols-[1.15fr_0.85fr] md:!p-8">
            <div className="space-y-5">
              {/* Asset Presets */}
              <div>
                <div className="lbl">Choose Market Preset</div>
                <div className="flex flex-wrap gap-2">
                  {SIM_PRESETS.map((p, idx) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(idx, simDir)}
                      className={`chip ${presetIdx === idx ? "chip-on font-semibold" : ""}`}
                    >
                      {p.label} <span className="opacity-65">· {p.assetClass}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Long / Short Toggle */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyPreset(presetIdx, "LONG")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                    simDir === "LONG"
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 shadow-[0_0_24px_-10px_rgba(16,185,129,0.75)] dark:text-emerald-400"
                      : "border-indigo-500/15 bg-white/50 text-slate-500 hover:border-emerald-500/40 dark:border-indigo-200/15 dark:bg-white/[0.03] dark:text-slate-400"
                  }`}
                >
                  <TrendingUp size={16} />LONG (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(presetIdx, "SHORT")}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition ${
                    simDir === "SHORT"
                      ? "border-rose-500/60 bg-rose-500/15 text-rose-600 shadow-[0_0_24px_-10px_rgba(244,63,94,0.75)] dark:text-rose-400"
                      : "border-indigo-500/15 bg-white/50 text-slate-500 hover:border-rose-500/40 dark:border-indigo-200/15 dark:bg-white/[0.03] dark:text-slate-400"
                  }`}
                >
                  <TrendingDown size={16} />SHORT (Sell)
                </button>
              </div>

              {/* Price & Size Inputs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="lbl">Entry Price</label>
                  <input className="inp" type="number" step="any" value={simEntry} onChange={(e) => setSimEntry(e.target.value)} />
                </div>
                <div>
                  <label className="lbl">{simDir === "SHORT" ? "Stop (above)" : "Stop (below)"}</label>
                  <input className="inp" type="number" step="any" value={simStop} onChange={(e) => setSimStop(e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Exit Price</label>
                  <input className="inp" type="number" step="any" value={simExit} onChange={(e) => setSimExit(e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Size</label>
                  <input className="inp" type="number" step="any" value={simSize} onChange={(e) => setSimSize(e.target.value)} />
                </div>
              </div>

              {/* Leverage Selector */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="lbl !mb-0">Leverage</label>
                  <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">{simLev}x</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {LEVERAGE_PRESETS.map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setSimLev(lv)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                        simLev === lv
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                          : "border-indigo-500/20 bg-white/60 text-slate-600 hover:border-indigo-400 dark:border-indigo-200/15 dark:bg-white/[0.04] dark:text-slate-300"
                      }`}
                    >
                      {lv}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculation Output */}
            <div className="flex flex-col justify-between rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] p-5 dark:border-indigo-300/25 dark:bg-indigo-400/[0.08]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {simPreset.label} · {simPreset.assetClass}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${simDir === "SHORT" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
                    {simDir} · {simLev}x
                  </span>
                </div>

                <div className="divide-y divide-indigo-500/15 text-sm dark:divide-indigo-200/10">
                  {[
                    ["Notional Position", money(simResult.positionValue), "text-slate-900 dark:text-white"],
                    [`Margin Required (${simLev}x)`, money(simResult.marginUsed), "text-indigo-600 dark:text-indigo-300"],
                    ["Initial Risk (1R)", `${money(simResult.risk)} (${simResult.riskPct.toFixed(2)}% acct)`, "text-slate-900 dark:text-white"],
                    [
                      "Realized P&L",
                      simResult.pnl == null ? "-" : `${simResult.pnl >= 0 ? "+" : ""}${money(simResult.pnl)}`,
                      (simResult.pnl ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    ],
                    [
                      "ROE (on Margin)",
                      simResult.roePct == null ? "-" : `${simResult.roePct >= 0 ? "+" : ""}${simResult.roePct.toFixed(2)}%`,
                      (simResult.roePct ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    ],
                    [
                      "R-Multiple",
                      simResult.r == null ? "-" : `${simResult.r >= 0 ? "+" : ""}${simResult.r.toFixed(2)}R`,
                      (simResult.r ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    ],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex items-baseline justify-between gap-2 py-2.5">
                      <span className="text-slate-500 dark:text-slate-400">{k}</span>
                      <span className={`font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>

                {simStopInvalid && (
                  <p className="mt-3 rounded-lg bg-rose-500/15 p-2.5 text-xs font-medium text-rose-600 dark:text-rose-300">
                    {simDir === "SHORT"
                      ? "For a short trade, stop loss must be above your entry price."
                      : "For a long trade, stop loss must be below your entry price."}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2">
                <Link href={primaryHref} className="btn-primary w-full justify-center py-2.5 text-xs">
                  Log this setup in your journal <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* =====================================================================
          CHAPTER 3: INTERACTIVE EDGE & ANALYTICS EXPLORER
         ===================================================================== */}
      <section id="analytics" className="mx-auto max-w-[1580px] px-6 py-20 md:px-10 md:py-28 xl:px-14">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                <Activity size={14} />Deep Edge Discovery
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Turn raw trades into clear statistical edge.
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Click through the interactive analytics widgets below — inspect daily P&amp;L heatmaps, filter Long vs Short session performance, and stress-test your drawdown guardrails.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["calendar", "P&L Calendar", Calendar],
                ["edge", "Session & Side Edge", Target],
                ["risk", "Risk Guardrails", ShieldAlert],
              ] as const).map(([k, lbl, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAnalyticsTab(k)}
                  className={`chip flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold ${analyticsTab === k ? "chip-on" : ""}`}
                >
                  <Icon size={14} />{lbl}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="panel !p-6 md:!p-8">
            {analyticsTab === "calendar" && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Interactive P&amp;L Heatmap · Click any highlighted day</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+$9,980 month</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                      <div key={idx} className="pb-1 font-semibold text-slate-400">{d}</div>
                    ))}
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((dayNum) => {
                      const info = DEMO_CALENDAR[dayNum];
                      const active = selectedDay === dayNum;
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => info && setSelectedDay(dayNum)}
                          className={`h-14 rounded-xl border p-1.5 text-left transition ${
                            info
                              ? info.pnl >= 0
                                ? "cursor-pointer border-emerald-500/30 bg-emerald-500/15 hover:border-emerald-400"
                                : "cursor-pointer border-rose-500/30 bg-rose-500/15 hover:border-rose-400"
                              : "cursor-default border-indigo-500/10 bg-white/40 dark:border-indigo-200/[0.06] dark:bg-white/[0.02]"
                          } ${active ? "ring-2 ring-indigo-500 dark:ring-indigo-300" : ""}`}
                        >
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{dayNum}</div>
                          {info && (
                            <div className={`text-[11px] font-extrabold ${info.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {info.pnl >= 0 ? "+" : ""}{(info.pnl / 1000).toFixed(1)}k
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-500/15 bg-white/70 p-5 dark:border-indigo-200/10 dark:bg-[#050916]/60">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Day {selectedDay} Breakdown</span>
                    <span className={`text-sm font-extrabold ${(DEMO_CALENDAR[selectedDay]?.pnl ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {DEMO_CALENDAR[selectedDay]
                        ? `${DEMO_CALENDAR[selectedDay].pnl >= 0 ? "+" : ""}${money(DEMO_CALENDAR[selectedDay].pnl)}`
                        : "$0"}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {(DEMO_CALENDAR[selectedDay]?.trades || []).map((t, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-indigo-500/15 bg-white/80 p-3 text-xs dark:border-indigo-200/10 dark:bg-white/[0.04]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{t.symbol}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.dir === "SHORT" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
                              {t.dir}
                            </span>
                          </div>
                          <div className="mt-1 text-slate-500 dark:text-slate-400">{t.setup}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${t.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {t.pnl >= 0 ? "+" : ""}{money(t.pnl)}
                          </div>
                          <div className="text-slate-500">{t.r >= 0 ? "+" : ""}{t.r.toFixed(2)}R</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {analyticsTab === "edge" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Session Profitability by Side</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Filter your edge across Longs, Shorts, or combined execution</div>
                  </div>
                  <div className="flex gap-1.5">
                    {(["ALL", "LONG", "SHORT"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setEdgeSide(side)}
                        className={`chip font-semibold ${edgeSide === side ? "chip-on" : ""}`}
                      >
                        {side === "ALL" ? "All sides" : side === "LONG" ? "Longs only" : "Shorts only"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {edgeRows.map((row) => (
                    <div key={row.label} className="rounded-xl border border-indigo-500/15 bg-white/70 p-4 dark:border-indigo-200/10 dark:bg-[#050916]/60">
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{row.label}</span>
                        <span className={`font-extrabold ${row.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {row.pnl >= 0 ? "+" : ""}{money(row.pnl)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${row.pnl >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.min(100, Math.max(12, (Math.abs(row.pnl) / 7000) * 100))}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{row.trades} trades · {row.win}% win rate</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-300">{row.avgR >= 0 ? "+" : ""}{row.avgR}R avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyticsTab === "risk" && (
              <div className="grid items-center gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Interactive Prop-Firm Drawdown Simulator</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drag the slider to simulate account drawdown against an 8.0% max drawdown limit. Your dashboard sidebar monitors this automatically across every account.
                  </p>
                  <div>
                    <div className="mb-2 flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Simulated Drawdown</span>
                      <span className={simDrawdown >= 6.4 ? "text-rose-500" : simDrawdown >= 4 ? "text-amber-500" : "text-emerald-500"}>
                        {simDrawdown.toFixed(1)}% / 8.0%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8.5"
                      step="0.1"
                      value={simDrawdown}
                      onChange={(e) => setSimDrawdown(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-indigo-500/15 bg-white/70 p-5 dark:border-indigo-200/10 dark:bg-[#050916]/60">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Guardrail Status</span>
                    <ShieldAlert size={16} className={simDrawdown >= 6.4 ? "text-rose-500" : simDrawdown >= 4 ? "text-amber-500" : "text-emerald-500"} />
                  </div>
                  <div className={`text-3xl font-extrabold ${simDrawdown >= 6.4 ? "text-rose-500" : simDrawdown >= 4 ? "text-amber-500" : "text-emerald-500"}`}>
                    {simDrawdown.toFixed(1)}% DD
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${simDrawdown >= 6.4 ? "bg-rose-500" : simDrawdown >= 4 ? "bg-amber-400" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, (simDrawdown / 8) * 100)}%` }}
                    />
                  </div>
                  <div className={`mt-3 rounded-lg p-2.5 text-xs font-medium ${
                    simDrawdown >= 8
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                      : simDrawdown >= 6.4
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                        : simDrawdown >= 4
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  }`}>
                    {simDrawdown >= 8
                      ? "Limit breached — Stop trading immediately and review journal mistakes."
                      : simDrawdown >= 6.4
                        ? "Critical zone (>80% of limit) — Cut position size to 0.25R."
                        : simDrawdown >= 4
                          ? "Caution zone (>50% of limit) — Stick strictly to A+ playbooks."
                          : "Healthy zone — Normal risk sizing permitted."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* =====================================================================
          CHAPTER 4: INTERACTIVE STRATEGY VAULT & LIVE PDF PLAYBOOK
         ===================================================================== */}
      <section id="vault" className="mx-auto max-w-[1580px] px-6 py-20 md:px-10 md:py-28 xl:px-14">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <BookOpen size={14} />Strategy Vault &amp; Live PDFs
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Your PDF playbooks &amp; custom fields, always one click away.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Upload your strategy PDFs, view them live right inside your workspace, and define custom named fields tailored to each setup. Try switching strategies or adding a custom field below.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="panel grid gap-6 !p-6 lg:grid-cols-[280px_1fr] md:!p-8">
            {/* Strategy Picker Column */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sample Vault</div>
              {DEMO_STRATEGIES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setVaultIdx(idx); setVaultPage(0); }}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    vaultIdx === idx
                      ? "border-indigo-500/60 bg-indigo-500/10 shadow-sm dark:border-indigo-400/50 dark:bg-indigo-400/15"
                      : "border-indigo-500/10 bg-white/60 hover:border-indigo-400/40 dark:border-indigo-200/10 dark:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.accent}`} />
                    <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.name}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{(customDemoFields[s.id] || []).length} custom fields</span>
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-500/15 px-1.5 py-0.5 font-semibold text-indigo-600 dark:text-indigo-300">
                      <FileText size={10} />PDF
                    </span>
                  </div>
                </button>
              ))}

              {/* Interactive Custom Name Field Adder */}
              <form onSubmit={addDemoField} className="mt-4 space-y-2 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                  <SlidersHorizontal size={12} />Try adding a custom field
                </div>
                <input
                  className="inp !py-1.5 text-xs"
                  placeholder="Field name (e.g. Checklist)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
                <input
                  className="inp !py-1.5 text-xs"
                  placeholder="Value (e.g. Confirm HTF bias)"
                  value={newFieldVal}
                  onChange={(e) => setNewFieldVal(e.target.value)}
                />
                <button type="submit" className="btn-primary w-full justify-center !py-1.5 text-xs">
                  <Plus size={13} />Add to strategy
                </button>
              </form>
            </div>

            {/* Live Strategy & PDF Viewer Mockup */}
            <div className="space-y-4">
              {/* Custom Fields Grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {activeDemoFields.map((f, i) => (
                  <div key={i} className="rounded-xl border border-indigo-500/15 bg-white/75 px-3.5 py-2.5 dark:border-indigo-200/10 dark:bg-[#050916]/70">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{f.label}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Interactive Live PDF Frame */}
              <div className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-white/85 dark:border-indigo-200/15 dark:bg-[#050916]/90">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/15 bg-indigo-50/70 px-4 py-2.5 text-xs dark:border-indigo-200/10 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <FileText size={14} className="text-indigo-500 dark:text-indigo-300" />
                    <span className="truncate">{activeDemoStrat.pdfName}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live View
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="icon-btn !p-1"
                      aria-label="Zoom out"
                      onClick={() => setVaultZoom((z) => Math.max(85, z - 10))}
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="w-10 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">{vaultZoom}%</span>
                    <button
                      type="button"
                      className="icon-btn !p-1"
                      aria-label="Zoom in"
                      onClick={() => setVaultZoom((z) => Math.min(115, z + 10))}
                    >
                      <ZoomIn size={14} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-indigo-500/20" />
                    <button
                      type="button"
                      className="icon-btn !p-1"
                      disabled={vaultPage === 0}
                      onClick={() => setVaultPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {vaultPage + 1} / {activeDemoStrat.pages.length}
                    </span>
                    <button
                      type="button"
                      className="icon-btn !p-1"
                      disabled={vaultPage === activeDemoStrat.pages.length - 1}
                      onClick={() => setVaultPage((p) => Math.min(activeDemoStrat.pages.length - 1, p + 1))}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div
                    style={{ transform: `scale(${vaultZoom / 100})`, transformOrigin: "top left" }}
                    className="rounded-xl border border-indigo-500/15 bg-white p-6 shadow-sm transition-transform dark:border-indigo-200/10 dark:bg-[#0c1329]"
                  >
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                      Playbook Document · Page {vaultPage + 1}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeDemoStrat.pages[vaultPage].title}
                    </h3>
                    <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                      {activeDemoStrat.pages[vaultPage].bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* =====================================================================
          CHAPTER 5: FINAL CTA & FOOTER
         ===================================================================== */}
      <section id="cta" className="mx-auto max-w-[1580px] px-6 pb-20 pt-12 md:px-10 md:pb-28 xl:px-14">
        <Reveal>
          <div className="panel relative overflow-hidden !p-8 text-center md:!p-14">
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:border-indigo-300/25 dark:bg-indigo-400/15 dark:text-indigo-200">
                <Compass size={13} />Built for disciplined multi-asset traders
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Ready to see your true trading edge?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
                Track every long and short trade, dial in leverage &amp; risk limits, upload your strategy PDFs, and switch effortlessly between cosmic Dark Mode and crisp Light Mode.
              </p>

              <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                {["Long & Short support", "Leverage & Margin ROE", "Multi-account guardrails", "Live PDF Strategy Vault", "CSV Import & Export", "Light & Dark Theme"].map((feat) => (
                  <span key={feat} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/15 bg-white/70 px-3 py-1 font-medium dark:border-indigo-200/10 dark:bg-white/[0.05]">
                    <CheckCircle2 size={12} className="text-emerald-500" />{feat}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Link href={primaryHref} className="btn-primary px-6 py-3 text-sm">
                  {signedIn ? "Open Your Dashboard" : "Create Free Journal"}
                  <ArrowRight size={16} />
                </Link>
                {signedIn && (
                  <Link href="/strategies" className="btn px-6 py-3 text-sm">
                    <Upload size={15} />Open Strategy Vault
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-indigo-500/15 pt-6 text-sm text-slate-500 dark:border-indigo-200/10 dark:text-slate-400">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100">
            <PhoenixLogo size={28} />
            Phoenix Flow
          </div>
          <div className="flex items-center gap-5">
            <a href="#hero" className="hover:text-indigo-500 dark:hover:text-white">Top</a>
            <a href="#simulator" className="hover:text-indigo-500 dark:hover:text-white">Simulator</a>
            <a href="#analytics" className="hover:text-indigo-500 dark:hover:text-white">Analytics</a>
            <a href="#vault" className="hover:text-indigo-500 dark:hover:text-white">Strategy Vault</a>
            <Link href={primaryHref} className="hover:text-indigo-500 dark:hover:text-white">{signedIn ? "Dashboard" : "Sign in"}</Link>
          </div>
        </footer>
      </section>
    </div>
  );
}
