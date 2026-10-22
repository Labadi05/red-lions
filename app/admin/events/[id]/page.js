import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import EventForm from "../EventForm";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(Number(id));
  if (!event) notFound();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/events" className="text-sm text-red-400 hover:underline">
          ← Events
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Edit event</h1>
        <div className="mt-6">
          <EventForm event={event} />
        </div>
      </div>
    </main>
  );
}