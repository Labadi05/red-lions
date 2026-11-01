import { setLanguage } from "@/app/lang-actions";

export default function LanguageSwitch({ lang }) {
  const other = lang === "ar" ? "en" : "ar";

  return (
    <form action={setLanguage} className="lang-switch fixed end-3 top-3 z-50">
      <input type="hidden" name="lang" value={other} />
      <button className="rounded-full border border-neutral-700 bg-neutral-900/90 px-4 py-1.5 text-sm text-neutral-200 backdrop-blur hover:border-gold">
        🌐 {lang === "ar" ? "English" : "العربية"}
      </button>
    </form>
  );
}