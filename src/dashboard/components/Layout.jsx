import React, { useState, useEffect } from 'react';
import './Layout.css';
import Icon from './Icon';
import UserList from '../../users/components/UserList';
import SedeList from '../../sedes/components/SedeList';
import RolList from '../../roles/components/RolList';
import { logoutUser, getSessionUser } from '../../auth/services/authService';

const mainNavItems = [
  { id: 'Inicio', label: 'Inicio', icon: 'home' },
  { id: 'Ventas', label: 'Ventas', icon: 'cart' },
  { id: 'Cotizaciones', label: 'Cotizaciones', icon: 'file' },
  { id: 'Facturación', label: 'Facturación', icon: 'receipt' },
  { id: 'Inventario', label: 'Inventario', icon: 'box', badge: '24' },
  { id: 'Compras', label: 'Compras', icon: 'truck' },
  { id: 'Clientes', label: 'Clientes', icon: 'users' },
  { id: 'Reportes', label: 'Reportes', icon: 'chart' },
];

const adminNavItems = [
  { id: 'empleados', label: 'Empleados', icon: 'users' },
  { id: 'sedes', label: 'Sedes', icon: 'building' },
  { id: 'roles', label: 'Roles', icon: 'shield' },
];

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

const initialQuotes = [
  { number: 'COT-2026-018', client: 'Constructora del Sur', date: '18 ago 2026', total: 4820, status: 'Enviada' },
  { number: 'COT-2026-017', client: 'Decoraciones M&A', date: '17 ago 2026', total: 2755.5, status: 'Aprobada' },
  { number: 'COT-2026-016', client: 'Carlos Méndez', date: '15 ago 2026', total: 1320, status: 'Borrador' },
  { number: 'COT-2026-015', client: 'Proyectos Atlas, S.A.', date: '12 ago 2026', total: 6940, status: 'Vencida' },
];

const initialInvoices = [
  { number: 'F-1058', client: 'Constructora del Sur', date: '18 ago 2026', total: 4320, status: 'Pagada' },
  { number: 'F-1057', client: 'María López', date: '18 ago 2026', total: 865.5, status: 'Pagada' },
  { number: 'F-1056', client: 'Decoraciones M&A', date: '18 ago 2026', total: 2480, status: 'Pendiente' },
  { number: 'F-1055', client: 'Carlos Méndez', date: '17 ago 2026', total: 1175, status: 'Pagada' },
];

const money = (value) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);

function DashboardHome({ onNavigate, userName }) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">PANEL PRINCIPAL · COLORA</p>
          <h1>Buenos días, {userName.split(' ')[0]}</h1>
          <p>Aquí tienes un resumen de lo que está pasando en tu negocio.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate('Ventas')}>
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
            <button className="select-button">
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
            {[
              { name: 'Crear cotización', detail: 'Nueva propuesta para cliente', icon: 'file', color: '#4f46e5' },
              { name: 'Registrar compra', detail: 'Orden para proveedor', icon: 'truck', color: '#0891b2' },
              { name: 'Ingreso a bodega', detail: 'Recepción total o parcial', icon: 'box', color: '#16a34a' },
              { name: 'Facturación', detail: 'Emitir y consultar facturas', icon: 'receipt', color: '#d97706' },
            ].map((action) => (
              <button key={action.name} onClick={() => onNavigate(action.name)}>
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
            <button className="text-button" onClick={() => onNavigate('Facturación')}>
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
                      <button aria-label={`Opciones de ${sale.invoice}`}>
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
            <button className="text-button" onClick={() => onNavigate('Inventario')}>
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
          <button className="outline-button" onClick={() => onNavigate('Compras')}>
            Crear orden de compra
          </button>
        </article>
      </section>
    </>
  );
}

function DocumentSummary({ items, kind }) {
  const isQuotes = kind === 'quotes';
  const cards = isQuotes
    ? [
        { label: 'Cotizaciones del mes', value: String(items.length + 20), note: '4 nuevas esta semana', tone: 'purple' },
        { label: 'Valor cotizado', value: money(items.reduce((sum, item) => sum + item.total, 0)), note: 'Acumulado visible', tone: 'blue' },
        { label: 'Tasa de aprobación', value: '68%', note: '5.2% más que julio', tone: 'green' },
      ]
    : [
        { label: 'Facturado este mes', value: 'Q 184,620.00', note: '12.8% más que julio', tone: 'purple' },
        {
          label: 'Por cobrar',
          value: money(items.filter((item) => item.status === 'Pendiente').reduce((sum, item) => sum + item.total, 0)),
          note: 'Facturas pendientes',
          tone: 'amber',
        },
        { label: 'Documentos emitidos', value: String(items.length + 34), note: '4 emitidos hoy', tone: 'green' },
      ];

  return (
    <div className="document-stats">
      {cards.map((card) => (
        <article className="document-stat panel" key={card.label}>
          <span className={`document-stat-dot ${card.tone}`} />
          <div>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

function LineItems({ lines, onChange }) {
  const update = (index, field, value) => {
    onChange(
      lines.map((line, i) =>
        i === index ? { ...line, [field]: field === 'description' ? value : Number(value) } : line
      )
    );
  };

  return (
    <div className="line-items">
      <div className="line-items-head">
        <span>Producto o servicio</span>
        <span>Cant.</span>
        <span>Precio</span>
        <span>Total</span>
        <span />
      </div>
      {lines.map((line, index) => (
        <div className="line-item" key={index}>
          <input
            aria-label={`Descripción ${index + 1}`}
            value={line.description}
            onChange={(e) => update(index, 'description', e.target.value)}
            placeholder="Buscar producto..."
          />
          <input
            aria-label={`Cantidad ${index + 1}`}
            min="1"
            type="number"
            value={line.quantity}
            onChange={(e) => update(index, 'quantity', e.target.value)}
          />
          <input
            aria-label={`Precio ${index + 1}`}
            min="0"
            step="0.01"
            type="number"
            value={line.price}
            onChange={(e) => update(index, 'price', e.target.value)}
          />
          <strong>{money(line.quantity * line.price)}</strong>
          <button
            aria-label="Eliminar línea"
            disabled={lines.length === 1}
            onClick={() => onChange(lines.filter((_, i) => i !== index))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="add-line-button"
        type="button"
        onClick={() => onChange([...lines, { description: '', quantity: 1, price: 0 }])}
      >
        <Icon name="plus" size={15} /> Agregar producto
      </button>
    </div>
  );
}

function DocumentForm({ kind, onCancel, onSave }) {
  const isQuote = kind === 'quote';
  const [client, setClient] = useState('');
  const [lines, setLines] = useState([
    { description: 'Pintura látex premium blanca · Cubeta', quantity: 2, price: 685 },
    { description: 'Rodillo profesional 9 pulgadas', quantity: 4, price: 68.5 },
  ]);
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  return (
    <section className="document-form-page">
      <div className="document-form-header">
        <button className="back-button" onClick={onCancel}>
          ← Volver
        </button>
        <div>
          <p className="eyebrow">{isQuote ? 'NUEVA COTIZACIÓN' : 'NUEVA FACTURA'}</p>
          <h1>{isQuote ? 'Crear cotización' : 'Generar factura'}</h1>
          <p>
            {isQuote
              ? 'Prepara una propuesta clara para tu cliente.'
              : 'Completa los datos para emitir el documento.'}
          </p>
        </div>
        <span className="draft-label">Borrador guardado</span>
      </div>

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
                Cliente
                <select value={client} onChange={(e) => setClient(e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  <option>Constructora del Sur</option>
                  <option>Decoraciones M&A</option>
                  <option>María López</option>
                  <option>Carlos Méndez</option>
                </select>
              </label>
              <label className="field">
                NIT
                <input placeholder="CF o número de NIT" />
              </label>
              <label className="field">
                Correo
                <input type="email" placeholder="cliente@empresa.com" />
              </label>
            </div>
          </article>

          <article className="panel form-section">
            <div className="form-section-title">
              <span>02</span>
              <div>
                <h2>Detalle del documento</h2>
                <p>Agrega productos, cantidades y precios.</p>
              </div>
            </div>
            <LineItems lines={lines} onChange={setLines} />
          </article>

          <article className="panel form-section">
            <div className="form-section-title">
              <span>03</span>
              <div>
                <h2>{isQuote ? 'Condiciones comerciales' : 'Pago y observaciones'}</h2>
                <p>Información adicional para el cliente.</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                {isQuote ? 'Validez' : 'Método de pago'}
                <select>
                  <option>{isQuote ? '15 días' : 'Transferencia'}</option>
                  <option>{isQuote ? '30 días' : 'Efectivo'}</option>
                  <option>{isQuote ? '60 días' : 'Tarjeta'}</option>
                </select>
              </label>
              <label className="field">
                {isQuote ? 'Fecha de entrega' : 'Condición de pago'}
                <select>
                  <option>{isQuote ? '3 a 5 días hábiles' : 'Pago inmediato'}</option>
                  <option>{isQuote ? '7 a 10 días hábiles' : 'Crédito 30 días'}</option>
                </select>
              </label>
              <label className="field field-wide">
                Notas
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
              <span>
                {isQuote ? 'Cotización' : 'Factura'} #{isQuote ? 'COT-2026-019' : 'F-1059'}
              </span>
            </div>
          </div>
          <div className="total-client">
            <span>Cliente</span>
            <strong>{client || 'Sin seleccionar'}</strong>
          </div>
          <div className="total-lines">
            <p>
              <span>Subtotal</span>
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
          <button
            className="primary-button document-save"
            disabled={!client || !lines.some((line) => line.description)}
            onClick={() => onSave(client, total)}
          >
            <Icon name="check" size={17} /> {isQuote ? 'Guardar y enviar' : 'Emitir factura'}
          </button>
          <button className="outline-button document-secondary" onClick={onCancel}>
            Guardar como borrador
          </button>
          <p className="total-help">El documento quedará disponible para descargar o enviar por correo.</p>
        </aside>
      </div>
    </section>
  );
}

function DocumentsPage({ kind, startCreating = false }) {
  const isQuotes = kind === 'quotes';
  const [creating, setCreating] = useState(startCreating);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState(isQuotes ? initialQuotes : initialInvoices);

  useEffect(() => {
    setCreating(startCreating);
  }, [startCreating, kind]);

  if (creating) {
    return (
      <DocumentForm
        kind={isQuotes ? 'quote' : 'invoice'}
        onCancel={() => setCreating(false)}
        onSave={(client, total) => {
          const next = {
            number: isQuotes
              ? `COT-2026-${String(items.length + 15).padStart(3, '0')}`
              : `F-${1059 + items.length - initialInvoices.length}`,
            client,
            date: '18 ago 2026',
            total,
            status: isQuotes ? 'Enviada' : 'Pendiente',
          };
          setItems([next, ...items]);
          setSuccess(isQuotes ? 'Cotización creada y lista para enviar.' : 'Factura emitida correctamente.');
          setCreating(false);
        }}
      />
    );
  }

  const filtered = items.filter((item) => {
    const matchesQuery = `${item.number} ${item.client}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Todos los estados' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h1>{isQuotes ? 'Cotizaciones' : 'Facturación'}</h1>
          <p>
            {isQuotes
              ? 'Crea, envía y da seguimiento a tus propuestas.'
              : 'Emite facturas y controla el estado de tus cobros.'}
          </p>
        </div>
        <button className="primary-button" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          {isQuotes ? 'Nueva cotización' : 'Generar factura'}
        </button>
      </div>
      {success && (
        <div className="document-success">
          <span>
            <Icon name="check" size={15} />
          </span>
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}
      <DocumentSummary items={items} kind={kind} />
      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>{isQuotes ? 'Todas las cotizaciones' : 'Facturas emitidas'}</h2>
            <p>{items.length} documentos registrados</p>
          </div>
          <div className="documents-actions">
            <label className="document-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar documentos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número o cliente"
              />
            </label>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos los estados</option>
              {isQuotes ? (
                <>
                  <option>Enviada</option>
                  <option>Aprobada</option>
                  <option>Borrador</option>
                  <option>Vencida</option>
                </>
              ) : (
                <>
                  <option>Pendiente</option>
                  <option>Pagada</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div className="table-wrap documents-table">
          <table>
            <thead>
              <tr>
                <th>{isQuotes ? 'COTIZACIÓN' : 'FACTURA'}</th>
                <th>CLIENTE</th>
                <th>FECHA</th>
                <th>TOTAL</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.number}>
                  <td>
                    <strong>{item.number}</strong>
                  </td>
                  <td>{item.client}</td>
                  <td>{item.date}</td>
                  <td>
                    <strong>{money(item.total)}</strong>
                  </td>
                  <td>
                    <span className={`status document-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button title="Descargar" aria-label={`Descargar ${item.number}`}>
                        <Icon name="download" size={16} />
                      </button>
                      <button title="Más opciones" aria-label={`Opciones de ${item.number}`}>
                        <Icon name="more" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="no-results">No encontramos documentos con esa búsqueda.</div>
          )}
        </div>
      </article>
    </section>
  );
}

function SectionPlaceholder({ title, onBack }) {
  const descriptions = {
    Ventas: 'Cotizaciones, facturas y pagos',
    Cotizaciones: 'Crea, envía y administra propuestas comerciales',
    Facturación: 'Emite facturas y controla tus cobros',
    Inventario: 'Existencias, lotes y movimientos',
    Compras: 'Órdenes de compra y recepción',
    Clientes: 'Directorio de clientes y empresas',
    Reportes: 'Análisis de ventas, compras e inventario',
    'Registrar compra': 'Crea una orden para un proveedor',
    'Ingreso a bodega': 'Registra una recepción total o parcial',
  };
  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h1>{title}</h1>
          <p>{descriptions[title] ?? 'Administra la información de este módulo.'}</p>
        </div>
        <button className="primary-button">
          <Icon name="plus" size={19} />
          Nuevo registro
        </button>
      </div>
      <div className="empty-module panel">
        <div className="empty-icon">
          <Icon
            name={title === 'Inventario' ? 'box' : title === 'Compras' ? 'truck' : 'chart'}
            size={28}
          />
        </div>
        <h2>Módulo de {title.toLowerCase()}</h2>
        <p>
          Esta vista está lista para conectarse a la base de datos y mostrar los registros correspondientes.
        </p>
        <button className="outline-button" onClick={onBack}>
          Volver al resumen
        </button>
      </div>
    </section>
  );
}

const Layout = ({ onLogout }) => {
  // Obtener la información y el rol del usuario decodificado directamente del JWT
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  // Extraer idRol directamente del payload del JWT (ej: 1, 2, 3)
  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;

  // Reglas de filtrado por rol:
  // - Rol 1: Muestra todo y permite agregar en empleados, sedes y roles.
  // - Rol 2: Muestra todo, pero sin botones de agregar en empleados, sedes y roles.
  // - Rol 3: No muestra ni permite empleados, sedes ni roles.
  const canViewAdminCatalogs = idRol !== 3;
  const canAddAdminCatalogs = idRol === 1;

  // Inicia en 'Inicio' (Dashboard principal de Figma)
  const [currentModule, setCurrentModule] = useState('Inicio');

  useEffect(() => {
    const userFromJwt = getSessionUser();
    if (userFromJwt) {
      setCurrentUser(userFromJwt);
      if (Number(userFromJwt.idRol) === 3 && ['empleados', 'sedes', 'roles'].includes(currentModule)) {
        setCurrentModule('Inicio');
      }
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) onLogout();
  };

  const getRoleBadge = () => {
    if (idRol === 1) return 'Rol 1 · Administrador';
    if (idRol === 2) return 'Rol 2 · Consulta';
    if (idRol === 3) return 'Rol 3 · Operativo';
    return `Rol #${idRol || 'N/A'}`;
  };

  const displayName = currentUser?.Usuario || 'Usuario';
  const avatarInitials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'US';

  const renderModule = () => {
    // Protección de ruta: Rol 3 no tiene permitido ver empleados, sedes ni roles
    if (!canViewAdminCatalogs && ['empleados', 'sedes', 'roles'].includes(currentModule)) {
      return (
        <div className="empty-module panel">
          <div className="empty-icon">
            <Icon name="shield" size={28} />
          </div>
          <h2>Acceso Denegado</h2>
          <p>Tu rol ({getRoleBadge()}) no tiene permisos para acceder a este módulo.</p>
          <button className="outline-button" onClick={() => setCurrentModule('Inicio')}>
            Volver al inicio
          </button>
        </div>
      );
    }

    switch (currentModule) {
      case 'Inicio':
        return <DashboardHome onNavigate={setCurrentModule} userName={displayName} />;
      case 'Cotizaciones':
      case 'Crear cotización':
        return <DocumentsPage kind="quotes" startCreating={currentModule === 'Crear cotización'} />;
      case 'Facturación':
      case 'facturacion':
        return <DocumentsPage kind="invoices" />;
      case 'empleados':
        return <UserList canAdd={canAddAdminCatalogs} />;
      case 'sedes':
        return <SedeList canAdd={canAddAdminCatalogs} />;
      case 'roles':
        return <RolList canAdd={canAddAdminCatalogs} />;
      case 'inventario':
      case 'Inventario':
        return <SectionPlaceholder title="Inventario" onBack={() => setCurrentModule('Inicio')} />;
      case 'compras':
      case 'Compras':
        return <SectionPlaceholder title="Compras" onBack={() => setCurrentModule('Inicio')} />;
      case 'reportes':
      case 'Reportes':
        return <SectionPlaceholder title="Reportes" onBack={() => setCurrentModule('Inicio')} />;
      default:
        return <SectionPlaceholder title={currentModule} onBack={() => setCurrentModule('Inicio')} />;
    }
  };

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>Colora</strong>
            <small>Gestión comercial</small>
          </div>
        </div>

        <button className="mobile-close" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}>
          <Icon name="close" />
        </button>

        <p className="nav-caption">MENÚ PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          {mainNavItems.map((item) => (
            <button
              className={`nav-item ${
                currentModule === item.id ||
                (item.id === 'Cotizaciones' && currentModule === 'Crear cotización')
                  ? 'active'
                  : ''
              }`}
              key={item.id}
              onClick={() => {
                setCurrentModule(item.id);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Catálogos de Administración conectados a SQL Server (Ocultos para Rol 3) */}
        {canViewAdminCatalogs && (
          <>
            <p className="nav-caption" style={{ marginTop: 18 }}>
              ADMINISTRACIÓN BD
            </p>
            <nav aria-label="Catálogos de administración">
              {adminNavItems.map((item) => (
                <button
                  className={`nav-item ${currentModule === item.id ? 'active' : ''}`}
                  key={item.id}
                  onClick={() => {
                    setCurrentModule(item.id);
                    setMenuOpen(false);
                  }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="sidebar-help" style={{ marginTop: 'auto' }}>
          <div className="help-icon">
            <Icon name="bell" size={18} />
          </div>
          <strong>¿Necesitas ayuda?</strong>
          <p>Consulta la guía rápida para aprender a usar el sistema.</p>
          <button type="button" onClick={() => setCurrentModule('Inicio')}>
            Ver resumen
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{avatarInitials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{getRoleBadge()}</span>
          </div>
          <button
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <div className={`search ${searchOpen ? 'search-expanded' : ''}`}>
            <Icon name="search" size={19} />
            <input
              aria-label="Buscar"
              placeholder="Buscar productos, facturas o clientes..."
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
            <kbd>⌘ K</kbd>
          </div>

          <div className="top-actions">
            <button
              className="icon-button notification-button"
              aria-label="Notificaciones"
              onClick={() => setNoticeOpen(!noticeOpen)}
            >
              <Icon name="bell" size={21} />
              <span />
            </button>
            <div className="top-divider" />
            <button className="location-button" type="button">
              <span className="location-dot" />
              <span>
                <small>SUCURSAL / SESIÓN</small>
                <strong>
                  {currentUser?.idSede ? `Sede #${currentUser.idSede}` : 'Central'} · {getRoleBadge()}
                </strong>
              </span>
              <span>⌄</span>
            </button>
          </div>

          {noticeOpen && (
            <div className="notification-popover">
              <strong>Notificaciones</strong>
              <p>Tienes 4 órdenes pendientes de recibir hoy.</p>
              <button
                type="button"
                onClick={() => {
                  setCurrentModule('Compras');
                  setNoticeOpen(false);
                }}
              >
                Revisar órdenes
              </button>
            </div>
          )}
        </header>

        <div className="page-content">{renderModule()}</div>
      </main>
    </div>
  );
};

export default Layout;