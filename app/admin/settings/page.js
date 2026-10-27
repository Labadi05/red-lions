import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = getSettings();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Site info ⚙️</h1>
        <p className="mt-2 text-neutral-400">
          Social links, contact details and the team story shown on the public site.
        </p>

        <div className="mt-8">
          <SettingsForm settings={settings} />
        </div>
      </div>
    </main>
  );
}