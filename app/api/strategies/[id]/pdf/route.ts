import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await context.params;
  const row = await prisma.strategy.findFirst({
    where: { id, userId: uid },
    select: { pdfData: true, pdfName: true },
  });

  if (!row || !row.pdfData) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const download = new URL(req.url).searchParams.get("download") === "1";
  const safeName = (row.pdfName || "strategy.pdf").replace(/["\\\r\n]/g, "_");

  return new NextResponse(new Uint8Array(row.pdfData), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
