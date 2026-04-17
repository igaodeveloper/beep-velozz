import { Session } from "@/types/session";
import { getSessionMetrics } from "./session";
import { getSessionPhotos, photoToBase64 } from "./photoStorage";
import * as Print from "expo-print";
import { Share } from "react-native";

/**
 * Gera HTML para um relatório PDF profissional, minimalista e moderno
 */
function generateReportHTML(session: Session): string {
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;
  const divergenceValue = session.packages.length - session.declaredCount;

  const statusBgColor = hasDivergence ? "#fef3c7" : "#d1fae5";
  const statusTextColor = hasDivergence ? "#b45309" : "#065f46";
  const statusIcon = hasDivergence ? "⚠️" : "✅";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Conferência de Pacotes</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #f9fafb;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .status-banner {
          background-color: ${statusBgColor};
          border-left: 4px solid ${statusTextColor};
          padding: 16px 20px;
          margin: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-banner .icon {
          font-size: 24px;
        }
        
        .status-banner-text {
          flex: 1;
        }
        
        .status-banner-title {
          color: ${statusTextColor};
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .status-banner-content {
          color: ${statusTextColor};
          font-size: 13px;
        }
        
        .content {
          padding: 0 20px;
        }
        
        .section {
          margin-bottom: 24px;
        }
        
        .section-title {
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .info-item {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #d1d5db;
        }
        
        .info-label {
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #1f2937;
          font-size: 15px;
          font-weight: 700;
        }
        
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .metric-card {
          background: #f9fafb;
          padding: 14px;
          border-radius: 6px;
          text-align: center;
          border: 2px solid #e5e7eb;
          transition: all 0.2s ease;
        }
        
        .metric-card:nth-child(1) {
          border-color: #ff5722;
          background: rgba(255, 87, 34, 0.05);
        }
        
        .metric-card:nth-child(2) {
          border-color: #ffd700;
          background: rgba(255, 215, 0, 0.08);
        }
        
        .metric-card:nth-child(3) {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.05);
        }
        
        .metric-label {
          color: #6b7280;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        
        .metric-value {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        
        .metric-card:nth-child(1) .metric-value {
          color: #ff5722;
        }
        
        .metric-card:nth-child(2) .metric-value {
          color: #d97706;
        }
        
        .metric-card:nth-child(3) .metric-value {
          color: #2563eb;
        }
        
        .metric-subtitle {
          color: #9ca3af;
          font-size: 11px;
          font-weight: 600;
        }
        
        .summary-box {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          padding: 16px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .summary-box-item {
          text-align: center;
        }
        
        .summary-box-label {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .summary-box-value {
          font-size: 22px;
          font-weight: 800;
        }
        
        .package-list {
          margin-top: 16px;
        }
        
        .package-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 12px;
        }
        
        .package-item:last-child {
          border-bottom: none;
        }
        
        .package-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        }
        
        .package-badge.shopee {
          background-color: rgba(255, 87, 34, 0.15);
          color: #ff5722;
        }
        
        .package-badge.ml {
          background-color: rgba(255, 215, 0, 0.2);
          color: #d97706;
        }
        
        .package-badge.avulso {
          background-color: rgba(37, 99, 235, 0.15);
          color: #2563eb;
        }
        
        .package-with-photo {
          margin-bottom: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .package-photo {
          width: 100%;
          height: auto;
          max-height: 400px;
          border-radius: 6px;
          margin-top: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .photo-label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 8px;
          text-align: center;
        }
        
        .footer {
          background: #f9fafb;
          padding: 16px 20px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
        }
        
        .page-break {
          page-break-after: always;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Relatório de Conferência</h1>
          <p>Sistema Beep Velozz - Conferência de Pacotes</p>
        </div>
        
        <div class="status-banner">
          <div class="icon">${statusIcon}</div>
          <div class="status-banner-text">
            <div class="status-banner-title">
              ${hasDivergence ? "Relatório com Divergência" : "Conformidade Total"}
            </div>
            <div class="status-banner-content">
              ${metrics.total} pacotes conferidos / ${session.declaredCount} declarados
              ${hasDivergence ? `(Diferença: ${divergenceValue > 0 ? "+" : ""}${divergenceValue})` : ""}
            </div>
          </div>
        </div>
        
        <div class="content">
          <!-- Identificação -->
          <div class="section">
            <div class="section-title">Identificação</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data</div>
                <div class="info-value">${new Date(session.startedAt).toLocaleDateString("pt-BR")}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Operador</div>
                <div class="info-value">${session.operatorName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Motorista</div>
                <div class="info-value">${session.driverName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Sessão ID</div>
                <div class="info-value">${session.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          <!-- Resumo Executivo -->
          <div class="section">
            <div class="summary-box">
              <div class="summary-box-item">
                <div class="summary-box-label">Total Conferido</div>
                <div class="summary-box-value">${metrics.total}</div>
              </div>
              <div class="summary-box-item">
                <div class="summary-box-label">Valor Total</div>
                <div class="summary-box-value">R$ ${metrics.valueTotal.toFixed(2).replace(".", ",")}</div>
              </div>
              <div class="summary-box-item">
                <div class="summary-box-label">Conformidade</div>
                <div class="summary-box-value">${hasDivergence ? ((metrics.total / session.declaredCount) * 100).toFixed(0) : "100"}%</div>
              </div>
            </div>
          </div>
          
          <!-- Distribuição de Pacotes -->
          <div class="section">
            <div class="section-title">Distribuição de Pacotes</div>
            <div class="metrics-row">
              <div class="metric-card">
                <div class="metric-label">🟠 Shopee</div>
                <div class="metric-value">${metrics.shopee}</div>
                <div class="metric-subtitle">R$ ${metrics.valueShopee.toFixed(2).replace(".", ",")}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">🟡 Mercado Livre</div>
                <div class="metric-value">${metrics.mercadoLivre}</div>
                <div class="metric-subtitle">R$ ${metrics.valueMercadoLivre.toFixed(2).replace(".", ",")}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">🔵 Avulsos</div>
                <div class="metric-value">${metrics.avulsos}</div>
                <div class="metric-subtitle">R$ ${metrics.valueAvulsos.toFixed(2).replace(".", ",")}</div>
              </div>
            </div>
          </div>
          
          <!-- Listagem de Pacotes -->
          ${
            session.packages.length > 0
              ? `
          <div class="section">
            <div class="section-title">Pacotes Conferenciados (${session.packages.length})</div>
            <div class="package-list">
              ${session.packages
                .map(
                  (pkg, idx) => `
                <div class="package-item">
                  <div>
                    <span>#${idx + 1}</span>
                    <span class="package-badge ${pkg.type === "shopee" ? "shopee" : pkg.type === "mercado_livre" ? "ml" : "avulso"}">
                      ${pkg.type === "shopee" ? "Shopee" : pkg.type === "mercado_livre" ? "ML" : "Avulso"}
                    </span>
                  </div>
                  <div style="font-weight: 600;">${pkg.code}</div>
                  <div style="color: #1f2937; font-weight: 700;">R$ ${(pkg.value || 0).toFixed(2).replace(".", ",")}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
            `
              : ""
          }
        </div>
        
        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p>
          <p>Beep Velozz © 2024 - Sistema de Conferência de Pacotes</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exporta uma sessão para PDF
 */
export async function exportSessionToPDF(session: Session): Promise<void> {
  try {
    const html = generateReportHTML(session);
    const fileName = `relatorio-${session.id.slice(0, 8)}-${new Date().getTime()}.pdf`;

    const result = await Print.printToFileAsync({
      html,
    });

    // Compartilhar o PDF
    await Share.share({
      url: result.uri,
      title: `Relatório de Conferência - ${session.operatorName}`,
    });
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    throw error;
  }
}

/**
 * Exporta uma sessão com fotos para PDF
 */
export async function exportSessionWithPhotosToPDF(
  session: Session,
): Promise<void> {
  try {
    const html = await generateReportHTMLWithPhotos(session);
    const result = await Print.printToFileAsync({
      html,
    });

    // Compartilhar o PDF
    await Share.share({
      url: result.uri,
      title: `Relatório com Fotos - ${session.operatorName}`,
    });
  } catch (error) {
    console.error("Erro ao exportar PDF com fotos:", error);
    throw error;
  }
}

/**
 * Gera HTML com fotos para um relatório PDF profissional
 */
async function generateReportHTMLWithPhotos(session: Session): Promise<string> {
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;
  const divergenceValue = session.packages.length - session.declaredCount;

  const statusBgColor = hasDivergence ? "#fef3c7" : "#dcfce7";
  const statusTextColor = hasDivergence ? "#b45309" : "#166534";
  const statusIcon = hasDivergence ? "⚠️" : "✅";

  // Obter fotos
  const sessionPhotos = await getSessionPhotos(session.id);
  const photoMap = new Map(sessionPhotos.map((p) => [p.packageCode, p]));

  // Converter fotos para base64
  const photosBase64: Record<string, string> = {};
  for (const [code, photo] of photoMap.entries()) {
    try {
      photosBase64[code] =
        `data:image/jpeg;base64,${await photoToBase64(photo.uri)}`;
    } catch (error) {
      console.warn(`Erro ao converter foto de ${code}:`, error);
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Conferência de Pacotes com Fotos</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #f9fafb;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .status-banner {
          background-color: ${statusBgColor};
          border-left: 4px solid ${statusTextColor};
          padding: 16px 20px;
          margin: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-banner .icon {
          font-size: 24px;
        }
        
        .status-banner-text {
          flex: 1;
        }
        
        .status-banner-title {
          color: ${statusTextColor};
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .status-banner-content {
          color: ${statusTextColor};
          font-size: 13px;
        }
        
        .content {
          padding: 0 20px;
        }
        
        .section {
          margin-bottom: 24px;
        }
        
        .section-title {
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .info-item {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #d1d5db;
        }
        
        .info-label {
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #1f2937;
          font-size: 15px;
          font-weight: 700;
        }
        
        .package-with-photo {
          margin-bottom: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          page-break-inside: avoid;
        }
        
        .package-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .package-code {
          font-weight: 700;
          color: #1f2937;
        }
        
        .package-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .package-badge.shopee {
          background-color: rgba(255, 87, 34, 0.1);
          color: #ff5722;
        }
        
        .package-badge.ml {
          background-color: rgba(255, 230, 0, 0.2);
          color: #b59500;
        }
        
        .package-badge.avulso {
          background-color: rgba(100, 116, 139, 0.1);
          color: #64748b;
        }
        
        .package-photo {
          width: 100%;
          height: auto;
          max-height: 300px;
          border-radius: 6px;
          margin-top: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .photo-label {
          font-size: 9px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 6px;
          text-align: center;
        }
        
        .footer {
          background: #f9fafb;
          padding: 16px 20px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Relatório de Conferência com Fotos</h1>
          <p>Sistema Beep Velozz - Conferência de Pacotes</p>
        </div>
        
        <div class="status-banner">
          <div class="icon">${statusIcon}</div>
          <div class="status-banner-text">
            <div class="status-banner-title">
              ${hasDivergence ? "Relatório com Divergência" : "Conformidade Total"}
            </div>
            <div class="status-banner-content">
              ${metrics.total} pacotes conferidos / ${session.declaredCount} declarados
              ${hasDivergence ? `(Diferença: ${divergenceValue > 0 ? "+" : ""}${divergenceValue})` : ""}
            </div>
          </div>
        </div>
        
        <div class="content">
          <!-- Identificação -->
          <div class="section">
            <div class="section-title">Identificação</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data</div>
                <div class="info-value">${new Date(session.startedAt).toLocaleDateString("pt-BR")}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Operador</div>
                <div class="info-value">${session.operatorName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Motorista</div>
                <div class="info-value">${session.driverName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Fotos Capturadas</div>
                <div class="info-value">${sessionPhotos.length}</div>
              </div>
            </div>
          </div>
          
          <!-- Pacotes com Fotos -->
          <div class="section">
            <div class="section-title">Pacotes Conferenciados com Fotos (${session.packages.length})</div>
            ${session.packages
              .map(
                (pkg, idx) => `
              <div class="package-with-photo">
                <div class="package-header">
                  <span class="package-code">#${idx + 1} - ${pkg.code}</span>
                  <span class="package-badge ${pkg.type === "shopee" ? "shopee" : pkg.type === "mercado_livre" ? "ml" : "avulso"}">
                    ${pkg.type === "shopee" ? "Shopee" : pkg.type === "mercado_livre" ? "ML" : "Avulso"}
                  </span>
                </div>
                <div style="color: #1f2937; font-weight: 700; font-size: 13px;">R$ ${(pkg.value || 0).toFixed(2).replace(".", ",")}</div>
                ${
                  photosBase64[pkg.code]
                    ? `<img src="${photosBase64[pkg.code]}" class="package-photo" alt="Foto - ${pkg.code}" /><div class="photo-label">✓ Foto capturada</div>`
                    : '<div class="photo-label" style="color: #a3a3a3;">⊘ Sem foto capturada</div>'
                }
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        
        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p>
          <p>Beep Velozz © 2024 - Sistema de Conferência de Pacotes</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exporta múltiplas sessões para um PDF consolidado
 */
export async function exportMultipleSessionsToPDF(
  sessions: Session[],
): Promise<void> {
  if (sessions.length === 0) {
    throw new Error("Nenhuma sessão para exportar");
  }

  try {
    const htmlPages = sessions
      .map((session) => generateReportHTML(session))
      .join('<div style="page-break-after: always;"></div>');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatórios Consolidados</title>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${htmlPages}
      </body>
      </html>
    `;

    const result = await Print.printToFileAsync({
      html,
    });

    await Share.share({
      url: result.uri,
      title: `Relatórios Consolidados - ${sessions.length} sessões`,
    });
  } catch (error) {
    console.error("Erro ao exportar PDFs consolidados:", error);
    throw error;
  }
}
