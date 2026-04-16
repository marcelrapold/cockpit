import path from 'path';
import { pathToFileURL } from 'url';
import type { NextRequest } from 'next/server';

type LegacyHandler = (req: LegacyRequest, res: LegacyResponse) => unknown | Promise<unknown>;

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

function buildMockReq(request: NextRequest): LegacyRequest {
  const url = new URL(request.url);
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  return {
    method: request.method,
    query,
    headers,
  };
}

function buildMockRes(): {
  res: LegacyResponse;
  finalize: () => { statusCode: number; headers: Record<string, string>; body: unknown; ended: boolean };
} {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body: unknown;
  let ended = false;

  const res: LegacyResponse = {
    setHeader(name: string, value: string | number) {
      headers[String(name)] = String(value);
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: unknown) {
      body = data;
      return res;
    },
    end() {
      ended = true;
      return res;
    },
  };

  return {
    res,
    finalize: () => ({ statusCode, headers, body, ended }),
  };
}

export async function runLegacyApi(relPath: string, request: NextRequest) {
  const abs = path.join(process.cwd(), 'api', relPath);
  const mod = (await import(pathToFileURL(abs).href)) as {
    default?: LegacyHandler;
  };
  const handler = (mod.default ?? mod) as LegacyHandler;
  const mockReq = buildMockReq(request);
  const { res: mockRes, finalize } = buildMockRes();

  await handler(mockReq, mockRes);

  const { statusCode, headers, body, ended } = finalize();
  const hdrs = new Headers();
  Object.entries(headers).forEach(([k, v]) => hdrs.set(k, v));

  if (ended && body === undefined) {
    return new Response(null, { status: statusCode, headers: hdrs });
  }
  return Response.json(body, { status: statusCode, headers: hdrs });
}
