import { formatCurrency } from "@/lib/utils";

interface ReceiptItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  subtotal: number;
  modifiers?: { name: string; price: number }[];
}

interface ReceiptData {
  orderNumber: string;
  branchName: string;
  tableName: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  serviceRate: number;
  serviceAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: string;
  paidAmount?: number;
  changeAmount?: number;
  createdAt: Date;
}

/**
 * Format receipt text for WhatsApp message
 */
export function formatReceiptText(receipt: ReceiptData): string {
  const lines: string[] = [];

  lines.push(`🧾 *${receipt.branchName}*`);
  lines.push(`─────────────────`);
  lines.push(`No: ${receipt.orderNumber}`);
  lines.push(`Meja: ${receipt.tableName}`);
  lines.push(`Pelanggan: ${receipt.customerName}`);
  lines.push(
    `Tanggal: ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(receipt.createdAt)}`
  );
  lines.push(`─────────────────`);
  lines.push(``);

  // Items
  for (const item of receipt.items) {
    const name = item.variantName
      ? `${item.name} (${item.variantName})`
      : item.name;
    lines.push(`${item.quantity}x ${name}`);
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        lines.push(
          `   + ${mod.name}${mod.price > 0 ? ` ${formatCurrency(mod.price)}` : ""}`
        );
      }
    }
    lines.push(`   ${formatCurrency(item.subtotal)}`);
  }

  lines.push(``);
  lines.push(`─────────────────`);
  lines.push(`Subtotal: ${formatCurrency(receipt.subtotal)}`);

  if (receipt.discountAmount > 0) {
    lines.push(`Diskon: -${formatCurrency(receipt.discountAmount)}`);
  }

  lines.push(`PB1 (${receipt.taxRate}%): ${formatCurrency(receipt.taxAmount)}`);
  lines.push(
    `Service (${receipt.serviceRate}%): ${formatCurrency(receipt.serviceAmount)}`
  );
  lines.push(`─────────────────`);
  lines.push(`*TOTAL: ${formatCurrency(receipt.totalAmount)}*`);

  if (receipt.paymentMethod) {
    lines.push(``);
    lines.push(`Bayar: ${receipt.paymentMethod}`);
    if (receipt.paidAmount) {
      lines.push(`Diterima: ${formatCurrency(receipt.paidAmount)}`);
    }
    if (receipt.changeAmount && receipt.changeAmount > 0) {
      lines.push(`Kembalian: ${formatCurrency(receipt.changeAmount)}`);
    }
  }

  lines.push(``);
  lines.push(`Terima kasih! 🙏`);
  lines.push(`Powered by MejaHub`);

  return lines.join("\n");
}

/**
 * Build WhatsApp URL for sending e-receipt
 */
export function buildWhatsAppReceiptUrl(
  phone: string,
  receipt: ReceiptData
): string {
  // Normalize Indonesian phone numbers
  let normalizedPhone = phone.replace(/[^\d+]/g, "");
  if (normalizedPhone.startsWith("08")) {
    normalizedPhone = "62" + normalizedPhone.slice(1);
  } else if (normalizedPhone.startsWith("+62")) {
    normalizedPhone = normalizedPhone.slice(1);
  }

  const text = formatReceiptText(receipt);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Payment method display labels
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Tunai",
    QRIS: "QRIS",
    DEBIT_CARD: "Kartu Debit",
    CREDIT_CARD: "Kartu Kredit",
    E_WALLET: "E-Wallet",
    TRANSFER: "Transfer Bank",
  };
  return labels[method] || method;
}
