export interface LiveData {
  totalPortfolio: number;
  currentApy: number;
  optimizedApy: number;
  yieldIncreasePct: number;
  estimatedAnnualGain: number;
  confidence: number;
}

export interface GlobalStatsData {
  hasData: boolean;
  formatted: {
    users: string;
    computeJobs: string;
    tvl: string;
    recentJobs24h: string;
    protocols: string;
  };
}
