import { Session, OperatorStats } from "@/types/session";

export function estimateCompletionTime(
  processedPackages: number,
  remainingPackages: number,
  historicalSessions: Session[],
): number {
  if (processedPackages <= 0 || historicalSessions.length === 0) {
    return remainingPackages * 1.5; // fallback estimate
  }

  const averageRate = historicalSessions
    .map((session) => session.packages.length / Math.max(1, (new Date(session.completedAt || new Date()).getTime() - new Date(session.startedAt).getTime()) / 60000))
    .reduce((sum, rate) => sum + rate, 0) / historicalSessions.length;

  const safeRate = Math.max(averageRate, 0.5);
  return remainingPackages / safeRate;
}

export function calculateOperatorStats(
  historicalSessions: Session[],
): OperatorStats[] {
  const operatorRecords: Record<string, OperatorStats> = {};

  historicalSessions.forEach((session) => {
    const name = session.operatorName;
    const durationMinutes = Math.max(
      1,
      (new Date(session.completedAt || new Date()).getTime() - new Date(session.startedAt).getTime()) / 60000,
    );
    const ratePerMinute = session.packages.length / durationMinutes;
    const accuracyScore = Math.max(80, Math.min(100, 100 - (session.hasDivergence ? 5 : 0)));

    if (!operatorRecords[name]) {
      operatorRecords[name] = {
        name,
        totalSessions: 0,
        totalPackages: 0,
        avgRatePerMinute: 0,
        errorRate: 0,
        avgResponseTime: durationMinutes,
        preferredMarketplace: session.packages[0]?.type || "avulso",
        accuracyScore,
      };
    }

    const record = operatorRecords[name];
    record.totalSessions += 1;
    record.totalPackages += session.packages.length;
    record.avgRatePerMinute =
      (record.avgRatePerMinute * (record.totalSessions - 1) + ratePerMinute) / record.totalSessions;
    record.errorRate = Math.max(0, record.errorRate + (session.hasDivergence ? 10 : 0));
    record.avgResponseTime =
      (record.avgResponseTime * (record.totalSessions - 1) + durationMinutes) / record.totalSessions;
    record.preferredMarketplace = session.packages[0]?.type || record.preferredMarketplace;
    record.accuracyScore = Math.max(80, Math.min(100, (record.accuracyScore + accuracyScore) / 2));
  });

  return Object.values(operatorRecords);
}
