import Link from "next/link";
import Logo from "@/components/Logo";

const links = [
  ["/about", "About"],
  ["/news", "News"],
  ["/fixtures", "Fixtures & results"],
  ["/stats", "Player stats"],
  ["/gallery", "Gallery"],
  ["/contact", "Contact"],
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 py-12 text-center text-white">
      <h1 className="sr-only">Red Lions Jinzhou</h1>
      <Logo width={230} priority />

      <p className="mt-6 text-neutral-400">Moroccan football team · Jinzhou, China</p>

      <Link
        href="/squad"
        className="mt-8 rounded-full bg-red-600 px-7 py-3 font-semibold text-white hover:bg-red-500"
      >
        Meet the squad
      </Link>

      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-neutral-800 px-4 py-1.5 text-sm text-neutral-300 hover:border-gold hover:text-white"
          >
            {label}
          </Link>
        ))}
      </div>

      <Link href="/login" className="mt-8 text-sm text-gold hover:text-white">
        Players&apos; login
      </Link>
    </main>
  );
}