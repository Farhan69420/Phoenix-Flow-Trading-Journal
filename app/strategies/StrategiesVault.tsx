"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, BookOpen, Download, ExternalLink, Eye, FileText, Layers, LayoutDashboard,
  LogOut, Maximize2, Minimize2, Pencil, Plus, Search, SlidersHorizontal, Sparkles,
  Trash2, TrendingDown, TrendingUp, Upload, Wallet, X,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import PhoenixLogo from "../components/PhoenixLogo";

type CustomField = { id: string; label: string; value: string };
type Strategy = {
  id: string;
  name: string;
  direction: "LONG" | "SHORT" | "BOTH";
  accent: "iris" | "gain" | "loss" | "sky" | "amber" | "violet";
  description: string;
  customFields: CustomField[];
  pdfName: string | null;
  pdfSize: number | null;
  hasPdf: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id: string;
  name: string;
  direction: "LONG" | "SHORT" | "BOTH";
  accent: Strategy["accent"];
  description: string;
  customFields: CustomField[];
  pdfFile: File | null;
  existingPdfName: string | null;
  existingPdfSize: number | null;
  removePdf: boolean;
};

const QUICK_FIELDS = [
  { label: "Entry Trigger", placeholder: "e.g. 1m MSS after liquidity sweep" },
  { label: "Target R:R", placeholder: "e.g. 1:3 minimum" },
  { label: "Invalidation", placeholder: "e.g. Close beyond HTF order block" },
  { label: "Timeframe", placeholder: "e.g. 15m bias / 1m entry" },
  { label: "Best Session", placeholder: "e.g. NY Open / ORB" },
  { label: "Max Risk", placeholder: "e.g. 0.5% per setup" },
];

const ACCENTS: Record<Strategy["accent"], { label: string; dot: string; ring: string; soft: string }> = {
  iris: { label: "Iris", dot: "bg-iris", ring: "border-iris/50", soft: "bg-iris/15 text-indigo-200" },
  gain: { label: "Emerald", dot: "bg-gain", ring: "border-gain/50", soft: "bg-gain/15 text-gain" },
  loss: { label: "Rose", dot: "bg-loss", ring: "border-loss/50", soft: "bg-loss/15 text-loss" },
  sky: { label: "Cyan", dot: "bg-sky-400", ring: "border-sky-400/50", soft: "bg-sky-400/15 text-sky-300" },
  amber: { label: "Amber", dot: "bg-amber-400", ring: "border-amber-400/50", soft: "bg-amber-400/15 text-amber-300" },
  violet: { label: "Nebula", dot: "bg-violet-400", ring: "border-violet-400/50", soft: "bg-violet-400/15 text-violet-300" },
};

const uid = () => `cf-${Math.random().toString(36).slice(2, 9)}`;

const fmtBytes = (n?: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const blankForm = (): FormState => ({
  id: "",
  name: "",
  direction: "BOTH",
  accent: "iris",
  description: "",
  customFields: [
    { id: uid(), label: "Entry Trigger", value: "" },
    { id: uid(), label: "Target R:R", value: "" },
  ],
  pdfFile: null,
  existingPdfName: null,
  existingPdfSize: null,
  removePdf: false,
});

const toForm = (s: Strategy): FormState => ({
  id: s.id,
  name: s.name,
  direction: s.direction || "BOTH",
  accent: (s.accent in ACCENTS ? s.accent : "iris") as Strategy["accent"],
  description: s.description || "",
  customFields: s.customFields.length ? s.customFields.map((f) => ({ ...f })) : [],
  pdfFile: null,
  existingPdfName: s.pdfName,
  existingPdfSize: s.pdfSize,
  removePdf: false,
});

export default function StrategiesVault() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [biasFilter, setBiasFilter] = useState<"" | "LONG" | "SHORT" | "BOTH">("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingQuick, setUploadingQuick] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [modalDragOver, setModalDragOver] = useState(false);
  const [showModalPreview, setShowModalPreview] = useState(false);
  const quickFileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (preferredId?: string) => {
    const r = await fetch("/api/strategies");
    if (r.status === 401) return router.push("/login");
    const list: Strategy[] = await r.json();
    setStrategies(list);
    setSelectedId((prev) => {
      if (preferredId && list.some((s) => s.id === preferredId)) return preferredId;
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
    setLoaded(true);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Local object URL for live PDF preview inside create/edit modal
  const localPdfUrl = useMemo(() => {
    if (!form?.pdfFile) return null;
    return URL.createObjectURL(form.pdfFile);
  }, [form?.pdfFile]);

  useEffect(() => {
    return () => {
      if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
    };
  }, [localPdfUrl]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return strategies.filter((s) => {
      if (biasFilter && s.direction !== biasFilter) return false;
      if (!term) return true;
      const inName = s.name.toLowerCase().includes(term);
      const inDesc = s.description.toLowerCase().includes(term);
      const inFields = s.customFields.some(
        (f) => f.label.toLowerCase().includes(term) || f.value.toLowerCase().includes(term)
      );
      return inName || inDesc || inFields;
    });
  }, [strategies, q, biasFilter]);

  const selected = useMemo(
    () => strategies.find((s) => s.id === selectedId) ?? filtered[0] ?? null,
    [strategies, selectedId, filtered]
  );

  const pdfCount = strategies.filter((s) => s.hasPdf).length;
  const totalCustomFields = strategies.reduce((sum, s) => sum + s.customFields.length, 0);

  const logout = async () => {
    await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    router.push("/login");
  };

  function validatePdf(file: File): string | null {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Please select a valid PDF file (.pdf).";
    if (file.size > 15 * 1024 * 1024) return "PDF file must be 15 MB or smaller.";
    return null;
  }

  async function saveStrategy() {
    if (!form) return;
    if (!form.name.trim()) return alert("Please enter a strategy name.");
    if (form.pdfFile) {
      const err = validatePdf(form.pdfFile);
      if (err) return alert(err);
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (form.id) fd.append("id", form.id);
      fd.append("name", form.name.trim());
      fd.append("direction", form.direction);
      fd.append("accent", form.accent);
      fd.append("description", form.description);
      fd.append(
        "customFields",
        JSON.stringify(form.customFields.filter((f) => f.label.trim() || f.value.trim()))
      );
      if (form.pdfFile) fd.append("pdf", form.pdfFile);
      if (form.removePdf && !form.pdfFile) fd.append("removePdf", "true");

      const r = await fetch("/api/strategies", { method: form.id ? "PUT" : "POST", body: fd });
      const data = await r.json();
      if (!r.ok) return alert(data.error || "Could not save strategy.");

      setForm(null);
      setShowModalPreview(false);
      await load(data.id);
    } finally {
      setSaving(false);
    }
  }

  async function quickUploadPdf(strategy: Strategy, file: File) {
    const err = validatePdf(file);
    if (err) return alert(err);
    setUploadingQuick(true);
    try {
      const fd = new FormData();
      fd.append("id", strategy.id);
      fd.append("pdf", file);
      const r = await fetch("/api/strategies", { method: "PUT", body: fd });
      const data = await r.json();
      if (!r.ok) return alert(data.error || "Failed to upload PDF.");
      await load(strategy.id);
    } finally {
      setUploadingQuick(false);
    }
  }

  async function deleteStrategy(s: Strategy) {
    if (!confirm(`Delete strategy "${s.name}" and its attached PDF?`)) return;
    const r = await fetch(`/api/strategies?id=${s.id}`, { method: "DELETE" });
    if (!r.ok) return alert("Failed to delete strategy.");
    await load();
  }

  const biasBadge = (dir: Strategy["direction"]) => {
    if (dir === "LONG") {
      return <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-gain/15 text-gain"><TrendingUp size={10} />LONG</span>;
    }
    if (dir === "SHORT") {
      return <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-loss/15 text-loss"><TrendingDown size={10} />SHORT</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-iris/15 text-indigo-200"><Layers size={10} />LONG &amp; SHORT</span>;
  };

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-iris" />
      </div>
    );
  }

  const livePdfUrl = selected?.hasPdf ? `/api/strategies/${selected.id}/pdf?v=${encodeURIComponent(selected.updatedAt)}` : null;

  return (
    <div className="theme-scope min-h-screen">
      {/* Left Sidebar (matching Dashboard) */}
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
          <Link href="/dashboard#overview" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
            <LayoutDashboard size={15} className="text-iris/90" />Overview
          </Link>
          <Link href="/dashboard#insights" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
            <Activity size={15} className="text-iris/90" />Insights
          </Link>
          <Link href="/dashboard#trades" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
            <Wallet size={15} className="text-iris/90" />Trade log
          </Link>
          <Link href="/strategies" className="flex items-center gap-2.5 rounded-lg border border-iris/40 bg-iris/15 px-3 py-2 font-semibold text-white shadow-[0_0_20px_-10px_rgba(139,140,255,0.8)]">
            <BookOpen size={15} className="text-iris" />Strategies
          </Link>
        </nav>

        {/* Strategy Library inside Left Rail */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Playbook Library</span>
            <button
              className="icon-btn !p-1"
              title="New strategy"
              onClick={() => { setShowModalPreview(false); setForm(blankForm()); }}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              className="inp !py-1.5 !pl-8 text-xs"
              placeholder="Search strategies or fields…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {([["", "All"], ["BOTH", "Both"], ["LONG", "Long"], ["SHORT", "Short"]] as const).map(([val, label]) => (
              <button
                key={label}
                onClick={() => setBiasFilter(val)}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${biasFilter === val ? "border-iris bg-iris/20 text-indigo-200" : "border-indigo-200/10 bg-white/[0.03] text-slate-400 hover:border-iris/40"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
            {filtered.length ? filtered.map((s) => {
              const acc = ACCENTS[s.accent] || ACCENTS.iris;
              const isSelected = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${isSelected ? `${acc.ring} bg-white/[0.08] shadow-[0_0_20px_-10px_rgba(139,140,255,0.65)]` : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${acc.dot}`} />
                    <span className="truncate text-sm font-semibold text-slate-100">{s.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>{s.customFields.length} custom field{s.customFields.length === 1 ? "" : "s"}</span>
                    {s.hasPdf ? (
                      <span className="inline-flex items-center gap-1 rounded bg-iris/15 px-1.5 py-0.5 font-semibold text-indigo-200">
                        <FileText size={10} />PDF
                      </span>
                    ) : (
                      <span className="text-slate-500">No PDF</span>
                    )}
                  </div>
                </button>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-indigo-200/15 p-4 text-center text-xs text-slate-500">
                {strategies.length ? "No strategies match your search." : "No strategies saved yet."}
              </div>
            )}
          </div>

          {/* Vault Telemetry Card */}
          <div className="rounded-xl border border-indigo-200/[0.09] bg-white/[0.03] p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Vault Stats</span>
              <BookOpen size={13} className="text-iris" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total strategies</span>
              <span className="font-semibold text-white">{strategies.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PDF playbooks</span>
              <span className="font-semibold text-indigo-200">{pdfCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Custom fields</span>
              <span className="font-semibold text-slate-200">{totalCustomFields}</span>
            </div>
          </div>
        </div>

        <button className="btn mt-4 justify-center" onClick={logout}><LogOut size={14} />Log out</button>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        <main className="mx-auto w-full max-w-[1400px] space-y-5 p-4 md:p-6 xl:p-8">
          {/* Mobile Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
            <ThemeToggle compact />
            <Link href="/dashboard" className="chip whitespace-nowrap">← Dashboard</Link>
            <span className="chip chip-on whitespace-nowrap">Strategies</span>
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`chip whitespace-nowrap ${selected?.id === s.id ? "chip-on" : ""}`}
              >
                {s.name}
              </button>
            ))}
            <button className="chip whitespace-nowrap" onClick={() => { setShowModalPreview(false); setForm(blankForm()); }}>+ Strategy</button>
            <button className="chip whitespace-nowrap" onClick={logout}>Log out</button>
          </div>

          <header className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Strategy Vault</h1>
              <p className="text-sm text-slate-400">
                Upload your strategy PDFs, customize fields, and keep your playbooks open in live view.
              </p>
            </div>
            <button className="btn-primary" onClick={() => { setShowModalPreview(false); setForm(blankForm()); }}>
              <Plus size={15} />New strategy
            </button>
          </header>

          {selected ? (
            <div className="space-y-5">
              {/* Strategy Details & Custom Name Fields Panel */}
              <section className="panel">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`h-3 w-3 rounded-full ${(ACCENTS[selected.accent] || ACCENTS.iris).dot}`} />
                      <h2 className="text-xl font-extrabold tracking-tight text-white">{selected.name}</h2>
                      {biasBadge(selected.direction)}
                    </div>
                    {selected.description && (
                      <p className="max-w-3xl whitespace-pre-wrap text-sm text-slate-300/90">{selected.description}</p>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Updated {new Date(selected.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="btn"
                      onClick={() => { setShowModalPreview(false); setForm(toForm(selected)); }}
                    >
                      <Pencil size={14} />Edit &amp; customize
                    </button>
                    <button className="btn hover:!border-loss/40 hover:!text-loss" onClick={() => deleteStrategy(selected)}>
                      <Trash2 size={14} />Delete
                    </button>
                  </div>
                </div>

                {/* Custom Name Fields Display */}
                <div className="mt-5 border-t border-indigo-200/[0.08] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <SlidersHorizontal size={13} className="text-iris" />
                      Custom Strategy Fields
                    </div>
                    <button
                      className="text-xs font-medium text-iris hover:underline"
                      onClick={() => { setShowModalPreview(false); setForm(toForm(selected)); }}
                    >
                      + Add / edit fields
                    </button>
                  </div>
                  {selected.customFields.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {selected.customFields.map((field) => (
                        <div
                          key={field.id}
                          className="rounded-xl border border-indigo-200/[0.09] bg-[#050916]/60 px-3.5 py-2.5"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300/80">
                            {field.label || "Field"}
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-100">
                            {field.value || <span className="text-slate-500">—</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-indigo-200/15 p-4 text-center text-xs text-slate-500">
                      No custom fields added yet. Click &ldquo;Edit &amp; customize&rdquo; to add your own named strategy fields.
                    </div>
                  )}
                </div>
              </section>

              {/* Live PDF Viewer Panel */}
              <section
                className={`panel transition ${dragOver ? "!border-iris ring-2 ring-iris/30" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) quickUploadPdf(selected, file);
                }}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="mr-auto flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-iris/15 text-iris">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span>Live PDF View</span>
                        {selected.hasPdf && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gain/15 px-2 py-0.5 text-[10px] font-semibold text-gain">
                            <span className="h-1.5 w-1.5 rounded-full bg-gain" />Live
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {selected.hasPdf
                          ? `${selected.pdfName} · ${fmtBytes(selected.pdfSize)}`
                          : "Drop a PDF anywhere here or click Upload PDF"}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={quickFileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) quickUploadPdf(selected, file);
                      e.currentTarget.value = "";
                    }}
                  />

                  <button
                    className="btn"
                    disabled={uploadingQuick}
                    onClick={() => quickFileRef.current?.click()}
                  >
                    <Upload size={14} />
                    {uploadingQuick ? "Uploading…" : selected.hasPdf ? "Replace PDF" : "Upload PDF"}
                  </button>

                  {livePdfUrl && (
                    <>
                      <button className="btn" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        {expanded ? "Compact" : "Expand"}
                      </button>
                      <a href={livePdfUrl} target="_blank" rel="noreferrer" className="btn">
                        <ExternalLink size={14} />Open tab
                      </a>
                      <a href={`${livePdfUrl}&download=1`} className="btn">
                        <Download size={14} />Download
                      </a>
                    </>
                  )}
                </div>

                {livePdfUrl ? (
                  <div className="overflow-hidden rounded-xl border border-indigo-200/15 bg-[#04060f]">
                    <iframe
                      key={livePdfUrl}
                      src={`${livePdfUrl}#toolbar=1&navpanes=0`}
                      title={selected.pdfName || selected.name}
                      className={`w-full transition-all ${expanded ? "h-[86vh]" : "h-[72vh] min-h-[520px]"}`}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => quickFileRef.current?.click()}
                    className="grid cursor-pointer place-items-center gap-3 rounded-xl border border-dashed border-indigo-200/20 bg-[#050916]/50 px-6 py-20 text-center transition hover:border-iris/60 hover:bg-iris/[0.04]"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-iris/15 text-iris">
                      <Upload size={22} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Upload your strategy PDF</div>
                      <p className="mt-1 text-sm text-slate-400">
                        Drag &amp; drop a PDF here, or click to browse (up to 15 MB). It opens immediately in live view.
                      </p>
                    </div>
                    <span className="btn-primary mt-1">Choose PDF file</span>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="panel grid place-items-center gap-4 py-20 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-iris/25 to-violet-500/20 text-iris ring-1 ring-iris/30">
                <BookOpen size={26} />
              </div>
              <div className="max-w-md">
                <h2 className="text-xl font-extrabold text-white">Build your Strategy Vault</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Create custom trading strategies with your own named fields (Entry Trigger, Target R:R, Invalidation, Checklist, etc.) and attach PDF playbooks to view live anytime.
                </p>
              </div>
              <button
                className="btn-primary mt-1"
                onClick={() => { setShowModalPreview(false); setForm(blankForm()); }}
              >
                <Plus size={15} />Create your first strategy
              </button>
            </section>
          )}
        </main>
      </div>

      {/* Create / Edit Strategy Modal */}
      {form && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm md:p-6">
          <div className="panel app-modal mx-auto w-full max-w-4xl !bg-panel/95">
            <div className="mb-5 flex items-center">
              <h3 className="flex-1 text-xl font-extrabold text-white">
                {form.id ? "Edit strategy" : "Create new strategy"}
              </h3>
              <button className="icon-btn" aria-label="Close" onClick={() => setForm(null)}><X size={18} /></button>
            </div>

            <div className="space-y-6">
              {/* Name, Bias, Accent */}
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="lbl">Strategy name</label>
                  <input
                    className="inp"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. NY Open ORB Liquidity Sweep"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="lbl">Market bias</label>
                  <div className="flex gap-1.5">
                    {([["BOTH", "Both"], ["LONG", "Long"], ["SHORT", "Short"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm({ ...form, direction: val })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          form.direction === val
                            ? val === "LONG"
                              ? "border-gain/60 bg-gain/15 text-gain"
                              : val === "SHORT"
                                ? "border-loss/60 bg-loss/15 text-loss"
                                : "border-iris/60 bg-iris/20 text-indigo-200"
                            : "border-indigo-200/15 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="lbl">Summary / Execution Notes</label>
                  <textarea
                    className="inp"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Key context, market conditions, or high-level rules for this strategy…"
                  />
                </div>
                <div>
                  <label className="lbl">Accent color</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {(Object.keys(ACCENTS) as Strategy["accent"][]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        title={ACCENTS[key].label}
                        onClick={() => setForm({ ...form, accent: key })}
                        className={`h-7 w-7 rounded-full ${ACCENTS[key].dot} transition ${form.accent === key ? "ring-2 ring-white ring-offset-2 ring-offset-panel scale-110" : "opacity-60 hover:opacity-100"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Name Fields Builder */}
              <div className="rounded-xl border border-indigo-200/15 bg-[#050916]/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">Custom Name Fields</div>
                    <div className="text-xs text-slate-400">Define any custom field names &amp; values for your strategy playbook.</div>
                  </div>
                  <button
                    type="button"
                    className="btn !py-1.5 text-xs"
                    onClick={() => setForm({ ...form, customFields: [...form.customFields, { id: uid(), label: "", value: "" }] })}
                  >
                    <Plus size={13} />Add custom field
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Quick add:</span>
                  {QUICK_FIELDS.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          customFields: [...form.customFields, { id: uid(), label: tpl.label, value: "" }],
                        })
                      }
                      className="rounded-full border border-indigo-200/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-300 transition hover:border-iris/60 hover:bg-iris/15 hover:text-white"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {form.customFields.map((cf, idx) => (
                    <div key={cf.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr_auto]">
                      <input
                        className="inp text-xs font-medium"
                        placeholder="Custom field name"
                        value={cf.label}
                        onChange={(e) => {
                          const next = [...form.customFields];
                          next[idx] = { ...cf, label: e.target.value };
                          setForm({ ...form, customFields: next });
                        }}
                      />
                      <input
                        className="inp text-xs"
                        placeholder={QUICK_FIELDS.find((q) => q.label === cf.label)?.placeholder || "Enter value or rule…"}
                        value={cf.value}
                        onChange={(e) => {
                          const next = [...form.customFields];
                          next[idx] = { ...cf, value: e.target.value };
                          setForm({ ...form, customFields: next });
                        }}
                      />
                      <button
                        type="button"
                        title="Remove field"
                        className="icon-btn justify-self-end hover:!text-loss"
                        onClick={() => setForm({ ...form, customFields: form.customFields.filter((x) => x.id !== cf.id) })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {!form.customFields.length && (
                    <p className="py-2 text-center text-xs text-slate-500">
                      No custom fields yet. Use &ldquo;+ Add custom field&rdquo; or a quick template above.
                    </p>
                  )}
                </div>
              </div>

              {/* PDF Upload Zone inside Modal */}
              <div>
                <label className="lbl">Strategy PDF Document (optional, max 15 MB)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setModalDragOver(true); }}
                  onDragLeave={() => setModalDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setModalDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const err = validatePdf(file);
                      if (err) return alert(err);
                      setForm({ ...form, pdfFile: file, removePdf: false });
                    }
                  }}
                  className={`rounded-xl border border-dashed p-4 transition ${modalDragOver ? "border-iris bg-iris/10" : "border-indigo-200/20 bg-[#050916]/50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-iris/15 text-iris">
                        <FileText size={18} />
                      </div>
                      <div className="text-xs">
                        {form.pdfFile ? (
                          <>
                            <div className="font-semibold text-white">{form.pdfFile.name}</div>
                            <div className="text-gain">Ready to upload · {fmtBytes(form.pdfFile.size)}</div>
                          </>
                        ) : form.existingPdfName && !form.removePdf ? (
                          <>
                            <div className="font-semibold text-white">{form.existingPdfName}</div>
                            <div className="text-slate-400">Currently attached · {fmtBytes(form.existingPdfSize)}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-200">Drag &amp; drop a PDF here</div>
                            <div className="text-slate-500">Or choose a PDF file from your computer</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn cursor-pointer !py-1.5 text-xs">
                        <Upload size={13} />
                        {form.pdfFile || (form.existingPdfName && !form.removePdf) ? "Change PDF" : "Browse PDF"}
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const err = validatePdf(file);
                              if (err) return alert(err);
                              setForm({ ...form, pdfFile: file, removePdf: false });
                            }
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {localPdfUrl && (
                        <button
                          type="button"
                          className="btn !py-1.5 text-xs"
                          onClick={() => setShowModalPreview((v) => !v)}
                        >
                          <Eye size={13} />{showModalPreview ? "Hide preview" : "Live preview"}
                        </button>
                      )}
                      {(form.pdfFile || (form.existingPdfName && !form.removePdf)) && (
                        <button
                          type="button"
                          className="btn !py-1.5 text-xs hover:!text-loss"
                          onClick={() => {
                            setShowModalPreview(false);
                            setForm({ ...form, pdfFile: null, removePdf: true });
                          }}
                        >
                          <X size={13} />Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {showModalPreview && localPdfUrl && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-indigo-200/15 bg-ink">
                      <iframe src={`${localPdfUrl}#toolbar=1&navpanes=0`} title="PDF preview" className="h-80 w-full" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-indigo-200/10 pt-4">
                <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
                <button type="button" className="btn-primary px-5" disabled={saving} onClick={saveStrategy}>
                  {saving ? "Saving…" : form.id ? "Save changes" : "Save strategy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
