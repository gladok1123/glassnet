import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const appFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GlassNet",
  description: "Соцсеть в стиле Liquid Glass",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${appFont.variable} h-full`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <div className="mesh-bg" aria-hidden />
        <div className="mesh-orbs" aria-hidden />
        <AuthProvider>
          <main className="app-shell relative z-10 mx-auto h-full w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
