import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "About — Red Lions" };

export default function AboutPage() {
  const s = getSettings();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <div className="mt-4 text-5xl">🦁</div>
        <h1 className="mt-2 text-4xl font-bold">
          About <span className="text-red-600">Red Lions</span>
        </h1>
        <p className="mt-2 text-neutral-400">Moroccan football team · Jinzhou, China</p>

        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-neutral-300">
          {s.about_text || "Our story is coming soon."}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/squad"
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            Meet the squad
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}