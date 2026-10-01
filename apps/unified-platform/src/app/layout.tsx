import { Syne, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-display" });
const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata = {
  title: "Shaurya Operations",
  description: "Role-based QR assignment and food verification platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${beVietnamPro.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
export const viewport = {
  themeColor: "#f9f9f9",
};
