import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lifting Trust - Control de Inventario",
  description: "Sistema de gestión operativa, control de inventario y despacho omnicanal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-primary-text">
        <link rel="icon" href="/logos/logo-mark.svg" />
        <link rel="apple-touch-icon" href="/logos/logo-mark.svg" />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
