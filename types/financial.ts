/**
 * Financial Calculation Types
 * Tipos para sistema de cálculo financeiro e ROI
 */

export interface FinancialMetrics {
  totalValue: number;
  totalPackages: number;
  averageValuePerPackage: number;
  sessionValue: number;
  hourlyRate: number;
  dailyEarnings: number;
  monthlyProjection: number;
  efficiency: number;
}

export interface PackageValueConfig {
  shopee: number;
  mercadoLivre: number;
  avulso: number;
  bonusThresholds: {
    accuracy: { threshold: number; bonus: number }[];
    speed: { threshold: number; bonus: number }[];
    volume: { threshold: number; bonus: number }[];
  };
  penalties: {
    error: number;
    divergence: number;
    timeout: number;
  };
}

export interface SessionFinancials {
  sessionId: string;
  operatorId: string;
  startTime: number;
  endTime?: number;
  duration: number; // em minutos
  packages: {
    shopee: number;
    mercadoLivre: number;
    avulso: number;
    total: number;
  };
  baseValue: number;
  bonuses: {
    accuracy: number;
    speed: number;
    streak: number;
    volume: number;
    special: number;
  };
  penalties: {
    errors: number;
    divergences: number;
    timeouts: number;
  };
  totalValue: number;
  hourlyRate: number;
  efficiency: number;
  roi: number;
}

export interface OperatorFinancialSummary {
  operatorId: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  totalSessions: number;
  totalPackages: number;
  totalEarnings: number;
  averagePerSession: number;
  averageHourlyRate: number;
  topEarningDay: {
    date: number;
    earnings: number;
    packages: number;
  };
  bonuses: {
    accuracy: number;
    speed: number;
    volume: number;
    special: number;
    total: number;
  };
  deductions: {
    errors: number;
    penalties: number;
    total: number;
  };
  netEarnings: number;
  growthRate: number;
  efficiency: number;
}

export interface ROIAnalysis {
  investment: {
    training: number;
    equipment: number;
    software: number;
    time: number;
  };
  returns: {
    productivity: number;
    accuracy: number;
    speed: number;
    savings: number;
  };
  metrics: {
    paybackPeriod: number; // em dias
    roiPercentage: number;
    netPresentValue: number;
    internalRateOfReturn: number;
  };
  projections: {
    monthly: number[];
    yearly: number[];
    breakEvenPoint: number;
  };
}

export interface FinancialReport {
  id: string;
  type: "session" | "operator" | "team" | "period";
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    efficiency: number;
  };
  details: {
    byOperator: OperatorFinancialSummary[];
    byPackageType: {
      shopee: { count: number; value: number };
      mercadoLivre: { count: number; value: number };
      avulso: { count: number; value: number };
    };
    byTimeSlot: {
      morning: { revenue: number; packages: number };
      afternoon: { revenue: number; packages: number };
      evening: { revenue: number; packages: number };
    };
  };
  trends: {
    revenue: number[];
    efficiency: number[];
    accuracy: number[];
    speed: number[];
  };
  insights: string[];
  recommendations: string[];
}

export interface CostBreakdown {
  fixed: {
    salary: number;
    equipment: number;
    software: number;
    overhead: number;
  };
  variable: {
    perPackage: number;
    bonuses: number;
    penalties: number;
    training: number;
  };
  total: number;
}

export interface RevenueProjection {
  timeframe: "week" | "month" | "quarter" | "year";
  scenarios: {
    conservative: {
      packages: number;
      revenue: number;
      growth: number;
    };
    realistic: {
      packages: number;
      revenue: number;
      growth: number;
    };
    optimistic: {
      packages: number;
      revenue: number;
      growth: number;
    };
  };
  assumptions: {
    averagePackageValue: number;
    accuracyRate: number;
    speedRate: number;
    workingDays: number;
    hoursPerDay: number;
  };
}

export interface FinancialKPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change: number;
  changePercent: number;
  status: "good" | "warning" | "critical";
}
