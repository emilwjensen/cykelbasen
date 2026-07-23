import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) {
  throw new Error("NEON_AUTH_BASE_URL er ikke konfigureret.");
}

if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error("NEON_AUTH_COOKIE_SECRET skal være mindst 32 tegn.");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 300,
    sameSite: "lax",
  },
  logLevel: "warn",
});

export async function getCurrentUser() {
  const { data } = await auth.getSession();
  return data?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/log-ind");
  }

  return user;
}

