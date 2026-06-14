/// <reference types="@cloudflare/workers-types" />

export type ApiErrorResponse<TField extends string = string> = {
  details?: string[];
  field?: TField;
  message: string;
  ok: false;
};

export type ApiSuccessResponse<TData extends Record<string, unknown>> = TData & {
  ok: true;
};

export function json<TData extends Record<string, unknown>>(
  data: ApiSuccessResponse<TData> | ApiErrorResponse,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export async function readJsonObject(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function methodNotAllowed() {
  return json(
    {
      message: "Metodo non consentito.",
      ok: false,
    },
    { status: 405 },
  );
}

export function missingDatabase() {
  return json(
    {
      message: "Database D1 non disponibile.",
      ok: false,
    },
    { status: 500 },
  );
}
