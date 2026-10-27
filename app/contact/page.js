import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact — Red Lions" };

export default function ContactPage() {
  const s = getSettings();

  const socials = [
    { label: "Instagram", icon: "📸", href: s.instagram_url },
    { label: "Facebook", icon: "👍", href: s.facebook_url },
    { label: "TikTok", icon: "🎵", href: s.tiktok_url },
    { label: "YouTube", icon: "▶️", href: s.youtube_url },
  ].filter((x) => x.href);

  const whatsappDigits = s.whatsapp.replace(/\D/g, "");
  const hasContact = s.wechat_id || s.whatsapp || s.email;

  const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-5";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Contact 📬</h1>
        {s.contact_note && (
          <p className="mt-3 whitespace-pre-wrap text-neutral-300">{s.contact_note}</p>
        )}

        {hasContact && (
          <div className="mt-8 space-y-3">
            {s.wechat_id && (
              <div className={card}>
                <div className="text-xs text-neutral-500">💬 WeChat</div>
                <div className="mt-1 text-lg font-semibold">{s.wechat_id}</div>
              </div>
            )}
            {s.whatsapp && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block hover:border-red-600 ${card}`}
              >
                <div className="text-xs text-neutral-500">📱 WhatsApp</div>
                <div className="mt-1 text-lg font-semibold">{s.whatsapp}</div>
              </a>
            )}
            {s.email && (
              <a
                href={`mailto:${s.email}`}
                className={`block hover:border-red-600 ${card}`}
              >
                <div className="text-xs text-neutral-500">✉️ Email</div>
                <div className="mt-1 text-lg font-semibold">{s.email}</div>
              </a>
            )}
          </div>
        )}

        {socials.length > 0 && (
          <>
            <h2 className="mt-10 text-xl font-semibold text-red-500">Follow us</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600"
                >
                  {x.icon} {x.label}
                </a>
              ))}
            </div>
          </>
        )}

        {!hasContact && socials.length === 0 && (
          <p className="mt-8 text-neutral-500">Contact details coming soon.</p>
        )}
      </div>
    </main>
  );
}