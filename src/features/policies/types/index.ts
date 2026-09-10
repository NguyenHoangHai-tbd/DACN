export interface CirculationPolicy {
  maxItemsPerMember: number;
  maxDaysToBorrow: number;
  maxRenewals: number;
}

export interface FinePolicy {
  finePerDay: number;
  maxFinePerItem: number;
  gracePeriodDays: number;
}

export interface HoldPolicy {
  maxHoldsPerMember: number;
  holdExpirationDays: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface LibraryPolicy {
  id: string;
  tenantId: string;
  circulation: CirculationPolicy;
  fines: FinePolicy;
  holds: HoldPolicy;
  holidays?: Holiday[];
  updatedAt: string;
}

export interface AiPolicyImpact {
  summary: string;
  impactMetrics: {
    overdueRateChange: string;
    revenueChange: string;
    circulationSpeed: string;
  };
  recommendations: string[];
}
