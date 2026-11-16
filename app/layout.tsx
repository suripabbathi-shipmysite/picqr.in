import "./globals.css";
import type { Metadata } from "next";
import LayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "PicQR.in - Instant Photo Delivery for Weddings via QR Code | First Event FREE",
  description: "PicQR.in - Photographers ki instant photo delivery. Wedding photos ni QR code tho guests ki same day delivery. No app needed, original quality, selfie search. First Event FREE - 12 Hours Only.",
  keywords: ["PicQR", "picqr.in", "wedding photo delivery", "QR code photo sharing", "photographer tool India", "instant photo delivery", "wedding photography QR"],
  authors: [{ name: "PicQR.in" }],
  creator: "PicQR.in",
  robots: "index, follow",
  metadataBase: new URL("https://picqr.in"),
  alternates: { canonical: "https://picqr.in" },
  openGraph: {
    title: "PicQR.in - First Event FREE - 12 Hours Only",
    description: "Instant photo delivery for weddings via QR code. No app needed, original quality.",
    url: "https://picqr.in",
    siteName: "PicQR.in",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "PicQR.in - QR Photo Delivery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PicQR.in - First Event FREE",
    description: "Instant photo delivery for weddings via QR code.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial', background: '#FFFBF8', scrollBehavior: 'smooth' }}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}