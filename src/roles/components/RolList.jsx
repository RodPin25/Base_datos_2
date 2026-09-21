import React, { useState, useEffect } from 'react';
import { getRoles, createRol } from '../services/rolService';

const RolList = ({ canAdd = true }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal para crear nuevo rol
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar roles desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRol = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del rol.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await createRol({
        Nombre: nombre.trim(),
      });
      alert(resp.Mensaje || 'Rol creado exitosamente');
      setNombre('');
      setIsModalOpen(false);
      await fetchRoles();
    } catch (err) {
      alert(err.message || 'Error al crear rol');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoles = roles.filter((r) => {
    const term = search.toLowerCase();
    return r.Nombre && r.Nombre.toLowerCase().includes(term);
  });

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h2>Catálogo de Roles</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Listado y consulta de roles del sistema en SQL Server
          </p>
        </div>
        {canAdd && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Nuevo Rol
          </button>
        )}
      </div>

      <div className="users-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre de rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="loading-text">Cargando roles desde la base de datos...</p>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Rol</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((rol) => (
                  <tr key={rol.id}>
                    <td>{rol.id}</td>
                    <td>
                      <span className="badge rol" style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {rol.Nombre}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="no-data">No se encontraron roles registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Registrar Nuevo Rol</h3>
            <form onSubmit={handleCreateRol}>
              <div className="form-group">
                <label>Nombre del Rol *</label>
                <input
                  type="text"
                  placeholder="Ej: Gerente de Ventas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolList;

