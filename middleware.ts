import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const ipHits = new Map<string, number[]>();
let upstashRatelimit: Ratelimit | null | undefined;

function runLocalRatelimit(ip: string) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const nextHits = (ipHits.get(ip) ?? []).filter((value) => value >= windowStart);
  nextHits.push(now);
  ipHits.set(ip, nextHits);
  return nextHits.length <= 10;
}

function getRatelimit() {
  if (upstashRatelimit !== undefined) {
    return upstashRatelimit;
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    upstashRatelimit = null;
    return upstashRatelimit;
  }

  try {
    upstashRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
    });
  } catch {
    upstashRatelimit = null;
  }

  return upstashRatelimit;
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  let success = false;

  const ratelimit = getRatelimit();
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(ip);
      success = result.success;
    } catch {
      success = runLocalRatelimit(ip);
    }
  } else {
    success = runLocalRatelimit(ip);
  }

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Slow down." },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
