import Link from "next/link";
import Logo from "@/components/Logo";
import { getT } from "@/lib/i18n";

const links = [
  ["/about", "nav.about"],
  ["/news", "nav.news"],
  ["/fixtures", "nav.fixtures"],
  ["/stats", "nav.stats"],
  ["/gallery", "nav.gallery"],
  ["/contact", "nav.contact"],
  ["/install", "nav.install"],
];

export default async function Home() {
  const { t } = await getT();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 py-12 text-center text-white">
      <h1 className="sr-only">{t("home.title")}</h1>
      <Logo width={230} priority />

      <p className="mt-6 text-neutral-400">{t("home.tagline")}</p>

      <Link
        href="/squad"
        className="mt-8 rounded-full bg-red-600 px-7 py-3 font-semibold text-white hover:bg-red-500"
      >
        {t("home.meetSquad")}
      </Link>

      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
        {links.map(([href, key]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:border-gold hover:text-white"
          >
            {t(key)}
          </Link>
        ))}
      </div>

      <Link href="/login" className="mt-8 text-sm text-gold hover:text-white">
        {t("nav.login")}
      </Link>
    </main>
  );
}