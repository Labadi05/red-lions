import Link from "next/link";
import Logo from "@/components/Logo";
import { getT } from "@/lib/i18n";

// The top bar, background and phone tab bar for portal pages other than the main one.
//   active: which tab to light up ("inbox" ...)
//   unread: number shown on the Inbox tab
export default async function PortalShell({
  children,
  active = "inbox",
  unread = 0,
  width = "max-w-6xl",
}) {
  const { t } = await getT();

  const tabs = [
    ["/portal", "🏠", t("portal.tab.home"), 0, "home"],
    ["/portal#events", "📅", t("portal.tab.events"), 0, "events"],
    ["/portal/inbox", "📬", t("portal.tab.inbox"), unread, "inbox"],
    ["/portal#payments", "💰", t("portal.tab.pay"), 0, "pay"],
    ["/portal#more", "☰", t("portal.tab.more"), 0, "more"],
  ];

  const topLinks = [
    ["/portal", t("portal.tab.home"), "home"],
    ["/portal#events", t("portal.tab.events"), "events"],
    ["/portal#polls", t("portal.polls"), "polls"],
    ["/portal#payments", t("portal.tab.pay"), "pay"],
    ["/portal/inbox", t("portal.inbox"), "inbox"],
  ];

  return (
    <main className="rl-locker min-h-screen text-white">
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-[#050d08]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-2.5 pe-36">
          <Link href="/" aria-label="Red Lions">
            <Logo width={36} />
          </Link>
          <span className="font-black" dir="ltr">
            RED <span className="text-red-500">LIONS</span>
          </span>
          <span className="hidden text-xs font-bold uppercase tracking-[0.25em] text-gold sm:inline">
            {t("portal.title")}
          </span>
          <nav className="ms-auto hidden items-center gap-1 lg:flex">
            {topLinks.map(([href, label, key]) => (
              <Link
                key={key}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  active === key
                    ? "bg-white/10 font-semibold text-white"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className={`mx-auto ${width} px-6 pb-28 pt-8 lg:pb-16`}>{children}</div>

      <nav className="rl-tabbar fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gold/30 bg-[#050d08]/95 backdrop-blur lg:hidden">
        {tabs.map(([href, icon, label, badge, key]) => (
          <Link
            key={key}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              active === key ? "text-gold" : "text-neutral-300"
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            {label}
            {badge > 0 && (
              <span className="absolute end-1/4 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </main>
  );
}