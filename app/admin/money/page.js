import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getBalances, getCharges, getPaymentInfo } from "@/lib/money";
import { CATEGORIES, formatMoney } from "@/lib/moneyFormat";
import { ChargeForm, PaymentInfoForm } from "./MoneyForms";
import CopyButton from "../news/CopyButton";
import { setPaid, markAllPaid, deleteCharge } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMoneyPage() {
  await requireAdmin();

  const players = db
    .prepare("SELECT id, number, name FROM players ORDER BY CAST(number AS INTEGER)")
    .all();
  const balances = getBalances();
  const charges = getCharges();
  const paymentInfo = getPaymentInfo();

  const owing = balances.filter((b) => b.owed > 0);
  const totalOwed = balances.reduce((s, b) => s + b.owed, 0);
  const totalPaid = balances.reduce((s, b) => s + b.paid, 0);
  const claims = charges.reduce((s, c) => s + c.claims, 0);

  const reminder =
    `🦁 RED LIONS\n\n💰 Payments still due:\n` +
    owing.map((b) => `${b.number} ${b.name}: ${formatMoney(b.owed)}`).join("\n") +
    `\n\nSee details in your portal on the website.`;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Money 💰</h1>
        <p className="mt-2 text-neutral-400">
          Track pitch rental, water, fines and who has paid. Each player only sees their own
          payments.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Outstanding", formatMoney(totalOwed), "text-red-500"],
            ["Collected", formatMoney(totalPaid), "text-green-400"],
            ["Players owing", owing.length, ""],
            ["To confirm", claims, claims > 0 ? "text-gold" : ""],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center"
            >
              <div className={`text-3xl font-black ${color}`}>{value}</div>
              <div className="mt-1 text-xs text-neutral-400">{label}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Who owes what</h2>
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          {owing.length === 0 ? (
            <p className="text-neutral-400">Everyone is up to date 🎉</p>
          ) : (
            <>
              <ul className="space-y-1 text-sm">
                {owing.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <span className="w-8 font-black text-red-600">{b.number}</span>
                    <span className="flex-1">{b.name}</span>
                    <span className="font-semibold">{formatMoney(b.owed)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <CopyButton text={reminder} />
              </div>
            </>
          )}
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">New charge</h2>
        <div className="mt-4">
          <ChargeForm players={players} />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Payment details</h2>
        <div className="mt-4">
          <PaymentInfoForm current={paymentInfo} />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">All charges</h2>
        <div className="mt-4 space-y-3">
          {charges.length === 0 && <p className="text-neutral-500">No charges yet.</p>}
          {charges.map((c) => (
            <details
              key={c.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <summary className="cursor-pointer">
                <span className="inline-flex flex-wrap items-center gap-3 align-middle">
                  <span className="text-xl">{CATEGORIES[c.category].icon}</span>
                  <span className="font-semibold">{c.title}</span>
                  <span className="text-sm text-neutral-400">
                    {formatMoney(c.collected)} of {formatMoney(c.total)} collected
                  </span>
                  {c.claims > 0 && (
                    <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
                      ⏳ {c.claims} to confirm
                    </span>
                  )}
                </span>
              </summary>

              {c.reason && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{c.reason}</p>
              )}
              {c.due_at && <p className="mt-1 text-xs text-neutral-500">Due {c.due_at}</p>}

              <div className="mt-4 space-y-2">
                {c.items.map((i) => (
                  <div
                    key={i.player_id}
                    className="flex flex-wrap items-center gap-3 text-sm"
                  >
                    <span className="w-8 font-black text-red-600">{i.number}</span>
                    <span className="min-w-[8rem] flex-1">{i.name}</span>
                    <span className="font-semibold">{formatMoney(i.amount_cents)}</span>
                    {i.paid_at ? (
                      <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs text-green-300">
                        ✅ Paid {i.paid_at.slice(0, 10)}
                      </span>
                    ) : i.claimed_at ? (
                      <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
                        ⏳ says paid
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        Unpaid
                      </span>
                    )}
                    <form action={setPaid}>
                      <input type="hidden" name="chargeId" value={c.id} />
                      <input type="hidden" name="playerId" value={i.player_id} />
                      <input type="hidden" name="paid" value={i.paid_at ? "0" : "1"} />
                      <button className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600">
                        {i.paid_at ? "Undo" : "Mark paid"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <form action={markAllPaid}>
                  <input type="hidden" name="chargeId" value={c.id} />
                  <button className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600">
                    Mark all paid
                  </button>
                </form>
                <form action={deleteCharge} className="ml-auto">
                  <input type="hidden" name="chargeId" value={c.id} />
                  <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                    Delete charge
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}