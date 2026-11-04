import { Geist, Cairo } from "next/font/google";
import "./globals.css";
import { getLang, getDictionary } from "@/lib/i18n";
import I18nProvider from "@/components/I18nProvider";
import LanguageSwitch from "@/components/LanguageSwitch";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Arabic font, downloaded when the site is built and served from your own server
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

export const metadata = {
  title: "Red Lions — Jinzhou",
  description:
    "Official website of Red Lions, a Moroccan football team in Jinzhou, China.",
  applicationName: "Red Lions",
  appleWebApp: {
    capable: true,
    title: "Red Lions",
    statusBarStyle: "black",
  },
};

export const viewport = {
  themeColor: "#04140c",
};

export default async function RootLayout({ children }) {
  const lang = await getLang();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} className={`${geistSans.variable} ${cairo.variable}`}>
      <body className="min-h-screen antialiased">
        <I18nProvider lang={lang} dict={getDictionary(lang)}>
          <LanguageSwitch lang={lang} />
          {children}
        </I18nProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}