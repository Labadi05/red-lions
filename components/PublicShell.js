import Link from "next/link";
import Logo from "@/components/Logo";
import { getT } from "@/lib/i18n";

const nav = [
  ["/about", "nav.about"],
  ["/news", "nav.news"],
  ["/fixtures", "nav.fixtures"],
  ["/stats", "nav.stats"],
  ["/gallery", "nav.gallery"],
  ["/contact", "nav.contact"],
];

// The frame shared by the public pages.
//   title, subtitle: shown at the top (optional)
//   back: { href, label } for a "back" link (optional)
//   width: a Tailwind max-width class, e.g. "max-w-3xl"
export default async function PublicShell({
  title,
  subtitle,
  back,
  width = "max-w-5xl",
  children,
}) {
  const { t } = await getT();

  return (
    <main className="rl-shell relative isolate min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="rl-blob rl-blob-green" aria-hidden />
      <div className="rl-blob rl-blob-red" aria-hidden />

      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 pe-36">
          <Link href="/" className="flex items-center gap-3" aria-label="Red Lions">
            <Logo width={40} />
            <span className="font-black tracking-wide" dir="ltr">
              RED <span className="text-red-500">LIONS</span>
            </span>
          </Link>
          <nav className="ms-auto hidden gap-1 md:flex">
            {nav.map(([href, key]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className={`mx-auto ${width} px-6 pb-20 pt-10`}>
        {back && (
          <Link href={back.href} className="text-sm text-red-400 hover:underline">
            {back.label}
          </Link>
        )}

        {title && (
          <div className="rl-fade-up mt-4">
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-red-600 to-emerald-500" />
            <h1 className="mt-3 text-4xl font-black">{title}</h1>
            {subtitle && <p className="mt-2 text-neutral-300">{subtitle}</p>}
          </div>
        )}

        <div className="mt-8">{children}</div>
      </div>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto h-0.5 w-24 rounded-full bg-gradient-to-r from-red-600 via-gold to-emerald-500" />
        <p className="mt-4" dir="ltr">
          © Red Lions · Jinzhou
        </p>
      </footer>
    </main>
  );
}