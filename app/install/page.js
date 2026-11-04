import Link from "next/link";
import Logo from "@/components/Logo";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Install the app — Red Lions" };

export default async function InstallPage() {
  const { t } = await getT();

  const groups = [
    { key: "install.iphone", icon: "🍎" },
    { key: "install.android", icon: "🤖" },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          {t("common.backHome")}
        </Link>
        <div className="mt-4">
          <Logo width={110} />
        </div>
        <h1 className="mt-2 text-4xl font-bold">📲 {t("install.title")}</h1>
        <p className="mt-3 text-neutral-300">{t("install.intro")}</p>

        <div className="mt-8 space-y-4">
          {groups.map((g) => (
            <section
              key={g.key}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <h2 className="text-lg font-semibold text-red-500">
                {g.icon} {t(g.key)}
              </h2>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-neutral-300">
                {[1, 2, 3].map((n) => (
                  <li key={n}>{t(`${g.key}.${n}`)}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <p className="mt-6 text-sm text-neutral-400">{t("install.note")}</p>
      </div>
    </main>
  );
}