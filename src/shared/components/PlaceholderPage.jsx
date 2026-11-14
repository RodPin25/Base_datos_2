import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { ROUTES } from '../../routes/navigation';

const DEFAULT_DESCRIPTIONS = {
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

const ICON_BY_TITLE = {
  Inventario: 'box',
  Compras: 'truck',
  Clientes: 'users',
  Reportes: 'chart',
};

export default function PlaceholderPage({ title, description, icon, onBack }) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(ROUTES.INICIO));
  const resolvedIcon = icon || ICON_BY_TITLE[title] || 'chart';
  const resolvedDescription = description || DEFAULT_DESCRIPTIONS[title] || 'Administra la información de este módulo.';

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h1>{title}</h1>
          <p>{resolvedDescription}</p>
        </div>
        <button className="primary-button" type="button">
          <Icon name="plus" size={19} />
          Nuevo registro
        </button>
      </div>
      <div className="empty-module panel">
        <div className="empty-icon">
          <Icon name={resolvedIcon} size={28} />
        </div>
        <h2>Módulo de {title.toLowerCase()}</h2>
        <p>
          Esta vista está lista para conectarse a la base de datos y mostrar los registros correspondientes.
        </p>
        <button className="outline-button" type="button" onClick={handleBack}>
          Volver al resumen
        </button>
      </div>
    </section>
  );
}
