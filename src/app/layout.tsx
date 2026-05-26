import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#b45309',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Sistem Gereja",
  description: "Sistem manajemen gereja digital untuk mengelola jemaat, ibadah, keuangan, acara, dan kehadiran.",
  icons: {
    icon: [
      { url: '/api/church-favicon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/api/church-favicon', type: 'image/png' },
    ],
  },
  manifest: '/api/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sistem Gereja',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
