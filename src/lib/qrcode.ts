import QRCode from "qrcode";

/**
 * Generate QR Code as Data URL (base64 PNG)
 */
export async function generateQRDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generate QR Code as SVG string
 */
export async function generateQRSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "H",
  });
}

/**
 * Generate QR Code as PNG Buffer
 */
export async function generateQRBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Build the QR ordering URL for a table
 */
export function buildTableQRUrl(branchId: string, tableNumber: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/order/${branchId}/${tableNumber}`;
}
