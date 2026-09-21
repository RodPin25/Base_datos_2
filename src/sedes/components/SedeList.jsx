import React, { useState, useEffect } from 'react';
import { getSedes, createSede } from '../services/sedeService';

const SedeList = ({ canAdd = true }) => {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal para crear nueva sede
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSedes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSedes();
      setSedes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar sedes desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, []);

  const handleCreateSede = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim() || !contacto.trim()) {
      alert('Por favor completa todos los campos.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await createSede({
        Nombre: nombre.trim(),
        Direccion: direccion.trim(),
        Contacto: contacto.trim(),
      });
      alert(resp.Mensaje || 'Sede creada exitosamente');
      setNombre('');
      setDireccion('');
      setContacto('');
      setIsModalOpen(false);
      await fetchSedes();
    } catch (err) {
      alert(err.message || 'Error al crear sede');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSedes = sedes.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.Nombre && s.Nombre.toLowerCase().includes(term)) ||
      (s.Direccion && s.Direccion.toLowerCase().includes(term)) ||
      (s.Contacto && s.Contacto.toLowerCase().includes(term))
    );
  });

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h2>Catálogo de Sedes</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Listado y consulta de sedes registradas en SQL Server
          </p>
        </div>
        {canAdd && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Nueva Sede
          </button>
        )}
      </div>

      <div className="users-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, dirección o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="loading-text">Cargando sedes desde la base de datos...</p>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filteredSedes.length > 0 ? (
                filteredSedes.map((sede) => (
                  <tr key={sede.id}>
                    <td>{sede.id}</td>
                    <td><strong>{sede.Nombre}</strong></td>
                    <td>{sede.Direccion}</td>
                    <td>{sede.Contacto}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No se encontraron sedes registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Registrar Nueva Sede</h3>
            <form onSubmit={handleCreateSede}>
              <div className="form-group">
                <label>Nombre de la Sede *</label>
                <input
                  type="text"
                  placeholder="Ej: Sede Central"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Dirección *</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Las Américas 12-34 Zona 10"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Contacto *</label>
                <input
                  type="text"
                  placeholder="Ej: PBX 2200-1122"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
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
                  {submitting ? 'Guardando...' : 'Crear Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SedeList;

