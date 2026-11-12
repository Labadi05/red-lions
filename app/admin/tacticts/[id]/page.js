import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cleanBoard, emptyBoard } from "@/lib/tacticsData";
import TacticEditor from "../TacticEditor";

export const dynamic = "force-dynamic";

export default async function TacticPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  let tactic;
  if (id === "new") {
    tactic = {
      id: null,
      title: "",
      category: "formation",
      notes: "",
      event_id: null,
      published: 0,
      board: emptyBoard(),
    };
  } else {
    const row = db.prepare("SELECT * FROM tactics WHERE id = ?").get(Number(id));
    if (!row) notFound();
    tactic = {
      id: row.id,
      title: row.title,
      category: row.category,
      notes: row.notes,
      event_id: row.event_id,
      published: row.published,
      board: cleanBoard(row.data) ?? emptyBoard(),
    };
  }

  const players = db
    .prepare("SELECT id, number, name, position FROM players ORDER BY CAST(number AS INTEGER)")
    .all();
  const matches = db
    .prepare(
      "SELECT id, title, starts_at FROM events WHERE type = 'match' ORDER BY starts_at DESC LIMIT 25"
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/tactics" className="text-sm text-red-400 hover:underline">
          ← Tactics
        </Link>
        <h1 className="mt-3 mb-6 text-3xl font-bold">
          {tactic.id ? "Edit tactic" : "New tactic"}
        </h1>
        <TacticEditor tactic={tactic} players={players} matches={matches} />
      </div>
    </main>
  );
}