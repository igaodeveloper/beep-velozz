import { PackageType } from './scanner';

export interface ScannedPackage {
  id: string;
  code: string;
  type: PackageType;
  value?: number; // Optional value property for backwards compatibility
  scannedAt: string; // ISO timestamp
}

export interface Session {
  notes: any;
  id: string;
  operatorName: string;
  operatorId?: string;
  driverName: string;
  driverId?: string;
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
