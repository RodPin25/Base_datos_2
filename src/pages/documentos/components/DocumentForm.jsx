import React, { useState, useEffect } from 'react';
import Icon from '../../../shared/components/Icon';
import { money } from '../../../shared/utils/formatters';
import { getDetalleCotizacion } from '../../../services/facturacionService';
import LineItems from './LineItems';

export default function DocumentForm({
  kind,
  onCancel,
  onSave,
  clientes = [],
  productos = [],
  mediosPago = [],
  cotizaciones = [],
}) {
  const isQuote = kind === 'quote';
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedMedioPago, setSelectedMedioPago] = useState(mediosPago[0]?.IdMedioPago || mediosPago[0]?.id || 1);
  const [diasValidez, setDiasValidez] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [lines, setLines] = useState(() => {
    if (productos.length >= 2) {
      return [
        { idProducto: productos[0].id, description: productos[0].Nombre, quantity: 2, price: Number(productos[0].Precio) },
        { idProducto: productos[1].id, description: productos[1].Nombre, quantity: 1, price: Number(productos[1].Precio) },
      ];
    }
    return [{ idProducto: '', description: '', quantity: 1, price: 0 }];
  });

  useEffect(() => {
    if (mediosPago.length > 0 && !selectedMedioPago) {
      setSelectedMedioPago(mediosPago[0].IdMedioPago || mediosPago[0].id);
    }
  }, [mediosPago, selectedMedioPago]);

  const selectedClientObj = clientes.find((c) => String(c.id) === String(selectedClientId));

  const handleSelectQuote = async (quoteId) => {
    setSelectedQuoteId(quoteId);
    if (!quoteId) return;
    try {
      const res = await getDetalleCotizacion(quoteId);
      if (res?.cotizacion?.idCliente) {
        setSelectedClientId(String(res.cotizacion.idCliente));
      }
      if (Array.isArray(res?.detalles) && res.detalles.length > 0) {
        setLines(
          res.detalles.map((d) => ({
            idProducto: d.idProducto,
            description: d.ProductoNombre,
            quantity: Number(d.Cantidad),
            price: Number(d.PrecioUnitario),
          }))
        );
      }
    } catch (err) {
      setFormError(err.message || 'No se pudo cargar el detalle de la cotización.');
    }
  };

  const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.price || 0), 0);
  const subtotal = total / 1.12;
  const tax = total - subtotal;

  const canSubmit =
    !submitting &&
    Boolean(selectedClientId) &&
    lines.length > 0 &&
    lines.every((line) => line.idProducto && Number(line.quantity) > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSave({
        IdCliente: Number(selectedClientId),
        IdMedioPago: Number(selectedMedioPago || 1),
        IdCotizacion: !isQuote && selectedQuoteId ? Number(selectedQuoteId) : null,
        DiasValidez: Number(diasValidez || 15),
        Detalles: lines.map((l) => ({
          IdProducto: Number(l.idProducto),
          Cantidad: Number(l.quantity),
          PrecioUnitario: Number(l.price),
        })),
      });
    } catch (err) {
      setFormError(err.message || 'Error al guardar el documento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="document-form-page">
      <div className="document-form-header">
        <button className="back-button" type="button" onClick={onCancel}>
          ← Volver
        </button>
        <div>
          <p className="eyebrow">{isQuote ? 'NUEVA COTIZACIÓN' : 'NUEVA FACTURA'}</p>
          <h1>{isQuote ? 'Crear cotización' : 'Generar factura'}</h1>
          <p>
            {isQuote
              ? 'Prepara una propuesta clara para tu cliente en SQL Server.'
              : 'Emite la factura descontando existencias mediante dbo.sp_GenerarFactura.'}
          </p>
        </div>
        <span className="draft-label">Conectado a SQL Server</span>
      </div>

      {formError && <div className="alert-error">{formError}</div>}

      <div className="document-form-layout">
        <div className="document-form-main">
          <article className="panel form-section">
            <div className="form-section-title">
              <span>01</span>
              <div>
                <h2>Datos del cliente</h2>
                <p>Selecciona quién recibirá el documento.</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="field field-wide">
                Cliente *
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.Nombres} {c.Apellidos} — NIT: {c.NIT}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                NIT
                <input value={selectedClientObj?.NIT || ''} readOnly placeholder="Se autocompleta al elegir cliente" />
              </label>
              {!isQuote ? (
                <label className="field">
                  Vincular Cotización (Opcional)
                  <select value={selectedQuoteId} onChange={(e) => handleSelectQuote(e.target.value)}>
                    <option value="">Facturación directa (Sin cotización)</option>
                    {cotizaciones
                      .filter((q) => !q.IdFacturaAsociada)
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.number} · {q.client} ({money(q.total)})
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  Validez de la oferta
                  <select value={diasValidez} onChange={(e) => setDiasValidez(Number(e.target.value))}>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                  </select>
                </label>
              )}
            </div>
          </article>

          <article className="panel form-section">
            <div className="form-section-title">
              <span>02</span>
              <div>
                <h2>Detalle de productos (dbo.DetalleTransaccionUDT)</h2>
                <p>Selecciona productos del catálogo, cantidades y precios unitarios.</p>
              </div>
            </div>
            <LineItems lines={lines} onChange={setLines} productos={productos} />
          </article>

          <article className="panel form-section">
            <div className="form-section-title">
              <span>03</span>
              <div>
                <h2>{isQuote ? 'Condiciones comerciales' : 'Método de pago y observaciones'}</h2>
                <p>Información requerida para procesar la transacción.</p>
              </div>
            </div>
            <div className="form-grid">
              {!isQuote && (
                <label className="field">
                  Método de pago (dbo.sp_ObtenerMediosPago) *
                  <select value={selectedMedioPago} onChange={(e) => setSelectedMedioPago(Number(e.target.value))}>
                    {mediosPago.map((mp) => (
                      <option key={mp.IdMedioPago || mp.id} value={mp.IdMedioPago || mp.id}>
                        {mp.Nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                Condición de entrega / pago
                <select>
                  <option>{isQuote ? 'Entrega inmediata según stock' : 'Pago inmediato'}</option>
                  <option>{isQuote ? '3 a 5 días hábiles' : 'Contra entrega'}</option>
                </select>
              </label>
              <label className="field field-wide">
                Notas adicionales
                <textarea placeholder="Agrega indicaciones, términos o notas para el cliente..." />
              </label>
            </div>
          </article>
        </div>

        <aside className="panel document-total">
          <div className="total-heading">
            <Icon name={isQuote ? 'file' : 'receipt'} />
            <div>
              <strong>Resumen</strong>
              <span>{isQuote ? 'Nueva Cotización' : 'Nueva Factura'}</span>
            </div>
          </div>
          <div className="total-client">
            <span>Cliente</span>
            <strong>
              {selectedClientObj ? `${selectedClientObj.Nombres} ${selectedClientObj.Apellidos}` : 'Sin seleccionar'}
            </strong>
          </div>
          <div className="total-lines">
            <p>
              <span>Subtotal (Sin IVA)</span>
              <strong>{money(subtotal)}</strong>
            </p>
            <p>
              <span>IVA (12%)</span>
              <strong>{money(tax)}</strong>
            </p>
          </div>
          <div className="total-final">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button type="button" className="primary-button document-save" disabled={!canSubmit} onClick={handleSubmit}>
            <Icon name="check" size={17} />{' '}
            {submitting ? 'Procesando...' : isQuote ? 'Guardar cotización' : 'Emitir factura'}
          </button>
          <button type="button" className="outline-button document-secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <p className="total-help">El documento quedará disponible para generar o descargar inmediatamente.</p>
        </aside>
      </div>
    </section>
  );
}
