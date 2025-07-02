import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PopulationContextProvider } from "@/hooks/usePopulationData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "France Stat - Statistiques françaises interactives",
  description: "Explorez et visualisez diverses statistiques sur la France : données démographiques, économiques, régionales et plus encore.",
  metadataBase: new URL("https://france-stat.daril.fr/og.png"),
  keywords: ["France", "statistiques", "données", "visualisation", "régions", "analyses", "indicateurs"],
  authors: [{ name: "Daril DJODJO KOUTON" }],
  openGraph: {
    title: "France Stat - Statistiques françaises interactives",
    description: "Plateforme pour explorer et visualiser différentes statistiques sur la France.",
    locale: "fr_FR",
    type: "website",
    url: "https://votre-domaine.fr",
    siteName: "France Stat",
    images: [
      {
        url: "https://france-stat.daril.fr/og.png",
        width: 1200,
        height: 630,
        alt: "Aperçu France Stat",
      },
    ],
  },
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex justify-center bg-gray-950`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          // enableSystem
          disableTransitionOnChange
        >
          <PopulationContextProvider>
            {children}
          </PopulationContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
