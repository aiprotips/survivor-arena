/// <reference types="@cloudflare/workers-types" />

import { getTelegramLinkForUser } from "./_shared/account-flows";
import { json } from "./_shared/http";
import { getSessionUser } from "./_shared/session";

type Env = {
  DB: D1Database;
};

const protectedPaths = new Set([
  "/admin",
  "/area-personale",
  "/arena",
  "/dashboard",
  "/impostazioni",
  "/movimenti",
  "/posta",
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

function isUnsafeMethod(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function isSameOriginMutation(request: Request, url: URL) {
  const origin = request.headers.get("Origin");

  if (origin) {
    try {
      return new URL(origin).origin === url.origin;
    } catch {
      return false;
    }
  }

  const secFetchSite = request.headers.get("Sec-Fetch-Site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site" && secFetchSite !== "none") {
    return false;
  }

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      return new URL(referer).origin === url.origin;
    } catch {
      return false;
    }
  }

  return true;
}

function applySecurityHeaders(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  const url = new URL(request.url);

  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.telegram.org",
    ].join("; "),
  );
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  if (url.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  try {
    if (
      url.pathname.startsWith("/api/") &&
      isUnsafeMethod(context.request.method) &&
      !isSameOriginMutation(context.request, url)
    ) {
      return applySecurityHeaders(
        context.request,
        json(
          {
            message: "Richiesta non autorizzata.",
            ok: false,
          },
          { status: 403 },
        ),
      );
    }

    if (!isProtectedPath(url.pathname)) {
      return applySecurityHeaders(context.request, await context.next());
    }

    if (!context.env.DB) {
      return applySecurityHeaders(context.request, Response.redirect(new URL("/login", url), 302));
    }

    const session = await getSessionUser(context.env.DB, context.request);

    if (!session) {
      return applySecurityHeaders(context.request, Response.redirect(new URL("/login", url), 302));
    }

    if (
      normalizePath(url.pathname).startsWith("/admin") &&
      session.user.role !== "admin"
    ) {
      return applySecurityHeaders(context.request, Response.redirect(new URL("/dashboard", url), 302));
    }

    const normalizedPath = normalizePath(url.pathname);
    if (
      session.user.role !== "admin" &&
      normalizedPath !== "/verifica-telegram"
    ) {
      const telegramLink = await getTelegramLinkForUser(context.env.DB, session.user.id);

      if (!telegramLink || !telegramLink.phone_verified_at) {
        return applySecurityHeaders(context.request, Response.redirect(new URL("/verifica-telegram", url), 302));
      }
    }

    return applySecurityHeaders(context.request, await context.next());
  } catch {
    const response = url.pathname.startsWith("/api/")
      ? json({ message: "Errore interno. Riprova tra poco.", ok: false }, { status: 500 })
      : new Response("Errore interno. Riprova tra poco.", {
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        status: 500,
      });

    return applySecurityHeaders(context.request, response);
  }
};
