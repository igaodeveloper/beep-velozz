export type PackageType = 'shopee' | 'mercado_livre' | 'avulso';

export interface ScannedPackage {
  id: string;
  code: string;
  type: PackageType;
  scannedAt: string; // ISO timestamp
}

export interface Session {
  id: string;
  operatorName: string;
  driverName: string;
  declaredCount: number;
  packages: ScannedPackage[];
  startedAt: string;
  completedAt?: string;
  hasDivergence: boolean;
}

export interface SessionMetrics {
  shopee: number;
  mercadoLivre: number;
  avulsos: number;
  total: number;
}
