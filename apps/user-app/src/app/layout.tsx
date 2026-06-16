import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";

export const metadata: Metadata = {
  title: "Canovet - Pawsitive Connections",
  description: "Your pet's best friend",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐾</text></svg>',
  },
};

export const viewport: Viewport = {
  themeColor: "#A7009D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
