import type { Metadata, Viewport } from "next";
import { Roboto, Montserrat } from "next/font/google";
import { PwaManager } from "@/components/pwa/PwaManager";
import "./globals.css";

const roboto = Roboto({ 
  weight: ['400', '500', '700', '900'],
  subsets: ["latin"], 
  variable: "--font-body" 
});

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  variable: "--font-display" 
});

export const metadata: Metadata = {
  applicationName: "Shaurya Operations",
  title: {
    default: "Shaurya Operations",
    template: "%s · Shaurya Operations",
  },
  description: "Role-based QR assignment and food verification platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shaurya",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#964900",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${roboto.variable} min-h-screen antialiased overflow-x-hidden`}>
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
