import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyBazaar - Student Marketplace",
  description: "The premier trusted marketplace for students across Northern Cyprus universities",
  keywords: "student marketplace, Northern Cyprus, university, buy, sell, trade",
  authors: [{ name: "MyBazaar Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
