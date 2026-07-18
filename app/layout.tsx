import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PocketDev Web",
  description: "Ship from your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
