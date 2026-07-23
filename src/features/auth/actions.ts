"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(128);

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : fallback;
}

function authErrorUrl(path: string, code: string) {
  return `${path}?fejl=${encodeURIComponent(code)}`;
}

export async function signInAction(formData: FormData) {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    redirect(authErrorUrl("/auth/log-ind", "ugyldige-felter"));
  }

  const { error } = await auth.signIn.email(parsed.data);

  if (error) {
    redirect(authErrorUrl("/auth/log-ind", "login-fejlede"));
  }

  redirect(safeReturnTo(formData.get("returnTo"), "/mine-annoncer"));
}

export async function signUpAction(formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(60),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    redirect(authErrorUrl("/auth/opret", "ugyldige-felter"));
  }

  const { error } = await auth.signUp.email(parsed.data);

  if (error) {
    redirect(authErrorUrl("/auth/opret", "oprettelse-fejlede"));
  }

  redirect("/profil?ny=1");
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/");
}

