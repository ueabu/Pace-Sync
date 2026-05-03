import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pacelist",
    template: "%s · Pacelist",
  },
  description:
    "Map a Spotify playlist to your race pace so the right song lands on the mile you care about.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAuthed = session.status === "authed";

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>
          <AppShell isAuthed={isAuthed}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
