export type PackageType = 'shopee' | 'mercado_livre' | 'avulso';

export interface ScannedPackage {
  id: string;
  code: string;
  type: PackageType;
  value: number; // Valor em reais
  scannedAt: string; // ISO timestamp
  photoUri?: string; // URI da foto (para divergências)
}

export interface Session {
  id: string;
  operatorName: string;
  driverName: string;
  declaredCount: number;
  declaredCounts: {
    shopee: number;
    mercadoLivre: number;
    avulso: number;
  };
  packages: ScannedPackage[];
  startedAt: string;
  completedAt?: string;
  hasDivergence: boolean;
  // Novos campos avançados
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  ratePerMinute?: number; // pacotes/minuto
  anomalyScore?: number; // 0-1, que tão anômalo é
  estimatedMinutes?: number; // tempo estimado de conclusão
  notes?: string; // anotações livre do operador
  supervisorApproved?: boolean;
  supervisorNotes?: string;
}

export interface SessionMetrics {
  shopee: number;
  mercadoLivre: number;
  avulsos: number;
  total: number;
  valueShopee: number;
  valueMercadoLivre: number;
  valueAvulsos: number;
  valueTotal: number;
}

export interface OperatorStats {
  name: string;
  totalSessions: number;
  totalPackages: number;
  avgRatePerMinute: number;
  errorRate: number; // % de divergências
  avgResponseTime: number; // minutos para conferir
  preferredMarketplace: PackageType;
  accuracyScore: number; // 0-100
}
