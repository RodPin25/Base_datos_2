import React from 'react';
import { money } from '../../../shared/utils/formatters';

export default function DocumentSummary({ items, kind }) {
  const isQuotes = kind === 'quotes';
  const totalAmount = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const approvedCount = items.filter((item) => item.status === 'Aprobada').length;
  const approvalRate = items.length > 0 ? Math.round((approvedCount / items.length) * 100) : 0;

  const cards = isQuotes
    ? [
        { label: 'Cotizaciones registradas', value: String(items.length), note: 'En base de datos', tone: 'purple' },
        { label: 'Valor cotizado', value: money(totalAmount), note: 'Acumulado total', tone: 'blue' },
        { label: 'Tasa de aprobación', value: `${approvalRate}%`, note: `${approvedCount} facturadas`, tone: 'green' },
      ]
    : [
        { label: 'Facturado acumulado', value: money(totalAmount), note: 'Total registrado en BD', tone: 'purple' },
        {
          label: 'Por cobrar / Parcial',
          value: money(
            items
              .filter((item) => item.status === 'Pendiente' || item.status === 'Pago Parcial')
              .reduce((sum, item) => sum + Number(item.total || 0), 0)
          ),
          note: 'Facturas con saldo',
          tone: 'amber',
        },
        { label: 'Facturas emitidas', value: String(items.length), note: 'Documentos activos', tone: 'green' },
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
