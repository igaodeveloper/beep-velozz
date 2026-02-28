import { PackageType, ScannedPackage, Session } from '@/types/session';

// Valores de cada pacote por marketplace
const PACKAGE_VALUES: Record<PackageType, number> = {
  'shopee': 6,
  'mercado_livre': 8,
  'avulso': 8,
};

export function getPackageValue(type: PackageType): number {
  return PACKAGE_VALUES[type] || 0;
}

export function classifyPackage(code: string): PackageType {
  const normalized = (code ?? '').trim();
  const cleaned = normalized.replace(/[^0-9a-zA-Z]/g, '');
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('BR')) {
    return 'shopee';
  }

  if (upper.startsWith('20000') || upper.startsWith('46') || upper.startsWith('45')) {
    return 'mercado_livre';
  }

  if (upper.startsWith('LM')) {
    return 'avulso';
  }

  if (upper.startsWith('SP') || upper.includes('SHOPEE') || /^[0-9]{20}$/.test(cleaned)) {
    return 'shopee';
  }

  if (
    upper.startsWith('ML') ||
    upper.includes('MELI') ||
    upper.includes('MERCADO') ||
    /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(cleaned)
  ) {
    return 'mercado_livre';
  }
  return 'avulso';
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function packageTypeLabel(type: PackageType): string {
  switch (type) {
    case 'shopee': return 'Shopee';
    case 'mercado_livre': return 'Mercado Livre';
    case 'avulso': return 'Avulso';
  }
}

export function packageTypeBadgeColors(type: PackageType): { bg: string; text: string } {
  switch (type) {
    case 'shopee': return { bg: '#ff5722', text: '#fff' };
    case 'mercado_livre': return { bg: '#ffe600', text: '#333' };
    case 'avulso': return { bg: '#64748b', text: '#fff' };
  }
}

export function getSessionMetrics(packages: ScannedPackage[]) {
  const shopeePackages = packages.filter(p => p.type === 'shopee');
  const mercadoLivrePackages = packages.filter(p => p.type === 'mercado_livre');
  const avulsoPackages = packages.filter(p => p.type === 'avulso');
  
  // ensure value is defined for backwards compatibility
  const safeValue = (p: ScannedPackage) => (typeof p.value === 'number' ? p.value : getPackageValue(p.type));

  return {
    shopee: shopeePackages.length,
    mercadoLivre: mercadoLivrePackages.length,
    avulsos: avulsoPackages.length,
    total: packages.length,
    valueShopee: shopeePackages.reduce((acc, p) => acc + safeValue(p), 0),
    valueMercadoLivre: mercadoLivrePackages.reduce((acc, p) => acc + safeValue(p), 0),
    valueAvulsos: avulsoPackages.reduce((acc, p) => acc + safeValue(p), 0),
    valueTotal: packages.reduce((acc, p) => acc + safeValue(p), 0),
  };
}

export function formatWhatsAppMessage(session: Session): string {
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;
  const divergenceText = hasDivergence
    ? `⚠️ DIVERGÊNCIA: ${session.packages.length} conferidos / ${session.declaredCount} declarados (Δ ${session.packages.length - session.declaredCount})`
    : '✅ Sem divergências';

  return `📦 *CONFERÊNCIA DE PACOTES*
━━━━━━━━━━━━━━━━
🗓️ Data: ${formatDate(session.startedAt)}
👤 Operador: ${session.operatorName}
🚚 Motorista: ${session.driverName}
━━━━━━━━━━━━━━━━
📊 *RESUMO*
• Shopee: ${metrics.shopee} (R$ ${metrics.valueShopee.toFixed(2)})
• Mercado Livre: ${metrics.mercadoLivre} (R$ ${metrics.valueMercadoLivre.toFixed(2)})
• Avulsos: ${metrics.avulsos} (R$ ${metrics.valueAvulsos.toFixed(2)})
• Total Conferido: ${metrics.total} (R$ ${metrics.valueTotal.toFixed(2)})
• Total Declarado: ${session.declaredCount}
━━━━━━━━━━━━━━━━
${divergenceText}
━━━━━━━━━━━━━━━━
🕐 Início: ${formatTimestamp(session.startedAt)}
${session.completedAt ? `🕐 Fim: ${formatTimestamp(session.completedAt)}` : ''}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
