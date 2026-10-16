import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://repo-quest-five.vercel.app";
const description =
  "Paste a public GitHub repo and get three guided developer quests with real issues, steps, and success criteria.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RepoQuest – guided quests for any GitHub repo",
  description,
  openGraph: {
    title: "RepoQuest",
    description,
    url: siteUrl,
    siteName: "RepoQuest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoQuest",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
