import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import PublicHomeLink from "@/components/public-home-link";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "connected AI",
  description: "School assistant for 1ere Ecole Officielle - Jbeil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        {children}
        <PublicHomeLink />
      </body>
    </html>
  );
}
