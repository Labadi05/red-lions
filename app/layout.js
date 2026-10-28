import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Red Lions — Jinzhou",
  description:
    "Official website of Red Lions, a Moroccan football team in Jinzhou, China.",
};

export const viewport = {
  themeColor: "#04140c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}