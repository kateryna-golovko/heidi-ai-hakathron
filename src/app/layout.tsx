import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heidi Autopilot - Clinical RPA System",
  description: "Automated clinical documentation workflow system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
