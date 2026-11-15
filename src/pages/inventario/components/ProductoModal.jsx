import React, { useState, useEffect } from 'react';
import Icon from '../../../shared/components/Icon';

export default function ProductoModal({
  isOpen,
  editingProduct = null,
  marcas = [],
  categorias = [],
  proveedores = [],
  onClose,
  onSave,
}) {
  const isEditing = Boolean(editingProduct);

  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [caracteristicas, setCaracteristicas] = useState('');
  const [precio, setPrecio] = useState('');
  const [idMarcas, setIdMarcas] = useState('');
  const [idCategoriaPresentacion, setIdCategoriaPresentacion] = useState('');
  const [idProveedor, setIdProveedor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingProduct) {
      setId(String(editingProduct.id ?? ''));
      setNombre(editingProduct.Nombre || '');
      setCaracteristicas(editingProduct.Caracteristicas || '');
      setPrecio(editingProduct.Precio !== undefined ? String(editingProduct.Precio) : '');
      setIdMarcas(
        String(
          editingProduct.idMarcas ??
            editingProduct.IdMarcas ??
            editingProduct.idMarca ??
            editingProduct.IdMarca ??
            marcas[0]?.id ??
            '1'
        )
      );
      setIdCategoriaPresentacion(
        String(
          editingProduct.idCategoriaPresentacion ??
            editingProduct.IdCategoriaPresentacion ??
            editingProduct.idCategoria ??
            editingProduct.IdCategoria ??
            categorias[0]?.id ??
            '1'
        )
      );
      setIdProveedor(String(editingProduct.IdProveedor ?? editingProduct.idProveedor ?? proveedores[0]?.id ?? '1'));
    } else {
      setId('');
      setNombre('');
      setCaracteristicas('');
      setPrecio('');
      setIdMarcas(marcas[0]?.id ? String(marcas[0].id) : '1');
      setIdCategoriaPresentacion(categorias[0]?.id ? String(categorias[0].id) : '1');
      setIdProveedor(proveedores[0]?.id ? String(proveedores[0].id) : '1');
    }
  }, [isOpen, editingProduct, marcas, categorias, proveedores]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || Number(precio) < 0 || precio === '') {
      setErrorMsg('Por favor ingresa al menos el nombre y un precio válido.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        ...(isEditing ? { id: Number(id) } : id ? { id: Number(id) } : {}),
        Nombre: nombre.trim(),
        Caracteristicas: caracteristicas.trim(),
        Precio: Number(precio),
        IdMarcas: Number(idMarcas || 1),
        IdCategoriaPresentacion: Number(idCategoriaPresentacion || 1),
        IdProveedor: Number(idProveedor || 1),
      });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditing ? `Editar Producto #${id}` : 'Nuevo Producto'}</h3>
        <p style={{ fontSize: '12px', color: '#687384', marginTop: '-10px', marginBottom: '16px' }}>
          {isEditing
            ? 'Actualiza los datos del producto mediante dbo.sp_ActualizarProducto.'
            : 'Registra un nuevo producto en SQL Server mediante dbo.sp_Productos_Insertar.'}
        </p>

        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Nombre del producto *</label>
              <input
                type="text"
                placeholder="Ej: Pintura Látex Blanca 1 Galón"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Características / Descripción</label>
              <input
                type="text"
                placeholder="Ej: Acabado mate lavable para interiores"
                value={caracteristicas}
                onChange={(e) => setCaracteristicas(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Precio de venta (Q) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {!isEditing && (
              <div className="form-group">
                <label>ID Producto (Opcional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Automático o manual"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            <div className="form-group">
              <label>Marca *</label>
              {marcas.length > 0 ? (
                <select
                  value={idMarcas}
                  onChange={(e) => setIdMarcas(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={idMarcas}
                  onChange={(e) => setIdMarcas(e.target.value)}
                  disabled={submitting}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label>Categoría / Presentación *</label>
              {categorias.length > 0 ? (
                <select
                  value={idCategoriaPresentacion}
                  onChange={(e) => setIdCategoriaPresentacion(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={idCategoriaPresentacion}
                  onChange={(e) => setIdCategoriaPresentacion(e.target.value)}
                  disabled={submitting}
                  required
                />
              )}
            </div>

            <div className="form-group" style={{ gridColumn: isEditing ? 'auto' : '1 / -1' }}>
              <label>Proveedor *</label>
              {proveedores.length > 0 ? (
                <select
                  value={idProveedor}
                  onChange={(e) => setIdProveedor(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={idProveedor}
                  onChange={(e) => setIdProveedor(e.target.value)}
                  disabled={submitting}
                  required
                />
              )}
            </div>
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
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Icon name="check" size={15} />
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar producto' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
