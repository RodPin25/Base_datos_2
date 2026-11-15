import React, { useState } from 'react';
import Icon from '../../../shared/components/Icon';
import { money } from '../../../shared/utils/formatters';

export default function CompraForm({
  proveedores = [],
  productos = [],
  defaultEmpleadoId = '',
  defaultEmpleadoNombre = 'Usuario actual',
  onCancel,
  onSave,
}) {
  const [idProveedor, setIdProveedor] = useState(proveedores[0]?.id ? String(proveedores[0].id) : '');
  const idEmpleado = defaultEmpleadoId ? Number(defaultEmpleadoId) : 0;
  const empleadoLabel = idEmpleado
    ? `${defaultEmpleadoNombre} (ID #${idEmpleado})`
    : defaultEmpleadoNombre;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [lines, setLines] = useState(() => {
    if (productos.length > 0) {
      return [
        {
          idProducto: productos[0].id,
          cantidad: 1,
          precioCosto: Number(productos[0].Precio || 0),
        },
      ];
    }
    return [{ idProducto: '', cantidad: 1, precioCosto: 0 }];
  });

  const handleProductSelect = (index, prodId) => {
    const prod = productos.find((p) => String(p.id) === String(prodId));
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              idProducto: prodId ? Number(prodId) : '',
              precioCosto: prod ? Number(prod.PrecioCosto ?? prod.Precio ?? 0) : line.precioCosto,
            }
          : line
      )
    );
  };

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: Number(value) } : line))
    );
  };

  const totalUnidades = lines.reduce((sum, l) => sum + Number(l.cantidad || 0), 0);
  const totalCosto = lines.reduce(
    (sum, l) => sum + Number(l.cantidad || 0) * Number(l.precioCosto || 0),
    0
  );

  const canSubmit =
    !submitting &&
    Number(idProveedor) > 0 &&
    Number(idEmpleado) > 0 &&
    lines.length > 0 &&
    lines.every((l) => Number(l.idProducto) > 0 && Number(l.cantidad) > 0 && Number(l.precioCosto) >= 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSave({
        IdProveedor: Number(idProveedor),
        IdEmpleado: Number(idEmpleado),
        Detalles: lines.map((l) => ({
          IdProducto: Number(l.idProducto),
          Cantidad: Number(l.cantidad),
          PrecioCosto: Number(l.precioCosto),
        })),
      });
    } catch (err) {
      setFormError(err.message || 'Error al crear la orden de compra.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProveedor = proveedores.find((p) => String(p.id) === String(idProveedor));

  return (
    <section className="document-form-page">
      <div className="document-form-header">
        <button className="back-button" type="button" onClick={onCancel}>
          ← Volver
        </button>
        <div>
          <p className="eyebrow">NUEVA ORDEN DE COMPRA</p>
          <h1>Crear orden de compra</h1>
          <p>Registra una orden a proveedor mediante dbo.DetalleCompraUDT.</p>
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
                <h2>Datos del proveedor y responsable</h2>
                <p>Selecciona el proveedor e indica el empleado que emite la orden.</p>
              </div>
            </div>
            <div className="form-grid">
              {proveedores.length > 0 ? (
                <label className="field field-wide">
                  Proveedor *
                  <select value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)}>
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.Nombre || p.RazonSocial || `Proveedor #${p.id}`}
                        {p.NIT ? ` — NIT: ${p.NIT}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  ID Proveedor *
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 1"
                    value={idProveedor}
                    onChange={(e) => setIdProveedor(e.target.value)}
                  />
                </label>
              )}

              <label className="field">
                Empleado responsable
                <input
                  type="text"
                  value={empleadoLabel}
                  readOnly
                  disabled
                />
              </label>
            </div>
          </article>

          <article className="panel form-section">
            <div className="form-section-title">
              <span>02</span>
              <div>
                <h2>Detalle de productos (dbo.DetalleCompraUDT)</h2>
                <p>Selecciona los productos, cantidades y precios de costo unitarios.</p>
              </div>
            </div>

            <div className="line-items">
              <div className="line-items-head">
                <span>Producto</span>
                <span>Cant.</span>
                <span>Precio Costo</span>
                <span>Subtotal</span>
                <span />
              </div>

              {lines.map((line, index) => (
                <div className="line-item" key={index}>
                  {productos.length > 0 ? (
                    <select
                      aria-label={`Producto ${index + 1}`}
                      value={line.idProducto || ''}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                    >
                      <option value="">Seleccionar producto...</option>
                      {productos.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.Nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={`ID Producto ${index + 1}`}
                      type="number"
                      min="1"
                      placeholder="ID Producto"
                      value={line.idProducto}
                      onChange={(e) => updateLine(index, 'idProducto', e.target.value)}
                    />
                  )}

                  <input
                    aria-label={`Cantidad ${index + 1}`}
                    type="number"
                    min="1"
                    value={line.cantidad}
                    onChange={(e) => updateLine(index, 'cantidad', e.target.value)}
                  />

                  <input
                    aria-label={`Precio costo ${index + 1}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.precioCosto}
                    onChange={(e) => updateLine(index, 'precioCosto', e.target.value)}
                  />

                  <strong>{money(Number(line.cantidad || 0) * Number(line.precioCosto || 0))}</strong>

                  <button
                    type="button"
                    aria-label="Eliminar línea"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-line-button"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    {
                      idProducto: productos[0]?.id || '',
                      cantidad: 1,
                      precioCosto: productos[0] ? Number(productos[0].PrecioCosto ?? productos[0].Precio ?? 0) : 0,
                    },
                  ])
                }
              >
                <Icon name="plus" size={15} /> Agregar producto
              </button>
            </div>
          </article>
        </div>

        <aside className="panel document-total">
          <div className="total-heading">
            <Icon name="truck" />
            <div>
              <strong>Resumen</strong>
              <span>Orden de Compra</span>
            </div>
          </div>
          <div className="total-client">
            <span>Proveedor</span>
            <strong>
              {selectedProveedor
                ? selectedProveedor.Nombre || selectedProveedor.RazonSocial
                : idProveedor
                  ? `Proveedor #${idProveedor}`
                  : 'Sin seleccionar'}
            </strong>
          </div>
          <div className="total-lines">
            <p>
              <span>Líneas de producto</span>
              <strong>{lines.length}</strong>
            </p>
            <p>
              <span>Total unidades</span>
              <strong>{totalUnidades}</strong>
            </p>
          </div>
          <div className="total-final">
            <span>Costo Total</span>
            <strong>{money(totalCosto)}</strong>
          </div>
          <button
            type="button"
            className="primary-button document-save"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Icon name="check" size={17} />{' '}
            {submitting ? 'Creando orden...' : 'Crear orden de compra'}
          </button>
          <button
            type="button"
            className="outline-button document-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
          <p className="total-help">
            Una vez creada, podrás registrar su ingreso total o parcial a bodega.
          </p>
        </aside>
      </div>
    </section>
  );
}
