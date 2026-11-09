import Link from "next/link";
import Logo from "@/components/Logo";
import PublicShell from "@/components/PublicShell";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "About — Red Lions" };

export default async function AboutPage() {
  const { t } = await getT();
  const s = getSettings();

  return (
    <PublicShell
      title={
        <>
          {t("about.title")} <span className="text-red-500">{t("about.brand")}</span>
        </>
      }
      subtitle={t("home.tagline")}
      width="max-w-2xl"
    >
      <div className="rl-fade-up rl-d2 flex justify-center">
        <div className="rl-float">
          <Logo width={150} />
        </div>
      </div>

      <div className="mt-8 whitespace-pre-wrap leading-relaxed text-neutral-200">
        {s.about_text || t("about.soon")}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/squad"
          className="rl-shine rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold hover:bg-red-500"
        >
          {t("home.meetSquad")}
        </Link>
        <Link
          href="/contact"
          className="rounded-full border-2 border-emerald-500 px-6 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950"
        >
          {t("about.contactUs")}
        </Link>
      </div>
    </PublicShell>
  );
}