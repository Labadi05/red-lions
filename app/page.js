import Link from "next/link";

const links = [
  ["/about", "About"],
  ["/news", "News"],
  ["/fixtures", "Fixtures & results"],
  ["/stats", "Player stats"],
  ["/contact", "Contact"],
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-white">
      <div className="text-7xl">🦁</div>
      <h1 className="mt-4 text-5xl font-black tracking-tight">
        RED <span className="text-red-600">LIONS</span>
      </h1>
      <p className="mt-3 text-neutral-400">
        Moroccan football team · Jinzhou, China
      </p>

      <Link
        href="/squad"
        className="mt-8 rounded-full bg-red-600 px-6 py-3 font-semibold hover:bg-red-500"
      >
        Meet the squad
      </Link>

      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:border-red-600 hover:text-white"
          >
            {label}
          </Link>
        ))}
      </div>

      <Link
        href="/login"
        className="mt-8 text-sm text-neutral-500 hover:text-white"
      >
        Players&apos; login →
      </Link>
    </main>
  );
}