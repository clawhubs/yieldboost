"use client";

import { useEffect, useState } from "react";
import AgentCard from "./AgentCard";

interface Strategy {
  tokenId: number;
  encryptedUri: string;
  contentHash: string;
  apy: number;
  timestamp: string;
  creator: string;
  verified: boolean;
  owner: string;
}

export default function AgentGallery() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStrategies() {
      try {
        setLoading(true);
        const response = await fetch("/api/agent/list", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load strategies");
        }
        const data = await response.json();
        if (data.success) {
          setStrategies(data.strategies);
        } else {
          setError(data.error || "Failed to load strategies");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadStrategies();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#22ddd0] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Deploy the YieldStrategyINFT contract to view agents
          </p>
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">No agents minted yet</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Complete an optimization to mint your first agent
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {strategies.map((strategy) => (
        <AgentCard
          key={strategy.tokenId}
          tokenId={strategy.tokenId}
          apy={strategy.apy}
          creator={strategy.creator}
          verified={strategy.verified}
          timestamp={strategy.timestamp}
          owner={strategy.owner}
          onClick={() => {
            // TODO: Open agent details modal
            console.log("View agent:", strategy.tokenId);
          }}
        />
      ))}
    </div>
  );
}
