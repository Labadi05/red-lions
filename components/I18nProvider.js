"use client";

import { createContext, useContext } from "react";
import { translate } from "@/lib/i18n/translate";

const I18nContext = createContext({ lang: "en", dict: {} });

export default function I18nProvider({ lang, dict, children }) {
  return <I18nContext.Provider value={{ lang, dict }}>{children}</I18nContext.Provider>;
}

// In a client component: const t = useT();  then  t("login.title")
export function useT() {
  const { dict } = useContext(I18nContext);
  return (key, vars) => translate(dict, key, vars);
}

export function useLang() {
  return useContext(I18nContext).lang;
}