/// <reference types="@cloudflare/workers-types" />

import { getTelegramLinkForUser } from "./_shared/account-flows";
import { getSessionUser } from "./_shared/session";

type Env = {
  DB: D1Database;
};

const protectedPaths = new Set([
  "/admin",
  "/area-personale",
  "/arena",
  "/arene",
  "/classifiche",
  "/dashboard",
  "/impostazioni",
  "/movimenti",
  "/premi-utente",
  "/profilo",
  "/verifica-telegram",
]);

function normalizePath(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

function isProtectedPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);

  return [...protectedPaths].some(
    (path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`),
  );
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  if (!isProtectedPath(url.pathname)) {
    return context.next();
  }

  if (!context.env.DB) {
    return Response.redirect(new URL("/login", url), 302);
  }

  const session = await getSessionUser(context.env.DB, context.request);

  if (!session) {
    return Response.redirect(new URL("/login", url), 302);
  }

  if (
    normalizePath(url.pathname).startsWith("/admin") &&
    session.user.role !== "admin"
  ) {
    return Response.redirect(new URL("/dashboard", url), 302);
  }

  const normalizedPath = normalizePath(url.pathname);
  if (
    session.user.role !== "admin" &&
    normalizedPath !== "/verifica-telegram"
  ) {
    const telegramLink = await getTelegramLinkForUser(context.env.DB, session.user.id);

    if (!telegramLink || !telegramLink.phone_verified_at) {
      return Response.redirect(new URL("/verifica-telegram", url), 302);
    }
  }

  return context.next();
};
