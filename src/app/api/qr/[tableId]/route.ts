import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateQRBuffer, buildTableQRUrl } from "@/lib/qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, number: true, branchId: true, name: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const url = buildTableQRUrl(table.branchId, table.number);
    const buffer = await generateQRBuffer(url);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qr-meja-${table.number}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
