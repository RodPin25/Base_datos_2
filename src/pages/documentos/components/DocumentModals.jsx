import React from 'react';
import Icon from '../../../shared/components/Icon';
import { money } from '../../../shared/utils/formatters';
import { downloadDocumentFile, printDocumentPdf } from '../../../utils/invoiceDownload';

export function GenerateInvoiceModal({
  quoteToInvoice,
  mediosPago,
  invoiceMedioPago,
  setInvoiceMedioPago,
  generatingInvoice,
  onClose,
  onConfirm,
}) {
  if (!quoteToInvoice) return null;

  return (
    <div className="modal-overlay" onClick={() => !generatingInvoice && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Generar Factura desde Cotización</h3>
        <p style={{ fontSize: '12px', color: '#687384', marginTop: '-10px', marginBottom: '16px' }}>
          Se ejecutará <code>dbo.sp_GenerarFactura</code> para la cotización{' '}
          <strong>{quoteToInvoice.number}</strong>.
        </p>
        <form onSubmit={(e) => onConfirm(e, false)}>
          <div className="form-group">
            <label>Cliente</label>
            <input type="text" value={`${quoteToInvoice.client} (NIT: ${quoteToInvoice.NIT || 'CF'})`} readOnly />
          </div>
          <div className="form-group">
            <label>Monto Total a Facturar</label>
            <input type="text" value={money(quoteToInvoice.total)} readOnly />
          </div>
          <div className="form-group">
            <label>Método de Pago (dbo.sp_ObtenerMediosPago) *</label>
            <select
              value={invoiceMedioPago}
              onChange={(e) => setInvoiceMedioPago(Number(e.target.value))}
              disabled={generatingInvoice}
            >
              {mediosPago.map((mp) => (
                <option key={mp.IdMedioPago || mp.id} value={mp.IdMedioPago || mp.id}>
                  {mp.Nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={generatingInvoice}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ borderColor: '#4f46e5', color: '#4f46e5' }}
              disabled={generatingInvoice}
              onClick={(e) => onConfirm(e, true)}
            >
              <Icon name="download" size={14} />{' '}
              {generatingInvoice ? 'Procesando...' : 'Generar y Descargar'}
            </button>
            <button type="submit" className="btn-primary" disabled={generatingInvoice}>
              <Icon name="receipt" size={15} />
              {generatingInvoice ? 'Generando...' : 'Generar Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RegisterPaymentModal({
  invoiceToPay,
  mediosPago,
  payMedioPago,
  setPayMedioPago,
  payMonto,
  setPayMonto,
  payReferencia,
  setPayReferencia,
  registeringPay,
  onClose,
  onConfirm,
}) {
  if (!invoiceToPay) return null;

  return (
    <div className="modal-overlay" onClick={() => !registeringPay && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar Pago · {invoiceToPay.number}</h3>
        <p style={{ fontSize: '12px', color: '#687384', marginTop: '-10px', marginBottom: '16px' }}>
          Se ejecutará <code>dbo.sp_RegistrarPago</code> para el cliente <strong>{invoiceToPay.client}</strong>.
        </p>
        <form onSubmit={onConfirm}>
          <div className="form-group">
            <label>Método de Pago *</label>
            <select
              value={payMedioPago}
              onChange={(e) => setPayMedioPago(Number(e.target.value))}
              disabled={registeringPay}
            >
              {mediosPago.map((mp) => (
                <option key={mp.IdMedioPago || mp.id} value={mp.IdMedioPago || mp.id}>
                  {mp.Nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Monto Pagado (Total: {money(invoiceToPay.total)}) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={payMonto}
              onChange={(e) => setPayMonto(e.target.value)}
              required
              disabled={registeringPay}
            />
          </div>
          <div className="form-group">
            <label>Referencia / No. Autorización (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: TRF-998811 o AUT-4512"
              value={payReferencia}
              onChange={(e) => setPayReferencia(e.target.value)}
              disabled={registeringPay}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={registeringPay}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={registeringPay}>
              {registeringPay ? 'Registrando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DocumentPreviewModal({ previewDoc, onClose }) {
  if (!previewDoc) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">
              {previewDoc.kind === 'quote' ? 'DETALLE DE COTIZACIÓN' : 'DETALLE DE FACTURA'}
            </p>
            <h3 style={{ marginBottom: 4 }}>
              {previewDoc.header.Codigo || previewDoc.header.number}
            </h3>
            <p style={{ fontSize: '12px', color: '#687384', margin: 0 }}>
              Cliente: <strong>{previewDoc.header.ClienteNombre || previewDoc.header.client}</strong> · NIT:{' '}
              <strong>{previewDoc.header.NIT || 'CF'}</strong> · Fecha:{' '}
              <strong>{previewDoc.header.Fecha || previewDoc.header.date}</strong>
            </p>
          </div>
          <span className="badge">{previewDoc.header.Estado || previewDoc.header.status}</span>
        </div>

        <div className="table-responsive" style={{ marginTop: 16, marginBottom: 16 }}>
          <table className="users-table" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {previewDoc.detalles.length > 0 ? (
                previewDoc.detalles.map((d, idx) => (
                  <tr key={d.id || idx}>
                    <td>
                      <strong>{d.ProductoNombre}</strong>
                      {d.Caracteristicas && (
                        <div style={{ fontSize: '11px', color: '#8a93a2' }}>{d.Caracteristicas}</div>
                      )}
                    </td>
                    <td>{d.Cantidad}</td>
                    <td>{money(d.PrecioUnitario)}</td>
                    <td>
                      <strong>{money(d.Subtotal)}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No hay ítems detallados para este documento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#687384' }}>Monto Total: </span>
            <strong style={{ fontSize: '18px', color: '#18212f' }}>
              {money(previewDoc.header.MontoTotal ?? previewDoc.header.total ?? 0)}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => printDocumentPdf(previewDoc.header, previewDoc.detalles, previewDoc.kind)}
            >
              Imprimir / PDF
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadDocumentFile(previewDoc.header, previewDoc.detalles, previewDoc.kind)}
            >
              <Icon name="download" size={15} /> Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
