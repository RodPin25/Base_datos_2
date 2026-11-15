import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { money } from '../../shared/utils/formatters';
import { getSessionUser } from '../../services/authService';
import {
  getResumen,
  getVentas,
  getInventario,
  getMasVendidos,
  getComprasProveedores,
} from '../../services/reporteriaService';
import { ROUTES } from '../../routes/navigation';

const quickActions = [
  {
    name: 'Crear cotización',
    detail: 'Nueva propuesta para cliente',
    icon: 'file',
    color: '#4f46e5',
    to: ROUTES.COTIZACIONES,
    state: { startCreating: true },
  },
  {
    name: 'Registrar compra',
    detail: 'Orden para proveedor',
    icon: 'truck',
    color: '#0891b2',
    to: ROUTES.COMPRAS,
  },
  {
    name: 'Ingreso a bodega',
    detail: 'Recepción total o parcial',
    icon: 'box',
    color: '#16a34a',
    to: ROUTES.INVENTARIO,
  },
  {
    name: 'Facturación',
    detail: 'Emitir y consultar facturas',
    icon: 'receipt',
    color: '#d97706',
    to: ROUTES.FACTURACION,
  },
];

const ALERT_COLORS = ['#fb7185', '#f59e0b', '#6366f1', '#0891b2'];

function pickNumber(obj, keys, fallback = 0) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      const n = Number(obj[key]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return fallback;
}

function pickText(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return String(obj[key]);
    }
  }
  return fallback;
}

function unwrapArray(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

function unwrapResumen(res) {
  if (Array.isArray(res)) return res[0] || {};
  if (res && typeof res === 'object') {
    if (Array.isArray(res.resumen)) return res.resumen[0] || {};
    if (res.resumen && typeof res.resumen === 'object') return res.resumen;
    return res;
  }
  return {};
}

function getStatusClass(statusText) {
  const lower = String(statusText || '').toLowerCase();
  if (lower.includes('pagada') || lower.includes('activa') || lower.includes('aprobada')) return 'paid';
  return 'pending';
}

export default function InicioPage() {
  const navigate = useNavigate();
  const currentUser = getSessionUser();
  const userName = currentUser?.Usuario || 'Usuario';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [resumen, setResumen] = useState({});
  const [ventas, setVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [compras, setCompras] = useState([]);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    const results = await Promise.allSettled([
      getResumen(),
      getVentas(),
      getInventario(),
      getMasVendidos(),
      getComprasProveedores(),
    ]);

    const [resumenRes, ventasRes, invRes, topRes, comprasRes] = results;

    if (resumenRes.status === 'fulfilled') setResumen(unwrapResumen(resumenRes.value));
    if (ventasRes.status === 'fulfilled') setVentas(unwrapArray(ventasRes.value));
    if (invRes.status === 'fulfilled') setInventario(unwrapArray(invRes.value));
    if (topRes.status === 'fulfilled') setMasVendidos(unwrapArray(topRes.value));
    if (comprasRes.status === 'fulfilled') setCompras(unwrapArray(comprasRes.value));

    const allFailed = results.every((r) => r.status === 'rejected');
    if (allFailed) {
      setErrorMsg(resumenRes.reason?.message || 'No se pudo cargar el resumen de reportería desde el servidor.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // KPIs de sp_ReporteResumenVentas
  const totalVendido = pickNumber(resumen, ['TotalVendido', 'total_vendido', 'TotalVentas', 'totalVendido']);
  const facturasActivas = pickNumber(resumen, ['FacturasActivas', 'facturas_activas', 'TotalFacturas'], ventas.length);
  const facturasAnuladas = pickNumber(resumen, ['FacturasAnuladas', 'facturas_anuladas']);
  const totalAnulado = pickNumber(resumen, ['TotalAnulado', 'total_anulado']);
  const ticketPromedio = pickNumber(resumen, ['TicketPromedio', 'ticket_promedio']);

  // KPIs de sp_ReporteInventarioStock
  const totalUnidades = inventario.reduce(
    (sum, item) => sum + pickNumber(item, ['Stock', 'Cantidad', 'Existencia', 'StockActual', 'stock']),
    0
  );
  const lowStockItems = inventario
    .filter((item) => {
      const stock = pickNumber(item, ['Stock', 'Cantidad', 'Existencia', 'StockActual', 'stock']);
      const min = pickNumber(item, ['StockMinimo', 'Minimo', 'stock_minimo'], 10);
      return stock <= min;
    })
    .sort(
      (a, b) =>
        pickNumber(a, ['Stock', 'Cantidad', 'Existencia', 'StockActual', 'stock']) -
        pickNumber(b, ['Stock', 'Cantidad', 'Existencia', 'StockActual', 'stock'])
    );

  // KPIs de sp_ReporteComprasProveedores
  const pendientesRecepcion = compras.filter((c) => {
    const estado = pickText(c, ['Estado', 'EstadoRecepcion', 'estado'], '').toLowerCase();
    return estado.includes('pendiente') || estado.includes('parcial') || estado.includes('abierta');
  }).length;

  const stats = [
    {
      label: 'Total vendido',
      value: loading ? '...' : money(totalVendido),
      note: `Ticket promedio: ${money(ticketPromedio)}`,
      color: '#4f46e5',
      icon: 'cart',
      positive: totalVendido > 0,
    },
    {
      label: 'Facturas activas',
      value: loading ? '...' : String(facturasActivas),
      note: `${facturasAnuladas} anuladas · ${money(totalAnulado)}`,
      color: '#0891b2',
      icon: 'chart',
    },
    {
      label: 'Unidades en inventario',
      value: loading ? '...' : totalUnidades.toLocaleString('es-GT'),
      note: `${lowStockItems.length} con stock bajo`,
      color: '#16a34a',
      icon: 'box',
    },
    {
      label: 'Compras a proveedores',
      value: loading ? '...' : String(compras.length),
      note: `${pendientesRecepcion} pendientes de recepción`,
      color: '#d97706',
      icon: 'truck',
    },
  ];

  const recentSales = ventas.slice(0, 5);
  const topProducts = masVendidos.slice(0, 5);
  const maxUnitsSold = topProducts.reduce(
    (max, p) => Math.max(max, pickNumber(p, ['CantidadVendida', 'TotalVendido', 'UnidadesVendidas', 'Cantidad'], 1)),
    1
  );
  const stockAlerts = (lowStockItems.length > 0 ? lowStockItems : inventario).slice(0, 4);

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">PANEL PRINCIPAL · COLORA</p>
          <h1>Buenos días, {userName.split(' ')[0]}</h1>
          <p>Resumen en tiempo real conectado a los reportes de SQL Server.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="outline-button" type="button" onClick={loadReportData} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </button>
          <button className="primary-button" type="button" onClick={() => navigate(ROUTES.VENTAS)}>
            <Icon name="plus" size={19} />
            Nueva venta
          </button>
        </div>
      </section>

      {errorMsg && (
        <div className="alert-error" style={{ marginBottom: 18 }}>
          {errorMsg}
        </div>
      )}

      <section className="stats-grid" aria-label="Resumen de reportería">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-icon" style={{ color: stat.color, backgroundColor: `${stat.color}12` }}>
              <Icon name={stat.icon} />
            </div>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span className={stat.positive ? 'positive' : ''}>
              {stat.positive && <span>↑</span>} {stat.note}
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel sales-chart">
          <div className="panel-heading">
            <div>
              <h2>Productos más vendidos</h2>
              <p>Ranking de reportería (excluye facturas anuladas)</p>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.REPORTES)}>
              Ver reportes <Icon name="arrow" size={15} />
            </button>
          </div>

          <div className="chart-summary">
            <div>
              <span>Total vendido acumulado</span>
              <strong>{money(totalVendido)}</strong>
            </div>
            <span className="growth">{facturasActivas} facturas activas</span>
          </div>

          {loading ? (
            <div className="no-results">Cargando ranking de productos...</div>
          ) : topProducts.length === 0 ? (
            <div className="no-results">No hay productos vendidos registrados todavía.</div>
          ) : (
            <div className="stock-list" style={{ marginTop: 12 }}>
              {topProducts.map((item, idx) => {
                const nombre = pickText(item, ['Producto', 'Nombre', 'ProductoNombre', 'NombreProducto'], `Producto #${idx + 1}`);
                const unidades = pickNumber(item, ['CantidadVendida', 'UnidadesVendidas', 'Cantidad', 'TotalCantidad']);
                const monto = pickNumber(item, ['MontoVendido', 'TotalVendido', 'Subtotal', 'Total']);
                const pct = Math.max(8, Math.round((unidades / maxUnitsSold) * 100));

                return (
                  <div key={`${nombre}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <strong>
                        {idx + 1}. {nombre}
                      </strong>
                      <span style={{ color: '#64748b' }}>
                        {unidades} uds · <strong>{money(monto)}</strong>
                      </span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: '#eef2ff', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: idx === 0 ? '#4f46e5' : '#818cf8',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <h2>Acciones rápidas</h2>
              <p>Accesos más utilizados</p>
            </div>
          </div>
          <div className="quick-list">
            {quickActions.map((action) => (
              <button
                key={action.name}
                type="button"
                onClick={() => navigate(action.to, action.state ? { state: action.state } : undefined)}
              >
                <span className="quick-icon" style={{ color: action.color, backgroundColor: `${action.color}12` }}>
                  <Icon name={action.icon} size={19} />
                </span>
                <span>
                  <strong>{action.name}</strong>
                  <small>{action.detail}</small>
                </span>
                <Icon name="arrow" size={17} />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel recent-sales">
          <div className="panel-heading">
            <div>
              <h2>Ventas recientes</h2>
              <p>Últimas facturas del reporte de ventas</p>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.FACTURACION)}>
              Ver todas <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="no-results">Cargando ventas recientes...</div>
            ) : recentSales.length === 0 ? (
              <div className="no-results">No hay ventas registradas en el reporte.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>FACTURA</th>
                    <th>CLIENTE</th>
                    <th>FECHA</th>
                    <th>TOTAL</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, idx) => {
                    const codigo = pickText(sale, ['Codigo', 'CodigoFactura', 'NumeroFactura', 'id'], `#${idx + 1}`);
                    const cliente = pickText(sale, ['Cliente', 'ClienteNombre', 'NombreCliente'], 'Consumidor Final');
                    const fecha = pickText(sale, ['Fecha', 'FechaEmision', 'FechaFactura'], '—');
                    const total = pickNumber(sale, ['MontoTotal', 'Total', 'total']);
                    const estado = pickText(sale, ['Estado', 'EstadoFactura'], 'Activa');

                    return (
                      <tr key={`${codigo}-${idx}`}>
                        <td>
                          <strong>{codigo}</strong>
                        </td>
                        <td>{cliente}</td>
                        <td>{fecha}</td>
                        <td>
                          <strong>{money(total)}</strong>
                        </td>
                        <td>
                          <span className={`status ${getStatusClass(estado)}`}>{estado}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <article className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Alertas de inventario</h2>
              <p>Productos con menor existencia por sede</p>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.INVENTARIO)}>
              Ver todo
            </button>
          </div>
          {loading ? (
            <div className="no-results">Cargando inventario...</div>
          ) : stockAlerts.length === 0 ? (
            <div className="no-results">No hay registros de inventario disponibles.</div>
          ) : (
            <div className="stock-list">
              {stockAlerts.map((alert, idx) => {
                const nombre = pickText(alert, ['Producto', 'Nombre', 'ProductoNombre'], `Producto #${idx + 1}`);
                const sede = pickText(alert, ['Sede', 'NombreSede', 'Bodega'], 'Sede principal');
                const stock = pickNumber(alert, ['Stock', 'Cantidad', 'Existencia', 'StockActual', 'stock']);

                return (
                  <div className="stock-item" key={`${nombre}-${sede}-${idx}`}>
                    <span
                      className="product-swatch"
                      style={{ backgroundColor: ALERT_COLORS[idx % ALERT_COLORS.length] }}
                    />
                    <div>
                      <strong>{nombre}</strong>
                      <span>{sede}</span>
                    </div>
                    <div className="stock-count">
                      <strong>{stock}</strong>
                      <span>disponibles</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button className="outline-button" type="button" onClick={() => navigate(ROUTES.COMPRAS)}>
            Crear orden de compra
          </button>
        </article>
      </section>
    </>
  );
}
