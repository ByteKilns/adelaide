import type { Metadata } from "next";
import { Geist_Mono, Host_Grotesk } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Couple Budget Planner",
  description: "A private, cloud-synced budgeting app for two partners",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${hostGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
