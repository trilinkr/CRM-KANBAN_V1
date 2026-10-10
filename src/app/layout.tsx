import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriLinkr Workspace",
  description: "Internal work management for TriLinkr Private Limited.",
  icons: {
    icon: [{ url: "/trilinkr-seal.png", type: "image/png" }],
    apple: "/trilinkr-seal.png",
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
