import { PackageType, ScannedPackage, Session } from '@/types/session';

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
  return {
    shopee: packages.filter(p => p.type === 'shopee').length,
    mercadoLivre: packages.filter(p => p.type === 'mercado_livre').length,
    avulsos: packages.filter(p => p.type === 'avulso').length,
    total: packages.length,
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
• Shopee: ${metrics.shopee}
• Mercado Livre: ${metrics.mercadoLivre}
• Avulsos: ${metrics.avulsos}
• Total Conferido: ${metrics.total}
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
