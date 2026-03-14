import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCurrency } from "@/lib/utils";
import type { ReceiptData } from "@/lib/whatsapp";

const MM_TO_PT = 2.834645669;
const PAGE_WIDTH = 80 * MM_TO_PT;
const MARGIN_X = 10;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

type PrintOp =
  | {
      type: "text";
      text: string;
      align: "left" | "center" | "right";
      font: PDFFont;
      size: number;
      gapAfter: number;
    }
  | {
      type: "pair";
      left: string;
      right: string;
      leftFont: PDFFont;
      rightFont: PDFFont;
      size: number;
      gapAfter: number;
    };

function formatReceiptDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text.trim()) return [""];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, size);

    if (candidateWidth <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    let partial = "";
    for (const character of word) {
      const next = partial + character;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        partial = next;
      } else {
        if (partial) lines.push(partial);
        partial = character;
      }
    }
    current = partial;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function buildDividerLine(font: PDFFont, size: number, maxWidth: number): string {
  const dashWidth = font.widthOfTextAtSize("-", size);
  let count = Math.max(1, Math.floor(maxWidth / dashWidth));

  while (count > 1 && font.widthOfTextAtSize("-".repeat(count), size) > maxWidth) {
    count -= 1;
  }

  return "-".repeat(count);
}

export async function buildReceiptPdfBuffer(receipt: ReceiptData): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Courier);
  const fontBold = await pdf.embedFont(StandardFonts.CourierBold);

  const ops: PrintOp[] = [];

  const addText = (
    text: string,
    options?: {
      align?: "left" | "center" | "right";
      bold?: boolean;
      size?: number;
      gapAfter?: number;
    }
  ) => {
    const lines = wrapText(
      text,
      options?.bold ? fontBold : fontRegular,
      options?.size ?? 9,
      CONTENT_WIDTH
    );

    for (const line of lines) {
      ops.push({
        type: "text",
        text: line,
        align: options?.align ?? "left",
        font: options?.bold ? fontBold : fontRegular,
        size: options?.size ?? 9,
        gapAfter: options?.gapAfter ?? 2,
      });
    }
  };

  const addPair = (
    left: string,
    right: string,
    options?: {
      bold?: boolean;
      size?: number;
      gapAfter?: number;
    }
  ) => {
    ops.push({
      type: "pair",
      left,
      right,
      leftFont: options?.bold ? fontBold : fontRegular,
      rightFont: options?.bold ? fontBold : fontRegular,
      size: options?.size ?? 9,
      gapAfter: options?.gapAfter ?? 2,
    });
  };

  const addDivider = () => {
    addText(buildDividerLine(fontRegular, 8.5, CONTENT_WIDTH), {
      align: "left",
      size: 8.5,
      gapAfter: 3,
    });
  };

  addText(receipt.branchName, { align: "center", bold: true, size: 11, gapAfter: 2 });
  if (receipt.branchAddress) {
    addText(receipt.branchAddress, { align: "center", size: 8.5, gapAfter: 1.5 });
  }
  if (receipt.branchPhone) {
    addText(`Telp ${receipt.branchPhone}`, { align: "center", size: 8.5, gapAfter: 1.5 });
  }

  addDivider();
  addPair("Tanggal", formatReceiptDate(receipt.createdAt), { size: 8.8 });
  addPair("No Order", receipt.orderNumber, { size: 8.8 });
  addPair("Kasir", receipt.cashierName || "-", { size: 8.8 });
  addPair("Pelanggan", receipt.customerName || "-", { size: 8.8 });
  addPair("Layanan", receipt.tableName, { size: 8.8, gapAfter: 3 });

  addDivider();
  addPair("ITEM", "SUBTOTAL", { bold: true, size: 9, gapAfter: 3 });
  addDivider();

  let totalQty = 0;
  for (const [index, item] of receipt.items.entries()) {
    totalQty += item.quantity;

    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    addText(`${index + 1}. ${itemName}`, { bold: true, size: 9, gapAfter: 1.2 });
    addPair(`   ${item.quantity} x ${formatCurrency(item.subtotal / item.quantity)}`, formatCurrency(item.subtotal), {
      size: 8.6,
      gapAfter: 1.2,
    });

    if (item.modifiers?.length) {
      for (const modifier of item.modifiers) {
        addText(`   + ${modifier.name}${modifier.price > 0 ? ` (${formatCurrency(modifier.price)})` : ""}`, {
          size: 8.3,
          gapAfter: 1,
        });
      }
    }
  }

  addDivider();
  addPair("Total QTY", String(totalQty), { size: 9 });
  addPair("Sub Total", formatCurrency(receipt.subtotal), { size: 9 });
  if (receipt.discountAmount > 0) {
    addPair("Diskon", `-${formatCurrency(receipt.discountAmount)}`, { size: 9 });
  }
  addPair(`PB1 (${receipt.taxRate}%)`, formatCurrency(receipt.taxAmount), { size: 9 });
  addPair(`Service (${receipt.serviceRate}%)`, formatCurrency(receipt.serviceAmount), { size: 9 });
  addPair("Total", formatCurrency(receipt.totalAmount), { bold: true, size: 10, gapAfter: 3 });

  if (receipt.paymentMethod) {
    addPair("Bayar", receipt.paymentMethod, { size: 9 });
  }
  if (typeof receipt.paidAmount === "number") {
    addPair("Diterima", formatCurrency(receipt.paidAmount), { size: 9 });
  }
  if (receipt.changeAmount && receipt.changeAmount > 0) {
    addPair("Kembali", formatCurrency(receipt.changeAmount), { size: 9 });
  }

  addDivider();
  addText("Terimakasih Telah Berbelanja", { align: "center", bold: true, size: 9.5, gapAfter: 1.5 });
  addText("Powered by MejaHub", { align: "center", size: 8.2, gapAfter: 0 });

  const totalHeight =
    MARGIN_TOP +
    MARGIN_BOTTOM +
    ops.reduce((sum, op) => sum + op.size + op.gapAfter, 0);

  const pageHeight = Math.max(320, totalHeight + 6);
  const page: PDFPage = pdf.addPage([PAGE_WIDTH, pageHeight]);
  let y = pageHeight - MARGIN_TOP;

  for (const op of ops) {
    if (op.type === "text") {
      const textWidth = op.font.widthOfTextAtSize(op.text, op.size);
      const x =
        op.align === "center"
          ? MARGIN_X + (CONTENT_WIDTH - textWidth) / 2
          : op.align === "right"
            ? PAGE_WIDTH - MARGIN_X - textWidth
            : MARGIN_X;

      page.drawText(op.text, {
        x,
        y,
        size: op.size,
        font: op.font,
        color: rgb(0, 0, 0),
      });

      y -= op.size + op.gapAfter;
      continue;
    }

    page.drawText(op.left, {
      x: MARGIN_X,
      y,
      size: op.size,
      font: op.leftFont,
      color: rgb(0, 0, 0),
    });

    const rightWidth = op.rightFont.widthOfTextAtSize(op.right, op.size);
    page.drawText(op.right, {
      x: PAGE_WIDTH - MARGIN_X - rightWidth,
      y,
      size: op.size,
      font: op.rightFont,
      color: rgb(0, 0, 0),
    });

    y -= op.size + op.gapAfter;
  }

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}
