import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewsForm from "../NewsForm";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const announcement = db
    .prepare("SELECT * FROM announcements WHERE id = ?")
    .get(Number(id));
  if (!announcement) notFound();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/news" className="text-sm text-red-400 hover:underline">
          ← Announcements
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Edit announcement</h1>
        <div className="mt-6">
          <NewsForm announcement={announcement} />
        </div>
      </div>
    </main>
  );
}