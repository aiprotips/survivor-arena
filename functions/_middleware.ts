/// <reference types="@cloudflare/workers-types" />

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

  return context.next();
};
