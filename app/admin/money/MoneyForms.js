"use client";

import { useActionState } from "react";
import { CATEGORIES } from "@/lib/moneyFormat";
import { createCharge, savePaymentInfo } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";
const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-5";

export function ChargeForm({ players }) {
  const [state, formAction, pending] = useActionState(createCharge, null);

  return (
    <form action={formAction} className={card}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-neutral-400">Category</label>
          <select name="category" defaultValue="pitch" className={input}>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <option key={key} value={key}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Due date (optional)</label>
          <input type="date" name="due_at" className={input} />
        </div>
      </div>

      <label className="mt-4 block text-sm text-neutral-400">Title</label>
      <input
        name="title"
        required
        placeholder="e.g. Pitch rental, Thursday 29 Oct"
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">
        Reason (the player sees this)
      </label>
      <textarea
        name="reason"
        rows={2}
        placeholder="e.g. 2 hours at the school pitch"
        className={input}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-neutral-400">Amount (¥)</label>
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="40"
            className={input}
          />
        </div>
        <div className="flex flex-col justify-end gap-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="each" defaultChecked />
            This amount for each player
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="split" />
            Split this total between the players
          </label>
        </div>
      </div>

      <p className="mt-5 text-sm text-neutral-400">Who pays</p>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="audience" value="all" defaultChecked />
          Everyone
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="audience" value="selected" />
          Selected players
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {players.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="to" value={p.id} />
            <span className="font-black text-red-600">{p.number}</span> {p.name}
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        The player checkboxes are ignored when you choose &quot;Everyone&quot;.
      </p>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create charge"}
      </button>
    </form>
  );
}

export function PaymentInfoForm({ current }) {
  const [state, formAction, pending] = useActionState(savePaymentInfo, null);

  return (
    <form action={formAction} className={card}>
      <label className="block text-sm text-neutral-400">
        How players should pay (shown in their portal)
      </label>
      <textarea
        name="payment_info"
        rows={3}
        defaultValue={current}
        placeholder="e.g. WeChat Pay or Alipay to Ayoub (phone number ...). Then tap 'I've paid'."
        className={input}
      />
      {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-3 text-sm text-green-400">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}