import { PackageType } from '@/types/scanner';
import { ScannedPackage, Session } from '@/types/session';

// Valores de cada pacote por marketplace
const PACKAGE_VALUES: Record<PackageType, number> = {
  'shopee': 6,
  'mercado_livre': 8,
  'avulso': 8,
  'unknown': 0,
};

export function getPackageValue(type: PackageType): number {
  return PACKAGE_VALUES[type] || 0;
}

export function classifyPackage(code: string): PackageType {
  const normalized = (code ?? '').trim();
  const cleaned = normalized.replace(/[^0-9a-zA-Z]/g, '');
  let upper = cleaned.toUpperCase();

  // Alguns leitores inserem prefixo "ID" antes do número (ex. "ID20000…").
  // Para evitar classificação errada como avulso, removemos o "ID" quando
  // é seguido por dígito, espelhando a normalização usada em
  // scannerIdentification.normalizeCode.
  if (/^ID(?=\d)/.test(upper)) {
    upper = upper.slice(2);
  }

  if (upper.startsWith('BR')) {
    return 'shopee';
  }

  if (upper.startsWith('20000')) {
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
    case 'unknown': return 'Desconhecido';
    default: return 'Desconhecido';
  }
}

export function packageTypeBadgeColors(type: PackageType): { bg: string; text: string } {
  switch (type) {
    case 'shopee': return { bg: '#ff5722', text: '#fff' };
    case 'mercado_livre': return { bg: '#ffe600', text: '#333' };
    case 'avulso': return { bg: '#64748b', text: '#fff' };
    case 'unknown': return { bg: '#94a3b8', text: '#fff' };
    default: return { bg: '#94a3b8', text: '#fff' };
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
  const percentualVerificacao = session.declaredCount > 0 
    ? ((metrics.total / session.declaredCount) * 100).toFixed(0)
    : '0';
  const divergenciaValor = metrics.total - session.declaredCount;
  
  const statusHeader = hasDivergence
    ? `⚠️  *RELATÓRIO COM DIVERGÊNCIA*`
    : `✅ *CONFORMIDADE TOTAL*`;

  const divergenceInfo = hasDivergence
    ? `● Pacotes Conferidos: ${metrics.total} | Declarados: ${session.declaredCount}
● Diferença: ${divergenciaValor > 0 ? '+' : ''}${divergenciaValor} pacotes
● Conformidade: ${percentualVerificacao}%`
    : `● Pacotes Conferidos: ${metrics.total}
● Pacotes Declarados: ${session.declaredCount}
● Conformidade: 100%`;

  return `${statusHeader}

*IDENTIFICAÇÃO*
● Data: ${formatDate(session.startedAt)}
● Horário: ${formatTimestamp(session.startedAt)}${session.completedAt ? ` às ${formatTimestamp(session.completedAt)}` : ''}
● Operador: ${session.operatorName}
● Motorista: ${session.driverName}

*DISTRIBUIÇÃO DE PACOTES*
🟠 Shopee: ${metrics.shopee} unid. | R$ ${metrics.valueShopee.toFixed(2).replace('.', ',')}
🟡 Mercado Livre: ${metrics.mercadoLivre} unid. | R$ ${metrics.valueMercadoLivre.toFixed(2).replace('.', ',')}
🔵 Avulsos: ${metrics.avulsos} unid. | R$ ${metrics.valueAvulsos.toFixed(2).replace('.', ',')}

*RESUMO EXECUTIVO*
● Total: ${metrics.total} pacotes | R$ ${metrics.valueTotal.toFixed(2).replace('.', ',')}
${divergenceInfo}`;
}

// Counter para garantir unicidade em chamadas rápidas
let idCounter = 0;

export function generateId(): string {
  // Usa timestamp de alta precisão + counter para evitar duplicações
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const counter = (++idCounter).toString(36);
  return `${timestamp.toString(36)}-${counter}-${random}`;
}
