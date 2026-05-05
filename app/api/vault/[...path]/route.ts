import { NextRequest, NextResponse } from "next/server";

const DEFAULT_INTEGRITY_API_BASE = "https://api.yieldboostai.xyz";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function getIntegrityApiBase() {
  return (
    process.env.INTEGRITY_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_INTEGRITY_API_BASE_URL?.trim() ||
    DEFAULT_INTEGRITY_API_BASE
  ).replace(/\/$/, "");
}

function getIntegrityApiKey() {
  return process.env.INTEGRITY_API_KEY?.trim() || "";
}

function forwardHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const walletAddress = request.headers.get("x-wallet-address");
  const requestId = request.headers.get("x-request-id");
  const apiKey = getIntegrityApiKey();

  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (walletAddress) headers.set("x-wallet-address", walletAddress);
  if (requestId) headers.set("x-request-id", requestId);
  if (apiKey) headers.set("x-api-key", apiKey);

  return headers;
}

async function proxyIntegrityRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstreamPath = `/${path.join("/")}`;
  const upstreamUrl = new URL(`${getIntegrityApiBase()}${upstreamPath}`);
  upstreamUrl.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const upstream = await fetch(upstreamUrl, {
    method,
    headers: forwardHeaders(request),
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  const requestId = upstream.headers.get("x-request-id");
  const retryAfter = upstream.headers.get("retry-after");

  if (contentType) responseHeaders.set("content-type", contentType);
  if (requestId) responseHeaders.set("x-request-id", requestId);
  if (retryAfter) responseHeaders.set("retry-after", retryAfter);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyIntegrityRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyIntegrityRequest(request, context);
}
