"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLanguage(formData) {
  const lang = formData.get("lang") === "ar" ? "ar" : "en";

  (await cookies()).set("lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}