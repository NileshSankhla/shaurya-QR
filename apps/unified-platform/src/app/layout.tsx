import { Roboto, Montserrat } from "next/font/google";
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
      <body className={`${montserrat.variable} ${roboto.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
export const viewport = {
  themeColor: "#f9f9f9",
};
