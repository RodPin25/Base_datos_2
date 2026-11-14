const formatCurrency = (val) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(Number(val || 0));

/**
 * Construye el documento HTML completo de una Factura o Cotización
 */
export const buildDocumentHtml = (docData, detalles = [], kind = 'invoice') => {
  const isQuote = kind === 'quote';
  const codigo = docData.Codigo || docData.number || (isQuote ? 'COT-000000' : 'FAC-000000');
  const cliente = docData.ClienteNombre || docData.client || 'Consumidor Final';
  const nit = docData.NIT || 'CF';
  const fecha = docData.Fecha || docData.date || new Date().toISOString().slice(0, 10);
  const sedeNombre = docData.SedeNombre || 'Sede Central Zona 10';
  const sedeDireccion = docData.SedeDireccion || 'Boulevard Los Próceres 18-45, Zona 10, Ciudad de Guatemala';
  const sedeContacto = docData.SedeContacto || 'PBX: 2234-5600';
  const metodoPago = docData.MetodoPagoNombre || 'N/A';
  const empleado = docData.EmpleadoNombre || 'Ejecutivo Comercial';
  const estado = docData.Estado || docData.status || (isQuote ? 'Enviada' : 'Pagada');
  const codigoCotizacion = docData.CodigoCotizacion || null;
  const codigoVenta = docData.CodigoVenta || null;

  const total =
    detalles.length > 0
      ? detalles.reduce((sum, item) => sum + Number(item.Subtotal ?? item.Cantidad * item.PrecioUnitario), 0)
      : Number(docData.MontoTotal ?? docData.total ?? 0);
  const subtotalSinIva = total / 1.12;
  const iva = total - subtotalSinIva;

  const rowsHtml =
    detalles.length > 0
      ? detalles
          .map(
            (item, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>
              <strong>${item.ProductoNombre || item.description || 'Producto'}</strong>
              ${item.Caracteristicas ? `<div style="font-size:11px;color:#687384;margin-top:2px;">${item.Caracteristicas}</div>` : ''}
            </td>
            <td style="text-align:center;">${item.Cantidad ?? item.quantity ?? 1}</td>
            <td style="text-align:right;">${formatCurrency(item.PrecioUnitario ?? item.price ?? 0)}</td>
            <td style="text-align:right;font-weight:600;">${formatCurrency(
              item.Subtotal ?? (item.Cantidad ?? item.quantity ?? 1) * (item.PrecioUnitario ?? item.price ?? 0)
            )}</td>
          </tr>`
          )
          .join('')
      : `
          <tr>
            <td style="text-align:center;">1</td>
            <td><strong>Productos y recubrimientos según documento ${codigo}</strong></td>
            <td style="text-align:center;">1</td>
            <td style="text-align:right;">${formatCurrency(total)}</td>
            <td style="text-align:right;font-weight:600;">${formatCurrency(total)}</td>
          </tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${isQuote ? 'Cotización' : 'Factura'} ${codigo} - Colora</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #18212f;
      background: #f6f7f9;
      margin: 0;
      padding: 32px 16px;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e6ee;
      border-radius: 16px;
      padding: 40px 44px;
      box-shadow: 0 12px 32px rgba(24, 33, 47, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #eef0f4;
      gap: 20px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.6px;
      margin: 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #687384;
      margin: 4px 0 0;
      line-height: 1.5;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-type {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #4f46e5;
      background: #eeefff;
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    .doc-number {
      font-size: 22px;
      font-weight: 800;
      color: #18212f;
      margin: 0;
    }
    .doc-meta {
      font-size: 12px;
      color: #687384;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 26px 0;
      padding: 18px 20px;
      background: #fafbfc;
      border: 1px solid #edf0f4;
      border-radius: 12px;
    }
    .info-block h4 {
      margin: 0 0 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #8a93a2;
    }
    .info-block p {
      margin: 4px 0;
      font-size: 13px;
      color: #273142;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th {
      background: #f4f5f9;
      color: #596475;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 11px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e6ee;
    }
    td {
      padding: 13px 12px;
      font-size: 13px;
      color: #273142;
      border-bottom: 1px solid #eff1f5;
    }
    .totals {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 290px;
      background: #fafbfc;
      border: 1px solid #edf0f4;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #596475;
      margin-bottom: 8px;
    }
    .totals-row.final {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #e2e6ee;
      font-size: 17px;
      font-weight: 800;
      color: #18212f;
      margin-bottom: 0;
    }
    .footer {
      margin-top: 36px;
      padding-top: 18px;
      border-top: 1px dashed #dfe3e9;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #8a93a2;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="brand-title">Colora · Gestión Comercial</h1>
        <p class="brand-sub">
          <strong>${sedeNombre}</strong><br />
          ${sedeDireccion}<br />
          Tel: ${sedeContacto}
        </p>
      </div>
      <div class="doc-badge">
        <span class="doc-type">${isQuote ? 'Cotización Comercial' : 'Factura Electrónica'}</span>
        <h2 class="doc-number">${codigo}</h2>
        <div class="doc-meta">Fecha de emisión: <strong>${fecha}</strong></div>
        <div class="doc-meta">Estado: <strong>${estado}</strong></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Datos del Cliente</h4>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p><strong>NIT:</strong> ${nit}</p>
      </div>
      <div class="info-block">
        <h4>Detalles de Operación</h4>
        ${
          isQuote
            ? `<p><strong>Válida hasta:</strong> ${docData.FechaLimite || '15 días'}</p>`
            : `<p><strong>Método de Pago:</strong> ${metodoPago}</p>
               ${codigoVenta ? `<p><strong>Código de Venta:</strong> ${codigoVenta}</p>` : ''}
               ${codigoCotizacion ? `<p><strong>Cotización Origen:</strong> ${codigoCotizacion}</p>` : ''}
               <p><strong>Atendido por:</strong> ${empleado}</p>`
        }
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:50px;text-align:center;">#</th>
          <th>Descripción del Producto</th>
          <th style="width:90px;text-align:center;">Cantidad</th>
          <th style="width:130px;text-align:right;">Precio Unit.</th>
          <th style="width:140px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal (Sin IVA)</span>
          <strong>${formatCurrency(subtotalSinIva)}</strong>
        </div>
        <div class="totals-row">
          <span>IVA (12%)</span>
          <strong>${formatCurrency(iva)}</strong>
        </div>
        <div class="totals-row final">
          <span>Total Q.</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Documento generado por Sistema Colora · Base de Datos ProyectoFinal</span>
      <span>¡Gracias por su preferencia!</span>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Descarga directamente el archivo HTML de la factura o cotización
 */
export const downloadDocumentFile = (docData, detalles = [], kind = 'invoice') => {
  const isQuote = kind === 'quote';
  const codigo = docData.Codigo || docData.number || (isQuote ? 'COT' : 'FAC');
  const html = buildDocumentHtml(docData, detalles, kind);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${isQuote ? 'Cotizacion' : 'Factura'}_${codigo}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Abre ventana de impresión / Guardar como PDF para la factura o cotización
 */
export const printDocumentPdf = (docData, detalles = [], kind = 'invoice') => {
  const html = buildDocumentHtml(docData, detalles, kind);
  const printWin = window.open('', '_blank', 'width=900,height=720');
  if (!printWin) {
    // Fallback a descarga directa si el navegador bloquea popups
    downloadDocumentFile(docData, detalles, kind);
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 250);
};
