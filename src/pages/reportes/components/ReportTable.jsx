import React from 'react';
import { money } from '../../../shared/utils/formatters';

function formatHeader(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toUpperCase();
}

function isMoneyColumn(key) {
  const k = String(key).toLowerCase();
  return (
    k.includes('monto') ||
    k.includes('total') ||
    k.includes('precio') ||
    k.includes('costo') ||
    k.includes('subtotal') ||
    k.includes('valor') ||
    k.includes('ticket') ||
    k.includes('saldo')
  ) && !k.includes('cantidad') && !k.includes('unidades') && !k.includes('facturas');
}

function isStatusColumn(key) {
  return String(key).toLowerCase().includes('estado');
}

function getStatusClass(val) {
  const lower = String(val || '').toLowerCase();
  if (lower.includes('anulad') || lower.includes('cancel') || lower.includes('vencid')) return 'anulada';
  if (lower.includes('pagad') || lower.includes('activ') || lower.includes('recibida') && !lower.includes('parcial')) {
    return 'pagada';
  }
  if (lower.includes('complet') || lower.includes('aprobad')) return 'pagada';
  if (lower.includes('parcial')) return 'parcial';
  return 'pendiente';
}

function renderCellValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9aa2ae' }}>—</span>;
  }

  if (isStatusColumn(key)) {
    return <span className={`status document-status ${getStatusClass(value)}`}>{String(value)}</span>;
  }

  if (isMoneyColumn(key) && !Number.isNaN(Number(value))) {
    return <strong>{money(value)}</strong>;
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  return String(value);
}

export default function ReportTable({ rows = [], loading = false, emptyMessage = 'No hay registros para mostrar.' }) {
  if (loading) {
    return <div className="no-results">Cargando reporte desde SQL Server...</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className="no-results">{emptyMessage}</div>;
  }

  const columns = Object.keys(rows[0]).filter((col) => col !== '__rowKey');

  return (
    <div className="table-wrap documents-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{formatHeader(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id ?? row.IdFactura ?? row.IdProducto ?? row.Codigo ?? idx}>
              {columns.map((col) => (
                <td key={col}>{renderCellValue(col, row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
