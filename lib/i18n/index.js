import { cookies, headers } from "next/headers";
import { translate } from "./translate";
import enCommon from "./en-common";
import arCommon from "./ar-common";
import enPublic from "./en-public";
import arPublic from "./ar-public";

const en = { ...enCommon, ...enPublic };
const ar = { ...arCommon, ...arPublic };

// Which language this visitor sees: their saved choice, else their browser language
export async function getLang() {
  const saved = (await cookies()).get("lang")?.value;
  if (saved === "en" || saved === "ar") return saved;

  const accept = ((await headers()).get("accept-language") || "").toLowerCase();
  return accept.startsWith("ar") ? "ar" : "en";
}

// Arabic falls back to English for any text that has not been translated yet
export function getDictionary(lang) {
  return lang === "ar" ? { ...en, ...ar } : en;
}

// For server pages: const { t, lang } = await getT();
export async function getT() {
  const lang = await getLang();
  const dict = getDictionary(lang);
  return { lang, t: (key, vars) => translate(dict, key, vars) };
}