import Link from "next/link";
import Logo from "@/components/Logo";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "About — Red Lions" };

export default async function AboutPage() {
  const { t } = await getT();
  const s = getSettings();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          {t("common.backHome")}
        </Link>
        <div className="mt-4">
          <Logo width={140} />
        </div>
        <h1 className="mt-2 text-4xl font-bold">
          {t("about.title")} <span className="text-red-600">{t("about.brand")}</span>
        </h1>
        <p className="mt-2 text-neutral-400">{t("home.tagline")}</p>

        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-neutral-300">
          {s.about_text || t("about.soon")}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/squad"
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            {t("home.meetSquad")}
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600"
          >
            {t("about.contactUs")}
          </Link>
        </div>
      </div>
    </main>
  );
}