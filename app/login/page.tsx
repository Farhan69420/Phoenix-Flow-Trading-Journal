"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gauge, TrendingDown, TrendingUp } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import PhoenixLogo from "../components/PhoenixLogo";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: mode, email, password }) });
    if (r.ok) router.push("/dashboard");
    else {
      setErr((await r.json()).error);
      setBusy(false);
    }
  }

  return (
    <div className="theme-scope min-h-screen">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
        <Link href="/" className="btn !py-1.5 text-xs">
          <ArrowLeft size={14} />Back to home
        </Link>
        <ThemeToggle />
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-68px)] max-w-5xl items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <PhoenixLogo size={44} />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white">Phoenix Flow</div>
              <div className="text-xs text-indigo-200/70">Multi-asset Long &amp; Short Journal</div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
              Know why your trades work.
            </h1>
            <p className="mt-3 max-w-md text-slate-300/80">
              Track both long and short positions across stocks, futures, commodities, forex and crypto. Measure your edge by leverage, R-multiples, setups and sessions.
            </p>
          </div>
          <div className="grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-200/10 bg-[#0a1024]/60 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gain"><TrendingUp size={13} />Longs</div>
              <p className="text-[11px] text-slate-400">Breakouts, trend continuations &amp; sweeps</p>
            </div>
            <div className="rounded-xl border border-indigo-200/10 bg-[#0a1024]/60 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-loss"><TrendingDown size={13} />Shorts</div>
              <p className="text-[11px] text-slate-400">Rejections, breakdowns &amp; mean reversion</p>
            </div>
            <div className="rounded-xl border border-indigo-200/10 bg-[#0a1024]/60 p-3 backdrop-blur">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-iris"><Gauge size={13} />Leverage</div>
              <p className="text-[11px] text-slate-400">Margin required, ROE % &amp; risk guardrails</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="panel space-y-4 !p-7">
          <h2 className="text-lg font-semibold text-white">{mode === "login" ? "Welcome back" : "Create your journal"}</h2>
          <div>
            <label className="lbl">Username or email</label>
            <input className="inp" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="lbl">Password (6+ characters)</label>
            <input className="inp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {err && <p className="rounded-lg bg-loss/10 p-2 text-sm text-loss">{err}</p>}
          <button className="btn-primary w-full justify-center py-2.5" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Log in" : "Create account and start"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-400 hover:text-slate-200"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </form>
      </main>
    </div>
  );
}
