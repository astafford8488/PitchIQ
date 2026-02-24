import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "PitchIQ",
  description: "AI-powered podcast guest outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${dmSans.variable} font-sans min-h-screen bg-[var(--bg)] text-[var(--text)]`}>
        {children}
      </body>
    </html>
  );
}
