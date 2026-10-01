
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { ChatWrapper } from "@/components/chat/chat-wrapper";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "OBSERVADOR 4D | Plataforma de Expansión de Conciencia",
  description: "Transforma tu realidad desde la perspectiva 4D. Plataforma para desarrollar conciencia de observador, manifestación estratégica y flujo dimensional.",
  keywords: ["conciencia", "manifestación", "4D", "expansión", "observador", "dimensión", "espiritualidad", "estrategia"],
  openGraph: {
    title: "OBSERVADOR 4D | Expansión de Conciencia",
    description: "Desarrolla tu conciencia de observador 4D y manifiesta desde la macrovisión",
    url: "/",
    siteName: "OBSERVADOR 4D",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OBSERVADOR 4D - Plataforma de Expansión de Conciencia",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OBSERVADOR 4D | Expansión de Conciencia",
    description: "Desarrolla tu conciencia de observador 4D y manifiesta desde la macrovisión",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-purple-900/20">
              {children}
              <ChatWrapper />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
