"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_MB = 100;
const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

export default function ClipForm() {
  const router = useRouter();
  const formRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    const data = new FormData(form);
    const file = data.get("clip");

    if (!file || !file.size) return setMessage({ error: "Choose a video." });
    if (file.size > MAX_MB * 1024 * 1024) {
      return setMessage({
        error: `That video is over ${MAX_MB} MB. Trim it or record at a lower quality.`,
      });
    }

    const params = new URLSearchParams({
      caption: String(data.get("caption") || ""),
      visibility: String(data.get("visibility") || "public"),
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload-clip?${params}`);

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((100 * ev.loaded) / ev.total));
    };
    xhr.onload = () => {
      setProgress(null);
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        setMessage({ ok: "Video uploaded ✓" });
        form.reset();
        router.refresh();
      } else {
        setMessage({ error: body.error || "Upload failed." });
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setMessage({ error: "Connection problem. Please try again." });
    };

    setMessage(null);
    setProgress(0);
    xhr.send(file);
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      <h2 className="text-lg font-semibold text-red-500">🎞️ Upload a short clip</h2>
      <p className="mt-1 text-xs text-neutral-500">
        MP4, MOV or WebM, up to {MAX_MB} MB. Tip: record at 720p to keep files small.
      </p>

      <label className="mt-4 block text-sm text-neutral-400">Video file</label>
      <input
        type="file"
        name="clip"
        accept="video/mp4,video/quicktime,video/webm"
        required
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">Title / caption</label>
      <input name="caption" placeholder="e.g. Saad's free kick vs Dragons FC" className={input} />

      <label className="mt-4 block text-sm text-neutral-400">Who can see it?</label>
      <select name="visibility" defaultValue="public" className={input}>
        <option value="public">🌍 Public (everyone)</option>
        <option value="players">🔒 Players only</option>
      </select>

      {progress !== null && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-neutral-400">Uploading... {progress}%</p>
        </div>
      )}

      {message?.error && <p className="mt-4 text-sm text-red-400">{message.error}</p>}
      {message?.ok && <p className="mt-4 text-sm text-green-400">{message.ok}</p>}

      <button
        type="submit"
        disabled={progress !== null}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {progress !== null ? "Uploading..." : "Upload clip"}
      </button>
    </form>
  );
}