import React from 'react';
import Icon from '../../../shared/components/Icon';
import { money } from '../../../shared/utils/formatters';

export default function LineItems({ lines, onChange, productos = [] }) {
  const handleProductSelect = (index, idProdValue) => {
    const prod = productos.find((p) => String(p.id) === String(idProdValue));
    onChange(
      lines.map((line, i) =>
        i === index
          ? {
              ...line,
              idProducto: idProdValue ? Number(idProdValue) : '',
              description: prod ? prod.Nombre : '',
              price: prod ? Number(prod.Precio) : line.price,
            }
          : line
      )
    );
  };

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
        <span>Precio Unit.</span>
        <span>Total</span>
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
                  {prod.Nombre} ({money(prod.Precio)})
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label={`Descripción ${index + 1}`}
              value={line.description}
              onChange={(e) => update(index, 'description', e.target.value)}
              placeholder="Buscar producto..."
            />
          )}
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
            type="button"
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
        onClick={() =>
          onChange([
            ...lines,
            {
              idProducto: productos[0]?.id || '',
              description: productos[0]?.Nombre || '',
              quantity: 1,
              price: productos[0] ? Number(productos[0].Precio) : 0,
            },
          ])
        }
      >
        <Icon name="plus" size={15} /> Agregar producto
      </button>
    </div>
  );
}
