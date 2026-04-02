import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Portal",
  description: "PDF translation and voice transcription tools with subscription credits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-neutral-950 text-neutral-50">{children}</body>
    </html>
  );
}
