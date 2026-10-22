"use client";

import { useState } from "react";

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
    >
      {copied ? "Copied ✓" : "Copy for WeChat"}
    </button>
  );
}