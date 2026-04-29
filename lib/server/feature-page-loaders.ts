import "server-only";

import { cookies, headers } from "next/headers";
import type {
  AnalyticsResponse,
  HistoryResponse,
  OpportunitiesResponse,
  PortfolioSummaryResponse,
  SettingsResponse,
  StrategiesResponse,
  WatchlistResponse,
} from "@/lib/backend-data";
import { buildWatchlistFromState } from "@/lib/backend-data";
import { featurePageConfigs } from "@/lib/feature-pages";
import { getLivePortfolioSnapshot } from "@/lib/server/live-portfolio";
import {
  mapAnalyticsApiToFeatureConfig,
  mapHistoryApiToFeatureConfig,
  mapOpportunitiesApiToFeatureConfig,
  mapPortfolioApiToFeatureConfig,
  mapSettingsApiToFeatureConfig,
  mapStrategiesApiToFeatureConfig,
  mapWatchlistApiToFeatureConfig,
} from "@/lib/server/feature-page-mappers";
import { getSettingsState, getStoredProofs } from "@/lib/server/runtime-store";
import {
  JUDGE_MODE_COOKIE_KEY,
  resolveWalletAddress,
  resolveWalletNetworkKey,
  sameWalletAddress,
  WALLET_COOKIE_KEY,
  WALLET_NETWORK_COOKIE_KEY,
} from "@/lib/wallet";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function resolveAppUrl() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    const proto =
      headerStore.get("x-forwarded-proto") ??
      (host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    return `${proto}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }

  return null;
}

async function fetchRouteJson<T>(path: string) {
  const appUrl = await resolveAppUrl();
  if (!appUrl) {
    throw new Error(`Unable to resolve app URL for ${path}`);
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  const response = await fetch(`${appUrl}${path}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return (await response.json()) as T;
}

export async function getPortfolioPageConfig() {
  try {
    const data = await fetchRouteJson<PortfolioSummaryResponse>(
      "/api/portfolio/summary",
    );
    return mapPortfolioApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.portfolio;
  }
}

export async function getStrategiesPageConfig() {
  try {
    const data = await fetchRouteJson<StrategiesResponse>("/api/strategies");
    return mapStrategiesApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.strategies;
  }
}

export async function getOpportunitiesPageConfig() {
  try {
    const data = await fetchRouteJson<OpportunitiesResponse>(
      "/api/opportunities",
    );
    return mapOpportunitiesApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.opportunities;
  }
}

export async function getHistoryPageConfig() {
  try {
    const data = await fetchRouteJson<HistoryResponse>("/api/history");
    return mapHistoryApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.history;
  }
}

export async function getAnalyticsPageConfig() {
  try {
    const data = await fetchRouteJson<AnalyticsResponse>("/api/analytics");
    return mapAnalyticsApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.analytics;
  }
}

export async function getWatchlistPageConfig() {
  try {
    const cookieStore = await cookies();
    const judgeMode = cookieStore.get(JUDGE_MODE_COOKIE_KEY)?.value === "true";
    const walletAddress = resolveWalletAddress(cookieStore.get(WALLET_COOKIE_KEY)?.value);
    const networkKey = resolveWalletNetworkKey(
      cookieStore.get(WALLET_NETWORK_COOKIE_KEY)?.value,
    );
    const [portfolio, settings, proofs] = await Promise.all([
      getLivePortfolioSnapshot(walletAddress, networkKey, {
        preferProofSnapshot: judgeMode,
      }),
      getSettingsState(),
      getStoredProofs(),
    ]);
    const scopedProofs = walletAddress
      ? proofs.filter((proof) => sameWalletAddress(proof.walletAddress, walletAddress))
      : [];
    const data: WatchlistResponse = buildWatchlistFromState(
      scopedProofs,
      settings,
      portfolio,
    );
    return mapWatchlistApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.watchlist;
  }
}

export async function getSettingsPageConfig() {
  try {
    const data = await fetchRouteJson<SettingsResponse>("/api/settings");
    return mapSettingsApiToFeatureConfig(data);
  } catch {
    return featurePageConfigs.settings;
  }
}
