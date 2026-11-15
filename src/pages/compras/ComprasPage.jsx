import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../shared/components/Icon';
import { money } from '../../shared/utils/formatters';
import { getSessionUser } from '../../services/authService';
import { getEmpleados } from '../../services/empleadosService';
import { getProductos } from '../../services/facturacionService';
import { getSedes } from '../../services/sedeService';
import { getComprasProveedores } from '../../services/reporteriaService';
import {
  getOrdenesCompra,
  crearOrdenCompra,
  detalleOrdenId,
  bodegaIngreso,
} from '../../services/comprasService';
import CompraForm from './components/CompraForm';
import { DetalleOrdenModal, IngresoBodegaModal } from './components/CompraModals';

function unwrapList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.ordenes)) return res.ordenes;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

function normalizeOrden(raw, idx) {
  const id = raw.id ?? raw.IdOrdenCompra ?? raw.IdCompraProveedor ?? idx + 1;
  const codigo = raw.Codigo || raw.CodigoOrden || `OC-${String(id).padStart(6, '0')}`;
  const proveedor = raw.ProveedorNombre || raw.Proveedor || raw.NombreProveedor || `Proveedor #${raw.IdProveedor || '—'}`;
  const fecha = raw.Fecha || raw.FechaCompra || raw.FechaOrden || '—';
  const total = Number(raw.MontoTotal ?? raw.Total ?? raw.TotalCompra ?? 0);
  const estado = raw.Estado || raw.EstadoRecepcion || 'Pendiente';

  return {
    ...raw,
    id,
    codigo,
    proveedor,
    fecha,
    total,
    estado,
  };
}

function getStatusClass(estado) {
  const lower = String(estado || '').toLowerCase();
  if (lower.includes('recibida') && !lower.includes('parcial')) return 'pagada';
  if (lower.includes('complet') || lower.includes('cerrad')) return 'pagada';
  if (lower.includes('parcial')) return 'parcial';
  return 'pendiente';
}

export default function ComprasPage() {
  const currentUser = getSessionUser();
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empleadoActual, setEmpleadoActual] = useState({
    id: '',
    nombre: currentUser?.Usuario || 'Usuario actual',
  });

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [openMenuId, setOpenMenuId] = useState(null);

  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [ingresoState, setIngresoState] = useState(null);
  const [submittingIngreso, setSubmittingIngreso] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [ordenesRes, reportesRes, prodRes, sedesRes, empleadosRes] = await Promise.all([
        getOrdenesCompra().catch(() => null),
        getComprasProveedores().catch(() => []),
        getProductos().catch(() => []),
        getSedes().catch(() => []),
        getEmpleados().catch(() => []),
      ]);

      const sessionUser = getSessionUser();
      const empleadosList = unwrapList(empleadosRes);
      const sessionUsername = String(sessionUser?.Usuario || '').toLowerCase();
      const matchedEmpleado = empleadosList.find(
        (emp) =>
          (sessionUsername && String(emp.Usuario || '').toLowerCase() === sessionUsername) ||
          (sessionUser?.sub && String(emp.idUsuario || emp.IdUsuario || '') === String(sessionUser.sub))
      );

      if (matchedEmpleado) {
        const fullName = `${matchedEmpleado.Nombres || ''} ${matchedEmpleado.Apellidos || ''}`.trim();
        setEmpleadoActual({
          id: matchedEmpleado.id ?? matchedEmpleado.IdEmpleado ?? '',
          nombre: fullName || matchedEmpleado.Usuario || sessionUser?.Usuario || 'Usuario actual',
        });
      }

      const rawOrdenes = unwrapList(ordenesRes).length > 0 ? unwrapList(ordenesRes) : unwrapList(reportesRes);
      const normalized = rawOrdenes.map(normalizeOrden);
      setOrdenes(normalized);

      // Extraer proveedores únicos si están presentes en las órdenes para facilitar el selector
      const provMap = new Map();
      normalized.forEach((o) => {
        const provId = o.IdProveedor ?? o.idProveedor;
        if (provId && !provMap.has(String(provId))) {
          provMap.set(String(provId), {
            id: provId,
            Nombre: o.proveedor,
          });
        }
      });
      setProveedores(Array.from(provMap.values()));

      setProductos(Array.isArray(prodRes) ? prodRes : []);
      setSedes(Array.isArray(sedesRes) ? sedesRes : []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar las órdenes de compra.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const handleVerDetalle = async (orden) => {
    try {
      setOpenMenuId(null);
      setErrorMsg('');
      const res = await detalleOrdenId({ id: orden.id });
      setOrdenDetalle({
        header: res?.orden || res?.compra || res?.encabezado || orden,
        detalles: res?.detalles || res?.items || (Array.isArray(res) ? res : []),
      });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo obtener el detalle de la orden de compra.');
    }
  };

  const handleOpenIngreso = async (orden) => {
    try {
      setOpenMenuId(null);
      setErrorMsg('');
      const res = await detalleOrdenId({ id: orden.id });
      const rawDetalles = res?.detalles || res?.items || (Array.isArray(res) ? res : []);
      const mappedItems = rawDetalles.map((d) => {
        const ordenada = Number(d.Cantidad ?? d.CantidadPedida ?? 0);
        const recibida = Number(d.CantidadRecibida ?? d.CantidadIngresada ?? 0);
        const pendiente = Math.max(0, ordenada - recibida);
        const prodId = d.IdProducto ?? d.idProducto ?? d.id;
        const prodMatch = productos.find((p) => String(p.id ?? p.IdProducto) === String(prodId));
        const nombreProd =
          d.ProductoNombre ||
          d.NombreProducto ||
          d.Producto ||
          d.Nombre ||
          prodMatch?.Nombre ||
          `Producto #${prodId}`;
        return {
          IdProducto: prodId,
          Nombre: nombreProd,
          CantidadOrdenada: ordenada,
          CantidadRecibida: recibida,
          CantidadIngresada: pendiente > 0 ? pendiente : ordenada,
        };
      });

      setIngresoState({
        orden,
        idSede: currentUser?.idSede ? String(currentUser.idSede) : sedes[0]?.id ? String(sedes[0].id) : '',
        idEmpleado: empleadoActual.id ? String(empleadoActual.id) : '',
        empleadoNombre: empleadoActual.nombre,
        items: mappedItems,
      });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron cargar los productos de la orden para ingresar a bodega.');
    }
  };

  const handleConfirmIngreso = async (e) => {
    e.preventDefault();
    if (!ingresoState) return;
    setSubmittingIngreso(true);
    setErrorMsg('');
    try {
      const detalleValido = ingresoState.items
        .filter((i) => Number(i.CantidadIngresada) > 0)
        .map((i) => ({
          IdProducto: Number(i.IdProducto),
          CantidadIngresada: Number(i.CantidadIngresada),
        }));

      const resp = await bodegaIngreso({
        IdOrdenCompra: ingresoState.orden.id,
        IdEmpleado: Number(ingresoState.idEmpleado),
        IdSede: Number(ingresoState.idSede),
        DetalleIngreso: detalleValido,
      });

      setSuccessMsg(
        resp?.Mensaje || `Ingreso a bodega registrado exitosamente para la orden ${ingresoState.orden.codigo}.`
      );
      setIngresoState(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el ingreso a bodega.');
    } finally {
      setSubmittingIngreso(false);
    }
  };

  if (creating) {
    return (
      <CompraForm
        proveedores={proveedores}
        productos={productos}
        defaultEmpleadoId={empleadoActual.id}
        defaultEmpleadoNombre={empleadoActual.nombre}
        onCancel={() => setCreating(false)}
        onSave={async (payload) => {
          const resp = await crearOrdenCompra(payload);
          setSuccessMsg(
            resp?.Mensaje ||
              `Orden de compra ${resp?.CodigoOrden || resp?.IdOrdenCompra || ''} creada exitosamente en SQL Server.`
          );
          setCreating(false);
          await loadData();
        }}
      />
    );
  }

  const totalAcumulado = ordenes.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendientesCount = ordenes.filter((o) => {
    const est = o.estado.toLowerCase();
    return est.includes('pendiente') || est.includes('parcial') || est.includes('abierta');
  }).length;

  const filtered = ordenes.filter((o) => {
    const matchesQuery = `${o.codigo} ${o.proveedor} ${o.estado}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Todos los estados' || o.estado === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const uniqueStatuses = Array.from(new Set(ordenes.map((o) => o.estado).filter(Boolean)));

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTIÓN DE COMPRAS</p>
          <h1>Órdenes de compra</h1>
          <p>Crea órdenes para proveedores, revisa sus ítems y registra ingresos a bodega.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          Nueva orden de compra
        </button>
      </div>

      {successMsg && (
        <div className="document-success">
          <span>
            <Icon name="check" size={15} />
          </span>
          {successMsg}
          <button type="button" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {errorMsg && (
        <div className="alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ border: 0, background: 'none', color: '#d9414f', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      <div className="document-stats">
        <article className="document-stat panel">
          <span className="document-stat-dot purple" />
          <div>
            <p>Órdenes registradas</p>
            <strong>{ordenes.length}</strong>
            <small>En base de datos</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot amber" />
          <div>
            <p>Por recibir en bodega</p>
            <strong>{pendientesCount}</strong>
            <small>Pendientes o parciales</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot green" />
          <div>
            <p>Monto acumulado</p>
            <strong>{money(totalAcumulado)}</strong>
            <small>Total en órdenes</small>
          </div>
        </article>
      </div>

      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>Historial de órdenes de compra</h2>
            <p>{ordenes.length} órdenes registradas en SQL Server</p>
          </div>
          <div className="documents-actions">
            <label className="document-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar órdenes de compra"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código o proveedor"
              />
            </label>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos los estados</option>
              {uniqueStatuses.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="no-results">Cargando órdenes de compra desde SQL Server...</div>
        ) : (
          <div className="table-wrap documents-table">
            <table>
              <thead>
                <tr>
                  <th>ORDEN</th>
                  <th>PROVEEDOR</th>
                  <th>FECHA</th>
                  <th>TOTAL</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((orden) => {
                  const isMenuOpen = openMenuId === orden.codigo;
                  return (
                    <tr key={orden.codigo}>
                      <td>
                        <strong>{orden.codigo}</strong>
                      </td>
                      <td>{orden.proveedor}</td>
                      <td>{orden.fecha}</td>
                      <td>
                        <strong>{money(orden.total)}</strong>
                      </td>
                      <td>
                        <span className={`status document-status ${getStatusClass(orden.estado)}`}>
                          {orden.estado}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title="Ingreso a bodega"
                            aria-label={`Ingreso a bodega ${orden.codigo}`}
                            onClick={() => handleOpenIngreso(orden)}
                          >
                            <Icon name="box" size={16} />
                          </button>

                          <button
                            type="button"
                            title="Más opciones"
                            aria-label={`Opciones de ${orden.codigo}`}
                            onClick={() => setOpenMenuId(isMenuOpen ? null : orden.codigo)}
                          >
                            <Icon name="more" size={18} />
                          </button>

                          {isMenuOpen && (
                            <div className="action-menu-dropdown" role="menu">
                              <button type="button" onClick={() => handleVerDetalle(orden)}>
                                <Icon name="search" size={15} />
                                <span>Ver detalle de orden</span>
                              </button>
                              <button type="button" onClick={() => handleOpenIngreso(orden)}>
                                <Icon name="box" size={15} />
                                <span>Registrar ingreso a bodega</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="no-results">No encontramos órdenes de compra con esa búsqueda.</div>
            )}
          </div>
        )}
      </article>

      <DetalleOrdenModal
        ordenDetalle={ordenDetalle}
        productos={productos}
        onClose={() => setOrdenDetalle(null)}
        onOpenIngreso={handleOpenIngreso}
      />

      <IngresoBodegaModal
        ingresoState={ingresoState}
        sedes={sedes}
        submitting={submittingIngreso}
        onChangeSede={(val) => setIngresoState((prev) => ({ ...prev, idSede: val }))}
        onChangeCantidad={(idx, val) =>
          setIngresoState((prev) => ({
            ...prev,
            items: prev.items.map((item, i) =>
              i === idx ? { ...item, CantidadIngresada: val } : item
            ),
          }))
        }
        onClose={() => setIngresoState(null)}
        onConfirm={handleConfirmIngreso}
      />
    </section>
  );
}
