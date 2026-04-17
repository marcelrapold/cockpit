import type { NextRequest } from 'next/server';

export type LegacyRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | undefined>;
};

type LegacyResponse = {
  setHeader(name: string, value: string | number): void;
  status(code: number): LegacyResponse;
  json(body: unknown): LegacyResponse;
  end(): LegacyResponse;
};

type LegacyHandler = (req: LegacyRequest, res: LegacyResponse) => unknown | Promise<unknown>;

export async function adaptLegacy(
  handlerLike: LegacyHandler | { default?: LegacyHandler },
  request: NextRequest,
) {
  const handler = (
    typeof handlerLike === 'function' ? handlerLike : handlerLike.default
  ) as LegacyHandler;

  const url = new URL(request.url);
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((v, k) => { query[k] = v; });
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

  const mockReq: LegacyRequest = { method: request.method, query, headers };

  let statusCode = 200;
  const respHeaders: Record<string, string> = {};
  let body: unknown;
  let ended = false;

  const mockRes: LegacyResponse = {
    setHeader(name, value) { respHeaders[String(name)] = String(value); },
    status(code) { statusCode = code; return mockRes; },
    json(data) { body = data; return mockRes; },
    end() { ended = true; return mockRes; },
  };

  await handler(mockReq, mockRes);

  const hdrs = new Headers();
  Object.entries(respHeaders).forEach(([k, v]) => hdrs.set(k, v));

  if (ended && body === undefined) {
    return new Response(null, { status: statusCode, headers: hdrs });
  }
  return Response.json(body, { status: statusCode, headers: hdrs });
}
