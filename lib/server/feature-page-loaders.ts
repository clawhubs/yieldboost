import "server-only";

import { headers } from "next/headers";
import type {
  AnalyticsResponse,
  HistoryResponse,
  OpportunitiesResponse,
  PortfolioSummaryResponse,
  SettingsResponse,
  StrategiesResponse,
  WatchlistResponse,
} from "@/lib/backend-data";
import { featurePageConfigs } from "@/lib/feature-pages";
import {
  mapAnalyticsApiToFeatureConfig,
  mapHistoryApiToFeatureConfig,
  mapOpportunitiesApiToFeatureConfig,
  mapPortfolioApiToFeatureConfig,
  mapSettingsApiToFeatureConfig,
  mapStrategiesApiToFeatureConfig,
  mapWatchlistApiToFeatureConfig,
} from "@/lib/server/feature-page-mappers";

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

  const response = await fetch(`${appUrl}${path}`, {
    cache: "no-store",
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
    const data = await fetchRouteJson<WatchlistResponse>("/api/watchlist");
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
