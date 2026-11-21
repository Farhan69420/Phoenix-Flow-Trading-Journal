import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
const VALID_DIRECTIONS = new Set(["LONG", "SHORT", "BOTH"]);
const VALID_ACCENTS = new Set(["iris", "gain", "loss", "sky", "amber", "violet"]);

const STRATEGY_SELECT = {
  id: true,
  name: true,
  direction: true,
  accent: true,
  description: true,
  customFields: true,
  pdfName: true,
  pdfSize: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CustomField = { id: string; label: string; value: string };

function parseCustomFields(raw: FormDataEntryValue | null): CustomField[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, idx) => ({
        id: String(item?.id || `f-${idx}-${Date.now()}`),
        label: String(item?.label || "").trim(),
        value: String(item?.value || "").trim(),
      }))
      .filter((f) => f.label.length > 0 || f.value.length > 0);
  } catch {
    return [];
  }
}

async function parsePdf(file: FormDataEntryValue | null) {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Only PDF files (.pdf) are supported.");
  if (file.size > MAX_PDF_BYTES) throw new Error("PDF exceeds the 15 MB limit.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    pdfName: file.name || "strategy.pdf",
    pdfSize: file.size,
    pdfData: bytes,
  };
}

const serialize = (s: {
  id: string;
  name: string;
  direction: string;
  accent: string;
  description: string;
  customFields: unknown;
  pdfName: string | null;
  pdfSize: number | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...s,
  customFields: Array.isArray(s.customFields) ? s.customFields : [],
  hasPdf: Boolean(s.pdfName),
});

const deny = () => NextResponse.json({ error: "Not signed in" }, { status: 401 });
const bad = (e: any) => NextResponse.json({ error: e?.message || "Invalid strategy data" }, { status: 400 });

export async function GET() {
  const uid = await getUserId();
  if (!uid) return deny();
  const rows = await prisma.strategy.findMany({
    where: { userId: uid },
    select: STRATEGY_SELECT,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return deny();
  try {
    const fd = await req.formData();
    const name = String(fd.get("name") || "").trim();
    if (!name) throw new Error("Strategy name is required.");
    const dirRaw = String(fd.get("direction") || "BOTH").toUpperCase();
    const direction = VALID_DIRECTIONS.has(dirRaw) ? dirRaw : "BOTH";
    const accentRaw = String(fd.get("accent") || "iris").toLowerCase();
    const accent = VALID_ACCENTS.has(accentRaw) ? accentRaw : "iris";
    const description = String(fd.get("description") || "").trim();
    const customFields = parseCustomFields(fd.get("customFields"));
    const pdf = await parsePdf(fd.get("pdf"));

    const created = await prisma.strategy.create({
      data: {
        userId: uid,
        name,
        direction,
        accent,
        description,
        customFields,
        ...(pdf ?? {}),
      },
      select: STRATEGY_SELECT,
    });
    return NextResponse.json(serialize(created));
  } catch (e) {
    return bad(e);
  }
}

export async function PUT(req: Request) {
  const uid = await getUserId();
  if (!uid) return deny();
  try {
    const fd = await req.formData();
    const id = String(fd.get("id") || "").trim();
    if (!id) throw new Error("Strategy ID is required.");

    const existing = await prisma.strategy.findFirst({ where: { id, userId: uid }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Strategy not found" }, { status: 404 });

    const data: Record<string, any> = {};
    if (fd.has("name")) {
      const name = String(fd.get("name") || "").trim();
      if (!name) throw new Error("Strategy name is required.");
      data.name = name;
    }
    if (fd.has("direction")) {
      const dirRaw = String(fd.get("direction") || "BOTH").toUpperCase();
      data.direction = VALID_DIRECTIONS.has(dirRaw) ? dirRaw : "BOTH";
    }
    if (fd.has("accent")) {
      const accentRaw = String(fd.get("accent") || "iris").toLowerCase();
      data.accent = VALID_ACCENTS.has(accentRaw) ? accentRaw : "iris";
    }
    if (fd.has("description")) {
      data.description = String(fd.get("description") || "").trim();
    }
    if (fd.has("customFields")) {
      data.customFields = parseCustomFields(fd.get("customFields"));
    }

    const pdf = await parsePdf(fd.get("pdf"));
    if (pdf) {
      data.pdfName = pdf.pdfName;
      data.pdfSize = pdf.pdfSize;
      data.pdfData = pdf.pdfData;
    } else if (fd.get("removePdf") === "true") {
      data.pdfName = null;
      data.pdfSize = null;
      data.pdfData = null;
    }

    const updated = await prisma.strategy.update({
      where: { id },
      data,
      select: STRATEGY_SELECT,
    });
    return NextResponse.json(serialize(updated));
  } catch (e) {
    return bad(e);
  }
}

export async function DELETE(req: Request) {
  const uid = await getUserId();
  if (!uid) return deny();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing strategy id" }, { status: 400 });
  await prisma.strategy.deleteMany({ where: { id, userId: uid } });
  return NextResponse.json({ ok: true });
}
