import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center text-white">
      <div className="text-7xl"> ☆ 🦁 ☆</div>
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
      <Link href="/news" className="mt-4 text-sm text-neutral-400 hover:text-white">
        Latest news →
      </Link>
      <Link href="/fixtures" className="mt-2 text-sm text-neutral-400 hover:text-white">
        Fixtures & results →
      </Link>
      <Link href="/login" className="mt-2 text-sm text-neutral-400 hover:text-white">
        Players&apos; login →
      </Link>
    </main>
  );
}