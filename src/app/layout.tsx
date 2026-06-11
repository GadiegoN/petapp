import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://petapp-orcin.vercel.app"),

  title: {
    default: "Mundo Pet Comunitário",
    template: "%s | Mundo Pet Comunitário",
  },

  description:
    "Plataforma comunitária para acompanhamento de cães de rua, pontos de apoio, adoção, resgate, petshops parceiros e gestão animal.",

  keywords: [
    "cães de rua",
    "adoção de cães",
    "resgate animal",
    "petshop",
    "mundo pet",
    "mapa de cães",
    "pontos de apoio animal",
    "ONG animal",
    "animais desaparecidos",
    "proteção animal",
  ],

  authors: [
    {
      name: "Mundo Pet Comunitário",
    },
  ],

  creator: "Mundo Pet Comunitário",

  publisher: "Mundo Pet Comunitário",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://mundopet.com.br",
    siteName: "Mundo Pet Comunitário",
    title: "Mundo Pet Comunitário",
    description:
      "Plataforma comunitária para acompanhamento de cães de rua, pontos de apoio, adoção e parceiros.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mundo Pet Comunitário",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mundo Pet Comunitário",
    description:
      "Plataforma comunitária para acompanhamento de cães de rua, adoção e pontos de apoio.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  category: "animals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <AuthProvider>{children}</AuthProvider>
        <AppToaster />
      </body>
    </html>
  );
}