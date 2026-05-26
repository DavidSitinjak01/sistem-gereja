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
    icon: '/api/favicon?v=1',
    apple: '/api/favicon?v=1',
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
      <head>
        <link rel="icon" href="/api/favicon?v=1" />
        <link rel="apple-touch-icon" href="/api/favicon?v=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
