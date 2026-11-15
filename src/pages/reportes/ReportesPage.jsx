import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../shared/components/Icon';
import { money } from '../../shared/utils/formatters';
import { getSedes } from '../../services/sedeService';
import { getEmpleados } from '../../services/empleadosService';
import {
  getResumen,
  getResumenFilter,
  getVentas,
  getVentasFilter,
  getMasVendidos,
  getMasVendidosFilter,
  getInventario,
  getInventarioFilter,
  getComprasProveedores,
  getComprasProveedoresFecha,
  getBitacora,
  insertarBitacora,
} from '../../services/reporteriaService';
import ReportTable from './components/ReportTable';

const REPORT_TABS = [
  { id: 'ventas', label: 'Ventas', icon: 'cart', sp: 'dbo.sp_ReporteVentas' },
  { id: 'mas-vendidos', label: 'Más vendidos', icon: 'chart', sp: 'dbo.sp_ReporteProductosMasVendidos' },
  { id: 'inventario', label: 'Inventario', icon: 'box', sp: 'dbo.sp_ReporteInventarioStock' },
  { id: 'compras', label: 'Compras', icon: 'truck', sp: 'dbo.sp_ReporteComprasProveedores' },
  { id: 'bitacora', label: 'Bitácora', icon: 'file', sp: 'Bitácora de auditoría' },
];

function unwrapArray(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.results)) return res.results;
  if (res && Array.isArray(res.reporte)) return res.reporte;
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

function exportRowsToCsv(rows, filename) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvLines = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Catálogos para filtros
  const [sedes, setSedes] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // Datos de reportes
  const [resumen, setResumen] = useState({});
  const [rows, setRows] = useState([]);

  // Filtros compartidos
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [idSede, setIdSede] = useState('');
  const [idEmpleado, setIdEmpleado] = useState('');
  const [incluirAnuladas, setIncluirAnuladas] = useState(true);
  const [topN, setTopN] = useState(10);
  const [stockMinimo, setStockMinimo] = useState('');
  const [idProveedor, setIdProveedor] = useState('');

  useEffect(() => {
    Promise.all([getSedes().catch(() => []), getEmpleados().catch(() => [])]).then(
      ([sedesData, empData]) => {
        setSedes(Array.isArray(sedesData) ? sedesData : []);
        setEmpleados(Array.isArray(empData) ? empData : []);
      }
    );
  }, []);

  const fetchActiveReport = useCallback(
    async (useFilters = false) => {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        if (activeTab === 'ventas') {
          const [resumenData, ventasData] = await Promise.all([
            useFilters && (fechaInicio || fechaFin || idSede)
              ? getResumenFilter({
                  FechaInicio: fechaInicio || null,
                  FechaFin: fechaFin || null,
                  IdSede: idSede || null,
                })
              : getResumen(),
            useFilters && (fechaInicio || fechaFin || idSede || idEmpleado || !incluirAnuladas)
              ? getVentasFilter({
                  FechaInicio: fechaInicio || null,
                  FechaFin: fechaFin || null,
                  IdSede: idSede || null,
                  IdEmpleado: idEmpleado || null,
                  IncluirAnuladas: incluirAnuladas,
                })
              : getVentas(),
          ]);
          setResumen(unwrapResumen(resumenData));
          setRows(unwrapArray(ventasData));
        } else if (activeTab === 'mas-vendidos') {
          const data = useFilters
            ? await getMasVendidosFilter({
                FechaInicio: fechaInicio || null,
                FechaFin: fechaFin || null,
                IdSede: idSede || null,
                Top: topN || 10,
              })
            : await getMasVendidos();
          setRows(unwrapArray(data));
        } else if (activeTab === 'inventario') {
          const data =
            useFilters && (idSede || stockMinimo !== '')
              ? await getInventarioFilter({
                  IdSede: idSede || null,
                  StockMinimo: stockMinimo !== '' ? stockMinimo : null,
                })
              : await getInventario();
          setRows(unwrapArray(data));
        } else if (activeTab === 'compras') {
          const data =
            useFilters && (fechaInicio || fechaFin || idProveedor)
              ? await getComprasProveedoresFecha({
                  FechaInicio: fechaInicio || null,
                  FechaFin: fechaFin || null,
                  IdProveedor: idProveedor || null,
                })
              : await getComprasProveedores();
          setRows(unwrapArray(data));
        } else if (activeTab === 'bitacora') {
          if (useFilters && fechaInicio && fechaFin && idEmpleado) {
            const resp = await insertarBitacora({
              FechaInicio: fechaInicio,
              FechaFin: fechaFin,
              IdEmpleado: idEmpleado,
            });
            setSuccessMsg(resp?.Mensaje || 'Consulta registrada en bitácora.');
            if (Array.isArray(resp) || resp?.data || resp?.results) {
              setRows(unwrapArray(resp));
            } else {
              const updated = await getBitacora();
              setRows(unwrapArray(updated));
            }
          } else {
            const data = await getBitacora();
            setRows(unwrapArray(data));
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error al cargar el reporte.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, fechaInicio, fechaFin, idSede, idEmpleado, incluirAnuladas, topN, stockMinimo, idProveedor]
  );

  useEffect(() => {
    fetchActiveReport(false);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearFilters = () => {
    setFechaInicio('');
    setFechaFin('');
    setIdSede('');
    setIdEmpleado('');
    setIncluirAnuladas(true);
    setTopN(10);
    setStockMinimo('');
    setIdProveedor('');
    fetchActiveReport(false);
  };

  const activeTabInfo = REPORT_TABS.find((t) => t.id === activeTab);

  // KPIs específicos del tab activo
  const totalVendido = pickNumber(resumen, ['TotalVendido', 'total_vendido', 'TotalVentas']);
  const facturasActivas = pickNumber(resumen, ['FacturasActivas', 'facturas_activas', 'TotalFacturas'], rows.length);
  const facturasAnuladas = pickNumber(resumen, ['FacturasAnuladas', 'facturas_anuladas']);
  const ticketPromedio = pickNumber(resumen, ['TicketPromedio', 'ticket_promedio']);

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">REPORTERÍA Y AUDITORÍA</p>
          <h1>Reportes</h1>
          <p>Consulta indicadores de ventas, productos más vendidos, inventario, compras y bitácora.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="outline-button"
            type="button"
            disabled={loading || rows.length === 0}
            onClick={() => exportRowsToCsv(rows, `reporte-${activeTab}`)}
          >
            <Icon name="download" size={16} /> Exportar CSV
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => fetchActiveReport(true)}
            disabled={loading}
          >
            <Icon name="search" size={16} />
            {loading ? 'Consultando...' : 'Aplicar filtros'}
          </button>
        </div>
      </div>

      {/* Pestañas de reportes */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {REPORT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'primary-button' : 'outline-button'}
              style={{ height: 38, padding: '0 14px', fontSize: 13 }}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          );
        })}
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

      {/* KPIs cuando estamos en Ventas */}
      {activeTab === 'ventas' && (
        <div className="document-stats">
          <article className="document-stat panel">
            <span className="document-stat-dot purple" />
            <div>
              <p>Total vendido</p>
              <strong>{money(totalVendido)}</strong>
              <small>Ticket promedio: {money(ticketPromedio)}</small>
            </div>
          </article>
          <article className="document-stat panel">
            <span className="document-stat-dot green" />
            <div>
              <p>Facturas activas</p>
              <strong>{facturasActivas}</strong>
              <small>Documentos válidos</small>
            </div>
          </article>
          <article className="document-stat panel">
            <span className="document-stat-dot amber" />
            <div>
              <p>Facturas anuladas</p>
              <strong>{facturasAnuladas}</strong>
              <small>En el período consultado</small>
            </div>
          </article>
        </div>
      )}

      {/* Panel de Filtros */}
      <article className="panel" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <strong style={{ fontSize: 14 }}>Filtros · {activeTabInfo?.label}</strong>
            <p style={{ margin: 0, fontSize: 12, color: '#687384' }}>
              Fuente: <code>{activeTabInfo?.sp}</code>
            </p>
          </div>
          <button type="button" className="text-button" onClick={handleClearFilters}>
            Limpiar filtros
          </button>
        </div>

        <div className="form-grid">
          {activeTab !== 'inventario' && (
            <>
              <label className="field">
                Fecha inicio
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </label>
              <label className="field">
                Fecha fin
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </label>
            </>
          )}

          {(activeTab === 'ventas' || activeTab === 'mas-vendidos' || activeTab === 'inventario') && (
            <label className="field">
              Sede
              <select value={idSede} onChange={(e) => setIdSede(e.target.value)}>
                <option value="">Todas las sedes</option>
                {sedes.map((s) => (
                  <option key={s.id || s.IdSede} value={s.id || s.IdSede}>
                    {s.Nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(activeTab === 'ventas' || activeTab === 'bitacora') && (
            <label className="field">
              Empleado {activeTab === 'bitacora' ? '(requerido para registrar)' : ''}
              <select value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)}>
                <option value="">Todos los empleados</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.Nombres} {emp.Apellidos} ({emp.Usuario})
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeTab === 'ventas' && (
            <label className="field" style={{ justifyContent: 'flex-end' }}>
              <span>Opciones</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                <input
                  type="checkbox"
                  checked={incluirAnuladas}
                  onChange={(e) => setIncluirAnuladas(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Incluir facturas anuladas
              </span>
            </label>
          )}

          {activeTab === 'mas-vendidos' && (
            <label className="field">
              Top productos
              <select value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </label>
          )}

          {activeTab === 'inventario' && (
            <label className="field">
              Stock mínimo máximo (alerta)
              <input
                type="number"
                min="0"
                placeholder="Ej: 10"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </label>
          )}

          {activeTab === 'compras' && (
            <label className="field">
              ID Proveedor (opcional)
              <input
                type="number"
                min="1"
                placeholder="Todos"
                value={idProveedor}
                onChange={(e) => setIdProveedor(e.target.value)}
              />
            </label>
          )}
        </div>
      </article>

      {/* Tabla de resultados */}
      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>Resultados · {activeTabInfo?.label}</h2>
            <p>{rows.length} registros encontrados</p>
          </div>
        </div>

        <ReportTable
          rows={rows}
          loading={loading}
          emptyMessage={`No se encontraron registros para el reporte de ${activeTabInfo?.label?.toLowerCase()}.`}
        />
      </article>
    </section>
  );
}
