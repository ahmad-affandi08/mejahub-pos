import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lobster_Two } from "next/font/google";
import { Favicon } from "@/components/ui/favicon";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster-two",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MejaHub - Cloud POS & F&B Ecosystem",
  description:
    "Sistem Cloud POS & Ekosistem F&B 100% Paperless untuk Kafe, Restoran, Quick Service, dan Dine-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        <Providers>
          <Favicon />
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
