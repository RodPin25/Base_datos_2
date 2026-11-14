import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { getSessionUser } from '../../services/authService';
import { ROUTES } from '../../routes/navigation';

const stats = [
  {
    label: 'Ventas de hoy',
    value: 'Q 12,840.50',
    note: '12.4% vs. ayer',
    color: '#4f46e5',
    icon: 'cart',
  },
  {
    label: 'Facturas emitidas',
    value: '38',
    note: '6 pendientes de pago',
    color: '#0891b2',
    icon: 'chart',
  },
  {
    label: 'Productos en stock',
    value: '1,284',
    note: '24 con stock bajo',
    color: '#16a34a',
    icon: 'box',
  },
  {
    label: 'Órdenes abiertas',
    value: '12',
    note: '4 por recibir hoy',
    color: '#d97706',
    icon: 'truck',
  },
];

const sales = [
  { invoice: '#F-1058', client: 'Constructora del Sur', time: '10:32', total: 'Q 4,320.00', status: 'Pagada' },
  { invoice: '#F-1057', client: 'María López', time: '09:48', total: 'Q 865.50', status: 'Pagada' },
  { invoice: '#F-1056', client: 'Decoraciones M&A', time: '09:15', total: 'Q 2,480.00', status: 'Pendiente' },
  { invoice: '#F-1055', client: 'Carlos Méndez', time: '08:42', total: 'Q 1,175.00', status: 'Pagada' },
];

const alerts = [
  { product: 'Pintura látex blanca', detail: 'Cubeta · Bodega A', stock: 4, color: '#fb7185' },
  { product: 'Barniz sintético', detail: '1/4 galón · Estante B3', stock: 6, color: '#f59e0b' },
  { product: 'Rodillo profesional 9″', detail: 'Unidad · Estante C1', stock: 8, color: '#6366f1' },
];

const chartValues = [42, 57, 48, 72, 61, 88, 74];

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

export default function InicioPage() {
  const navigate = useNavigate();
  const currentUser = getSessionUser();
  const userName = currentUser?.Usuario || 'Usuario';

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">PANEL PRINCIPAL · COLORA</p>
          <h1>Buenos días, {userName.split(' ')[0]}</h1>
          <p>Aquí tienes un resumen de lo que está pasando en tu negocio.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate(ROUTES.VENTAS)}>
          <Icon name="plus" size={19} />
          Nueva venta
        </button>
      </section>

      <section className="stats-grid" aria-label="Resumen del negocio">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-icon" style={{ color: stat.color, backgroundColor: `${stat.color}12` }}>
              <Icon name={stat.icon} />
            </div>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span className={stat.label === 'Ventas de hoy' ? 'positive' : ''}>
              {stat.label === 'Ventas de hoy' && <span>↑</span>} {stat.note}
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel sales-chart">
          <div className="panel-heading">
            <div>
              <h2>Resumen de ventas</h2>
              <p>Rendimiento de los últimos 7 días</p>
            </div>
            <button className="select-button" type="button">
              <Icon name="calendar" size={16} /> 7 días <span>⌄</span>
            </button>
          </div>
          <div className="chart-summary">
            <div>
              <span>Total vendido</span>
              <strong>Q 68,420.00</strong>
            </div>
            <span className="growth">↑ 8.2%</span>
          </div>
          <div className="chart-area">
            <div className="y-axis">
              <span>Q 15k</span>
              <span>Q 10k</span>
              <span>Q 5k</span>
              <span>Q 0</span>
            </div>
            <div className="bars">
              {chartValues.map((value, index) => (
                <div className="bar-column" key={index}>
                  <div className={`bar ${index === 5 ? 'highlight' : ''}`} style={{ height: `${value}%` }} />
                  <span>{['Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Hoy'][index]}</span>
                </div>
              ))}
            </div>
          </div>
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
              <p>Últimas facturas emitidas</p>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.FACTURACION)}>
              Ver todas <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FACTURA</th>
                  <th>CLIENTE</th>
                  <th>HORA</th>
                  <th>TOTAL</th>
                  <th>ESTADO</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.invoice}>
                    <td>
                      <strong>{sale.invoice}</strong>
                    </td>
                    <td>{sale.client}</td>
                    <td>{sale.time}</td>
                    <td>
                      <strong>{sale.total}</strong>
                    </td>
                    <td>
                      <span className={`status ${sale.status === 'Pagada' ? 'paid' : 'pending'}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" aria-label={`Opciones de ${sale.invoice}`}>
                        <Icon name="more" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Alertas de inventario</h2>
              <p>Productos por debajo del mínimo</p>
            </div>
            <button className="text-button" type="button" onClick={() => navigate(ROUTES.INVENTARIO)}>
              Ver todo
            </button>
          </div>
          <div className="stock-list">
            {alerts.map((alert) => (
              <div className="stock-item" key={alert.product}>
                <span className="product-swatch" style={{ backgroundColor: alert.color }} />
                <div>
                  <strong>{alert.product}</strong>
                  <span>{alert.detail}</span>
                </div>
                <div className="stock-count">
                  <strong>{alert.stock}</strong>
                  <span>disponibles</span>
                </div>
              </div>
            ))}
          </div>
          <button className="outline-button" type="button" onClick={() => navigate(ROUTES.COMPRAS)}>
            Crear orden de compra
          </button>
        </article>
      </section>
    </>
  );
}
