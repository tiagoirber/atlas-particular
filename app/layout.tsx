import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Azeret_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PwaRegister } from "@/components/pwa-register";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const azeretMono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)",  color: "#1a1816" },
  ],
};

export const metadata: Metadata = {
  title: "Atlas Particular",
  description:
    "Acervo pessoal de viagens. Registro privado de destinos, dias, atrações e fotos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Atlas",
  },
  icons: {
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
    icon:  [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "Atlas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${libreBaskerville.variable} ${azeretMono.variable}`} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <Header />
            {children}
            <Footer />
          </ThemeProvider>
        </AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
