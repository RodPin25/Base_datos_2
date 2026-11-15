import React from 'react';
import Icon from '../../../shared/components/Icon';
import { money } from '../../../shared/utils/formatters';

function resolveProductName(detail, productos = []) {
  const directName =
    detail.ProductoNombre ||
    detail.NombreProducto ||
    detail.Producto ||
    detail.Nombre;
  if (directName) return directName;

  const prodId = detail.IdProducto ?? detail.idProducto ?? detail.id;
  if (prodId !== undefined && prodId !== null) {
    const matched = productos.find((p) => String(p.id ?? p.IdProducto) === String(prodId));
    if (matched) {
      return matched.Nombre || matched.ProductoNombre || matched.NombreProducto || `Producto #${prodId}`;
    }
    return `Producto #${prodId}`;
  }
  return 'Producto';
}

export function DetalleOrdenModal({ ordenDetalle, productos = [], onClose, onOpenIngreso }) {
  if (!ordenDetalle) return null;

  const { header, detalles } = ordenDetalle;
  const ordenId = header.id || header.IdOrdenCompra || header.IdCompraProveedor;
  const codigo = header.Codigo || header.CodigoOrden || `OC-${String(ordenId || 0).padStart(6, '0')}`;
  const proveedor = header.ProveedorNombre || header.Proveedor || `Proveedor #${header.IdProveedor || ''}`;
  const fecha = header.Fecha || header.FechaCompra || header.FechaOrden || '—';
  const estado = header.Estado || 'Pendiente';
  const total = header.MontoTotal ?? header.Total ?? 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">DETALLE DE ORDEN DE COMPRA</p>
            <h3 style={{ marginBottom: 4 }}>{codigo}</h3>
            <p style={{ fontSize: '12px', color: '#687384', margin: 0 }}>
              Proveedor: <strong>{proveedor}</strong> · Fecha: <strong>{fecha}</strong>
            </p>
          </div>
          <span className="badge">{estado}</span>
        </div>

        <div className="table-responsive" style={{ marginTop: 16, marginBottom: 16 }}>
          <table className="users-table" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant. Ordenada</th>
                <th>Recibida</th>
                <th>Precio Costo</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length > 0 ? (
                detalles.map((d, idx) => {
                  const cant = Number(d.Cantidad ?? d.CantidadPedida ?? 0);
                  const recibida = Number(d.CantidadRecibida ?? d.CantidadIngresada ?? 0);
                  const costo = Number(d.PrecioCosto ?? d.PrecioUnitario ?? 0);
                  const subtotal = d.Subtotal !== undefined ? Number(d.Subtotal) : cant * costo;

                  return (
                    <tr key={d.id || d.IdProducto || idx}>
                      <td>
                        <strong>{resolveProductName(d, productos)}</strong>
                      </td>
                      <td>{cant}</td>
                      <td>{recibida}</td>
                      <td>{money(costo)}</td>
                      <td>
                        <strong>{money(subtotal)}</strong>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No hay ítems detallados para esta orden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span style={{ fontSize: '12px', color: '#687384' }}>Total Orden: </span>
            <strong style={{ fontSize: '18px', color: '#18212f' }}>{money(total)}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose();
                onOpenIngreso(header);
              }}
            >
              <Icon name="box" size={15} /> Ingreso a bodega
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IngresoBodegaModal({
  ingresoState,
  sedes = [],
  submitting,
  onChangeSede,
  onChangeCantidad,
  onClose,
  onConfirm,
}) {
  if (!ingresoState) return null;

  const { orden, idSede, idEmpleado, empleadoNombre, items } = ingresoState;
  const empleadoLabel = idEmpleado ? `${empleadoNombre || 'Usuario'} (ID #${idEmpleado})` : empleadoNombre || 'Sin empleado';
  const ordenId = orden.id || orden.IdOrdenCompra || orden.IdCompraProveedor;
  const codigo = orden.Codigo || orden.CodigoOrden || `OC-${String(ordenId || 0).padStart(6, '0')}`;
  const hasValidItems = items.some((i) => Number(i.CantidadIngresada) > 0);

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <h3>Ingreso a Bodega · {codigo}</h3>
        <p style={{ fontSize: '12px', color: '#687384', marginTop: '-10px', marginBottom: '16px' }}>
          Registra la recepción total o parcial en <code>dbo.EntregaProveedores</code> y actualiza{' '}
          <code>dbo.Stock</code>.
        </p>

        <form onSubmit={onConfirm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Sede de destino *</label>
              {sedes.length > 0 ? (
                <select
                  value={idSede}
                  onChange={(e) => onChangeSede(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">Seleccionar sede...</option>
                  {sedes.map((s) => (
                    <option key={s.id || s.IdSede} value={s.id || s.IdSede}>
                      {s.Nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={idSede}
                  onChange={(e) => onChangeSede(e.target.value)}
                  disabled={submitting}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label>Empleado que recibe</label>
              <input
                type="text"
                value={empleadoLabel}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="table-responsive" style={{ marginTop: 10, marginBottom: 16 }}>
            <table className="users-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Ordenado</th>
                  <th>Ya recibido</th>
                  <th>Cantidad a ingresar *</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={item.IdProducto || idx}>
                      <td>
                        <strong>{item.Nombre}</strong>
                      </td>
                      <td>{item.CantidadOrdenada}</td>
                      <td>{item.CantidadRecibida}</td>
                      <td style={{ width: 140 }}>
                        <input
                          type="number"
                          min="0"
                          value={item.CantidadIngresada}
                          onChange={(e) => onChangeCantidad(idx, e.target.value)}
                          disabled={submitting}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #d7dce5' }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No se encontraron ítems en esta orden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !hasValidItems || !Number(idSede) || !Number(idEmpleado)}
            >
              <Icon name="check" size={15} />
              {submitting ? 'Registrando ingreso...' : 'Confirmar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
