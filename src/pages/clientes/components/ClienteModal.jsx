import React, { useState, useEffect } from 'react';
import Icon from '../../../shared/components/Icon';

export default function ClienteModal({ isOpen, editingCliente = null, onClose, onSave }) {
  const isEditing = Boolean(editingCliente);

  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nit, setNit] = useState('CF');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (editingCliente) {
      setId(String(editingCliente.id ?? ''));
      setNombre(editingCliente.Nombre ?? editingCliente.Nombres ?? '');
      setApellidos(editingCliente.Apellidos ?? '');
      setNit(editingCliente.NIT || 'CF');
    } else {
      setId('');
      setNombre('');
      setApellidos('');
      setNit('CF');
    }
  }, [isOpen, editingCliente]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !apellidos.trim() || !nit.trim()) {
      setErrorMsg('Por favor completa nombre, apellidos y NIT.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        ...(isEditing ? { id: Number(id) } : id ? { id: Number(id) } : {}),
        Nombre: nombre.trim(),
        Apellidos: apellidos.trim(),
        NIT: nit.trim(),
      });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo guardar el cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3>{isEditing ? `Editar Cliente #${id}` : 'Nuevo Cliente'}</h3>
        <p style={{ fontSize: '12px', color: '#687384', marginTop: '-10px', marginBottom: '16px' }}>
          {isEditing
            ? 'Actualiza la información del cliente en SQL Server.'
            : 'Registra un nuevo cliente para cotizaciones y facturación.'}
        </p>

        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              placeholder="Ej: María"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Apellidos *</label>
            <input
              type="text"
              placeholder="Ej: López García"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>NIT *</label>
              <input
                type="text"
                placeholder="Ej: 1234567-8 o CF"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {!isEditing && (
              <div className="form-group">
                <label>ID Cliente (Opcional)</label>
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
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar cliente' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
