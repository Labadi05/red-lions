import PublicShell from "@/components/PublicShell";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Install the app — Red Lions" };

export default async function InstallPage() {
  const { t } = await getT();

  const groups = [
    { key: "install.iphone", icon: "🍎", accent: "!border-t-red-600" },
    { key: "install.android", icon: "🤖", accent: "!border-t-emerald-500" },
  ];

  return (
    <PublicShell
      title={`📲 ${t("install.title")}`}
      subtitle={t("install.intro")}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        {groups.map((g) => (
          <section
            key={g.key}
            className={`rl-reveal rounded-xl border border-neutral-800 border-t-4 bg-neutral-900 p-5 ${g.accent}`}
          >
            <h2 className="text-lg font-bold">
              {g.icon} {t(g.key)}
            </h2>
            <ol className="mt-3 space-y-3">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-start gap-3 text-neutral-200">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black">
                    {n}
                  </span>
                  <span className="pt-0.5">{t(`${g.key}.${n}`)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-neutral-300">{t("install.note")}</p>
    </PublicShell>
  );
}