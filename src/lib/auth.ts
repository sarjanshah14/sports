import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// One committee account: a single password in the ADMIN_PASSWORD env var.
// The cookie holds an HMAC of a fixed string keyed by that password, so changing
// the password logs everyone out.
// ponytail: no rate limit on login; add one if the password ever gets guessed at.

const COOKIE = "hsw_admin";

function token() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set.");
  return createHmac("sha256", pw).update("hsw-admin-v1").digest("hex");
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function isAdmin() {
  const c = cookies().get(COOKIE)?.value;
  return !!c && same(c, token());
}

export function requireAdmin() {
  if (!isAdmin()) redirect("/admin/login");
}

export function checkPassword(pw: string) {
  const real = process.env.ADMIN_PASSWORD ?? "";
  return !!real && same(createHmac("sha256", "cmp").update(pw).digest("hex"), createHmac("sha256", "cmp").update(real).digest("hex"));
}

export function setSession() {
  cookies().set(COOKIE, token(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export function clearSession() {
  cookies().delete(COOKIE);
}
