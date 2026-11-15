import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../shared/components/Icon';
import {
  getClientes,
  crearClientes,
  actualizarClientes,
  eliminarClientes,
} from '../../services/clientesService';
import ClienteModal from './components/ClienteModal';

function unwrapArray(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const key of ['data', 'results', 'clientes']) {
      if (Array.isArray(res[key])) return res[key];
    }
    const firstArray = Object.values(res).find((val) => Array.isArray(val));
    if (firstArray) return firstArray;
  }
  return [];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [query, setQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getClientes();
      setClientes(unwrapArray(res));
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar los clientes desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleSaveCliente = async (payload) => {
    if (editingCliente) {
      const resp = await actualizarClientes(payload);
      setSuccessMsg(
        resp?.Mensaje || `Cliente "${payload.Nombre} ${payload.Apellidos}" actualizado correctamente.`
      );
    } else {
      const resp = await crearClientes(payload);
      setSuccessMsg(
        resp?.Mensaje || `Cliente "${payload.Nombre} ${payload.Apellidos}" creado correctamente.`
      );
    }
    setModalOpen(false);
    setEditingCliente(null);
    await loadClientes();
  };

  const handleDeleteCliente = async (cliente) => {
    const fullName = `${cliente.Nombre ?? cliente.Nombres ?? ''} ${cliente.Apellidos ?? ''}`.trim();
    if (!window.confirm(`¿Seguro que deseas eliminar al cliente "${fullName}"?`)) return;
    try {
      setDeletingId(cliente.id);
      setErrorMsg('');
      const resp = await eliminarClientes({ id: cliente.id });
      setSuccessMsg(resp?.Mensaje || `Cliente "${fullName}" eliminado correctamente.`);
      await loadClientes();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clientes.filter((c) => {
    const nombre = c.Nombre ?? c.Nombres ?? '';
    const apellidos = c.Apellidos ?? '';
    const nit = c.NIT ?? '';
    return `${c.id} ${nombre} ${apellidos} ${nit}`.toLowerCase().includes(query.toLowerCase());
  });

  const conNit = clientes.filter((c) => c.NIT && String(c.NIT).toUpperCase() !== 'CF').length;
  const consumidorFinal = clientes.length - conNit;

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DIRECTORIO COMERCIAL</p>
          <h1>Clientes</h1>
          <p>Administra tu directorio de clientes y NIT para cotizaciones y facturación.</p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setEditingCliente(null);
            setModalOpen(true);
          }}
        >
          <Icon name="plus" size={18} />
          Nuevo cliente
        </button>
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

      <div className="document-stats">
        <article className="document-stat panel">
          <span className="document-stat-dot purple" />
          <div>
            <p>Clientes registrados</p>
            <strong>{clientes.length}</strong>
            <small>En dbo.Clientes</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot green" />
          <div>
            <p>Con NIT tributario</p>
            <strong>{conNit}</strong>
            <small>Empresas y contribuyentes</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot blue" />
          <div>
            <p>Consumidor Final (CF)</p>
            <strong>{consumidorFinal}</strong>
            <small>Registros sin NIT específico</small>
          </div>
        </article>
      </div>

      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>Directorio de clientes</h2>
            <p>{filtered.length} clientes mostrados</p>
          </div>
          <div className="documents-actions">
            <label className="document-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar clientes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, apellido o NIT"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="no-results">Cargando clientes desde SQL Server...</div>
        ) : (
          <div className="table-wrap documents-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOMBRE COMPLETO</th>
                  <th>NIT</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cliente) => {
                  const nombre = cliente.Nombre ?? cliente.Nombres ?? '';
                  const apellidos = cliente.Apellidos ?? '';
                  const fullName = `${nombre} ${apellidos}`.trim() || `Cliente #${cliente.id}`;
                  const nit = cliente.NIT || 'CF';

                  return (
                    <tr key={cliente.id}>
                      <td>
                        <strong>#{cliente.id}</strong>
                      </td>
                      <td>
                        <strong>{fullName}</strong>
                      </td>
                      <td>
                        <span
                          className={`status document-status ${
                            String(nit).toUpperCase() === 'CF' ? 'borrador' : 'enviada'
                          }`}
                        >
                          {nit}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            title="Editar cliente"
                            aria-label={`Editar ${fullName}`}
                            onClick={() => {
                              setEditingCliente(cliente);
                              setModalOpen(true);
                            }}
                          >
                            <Icon name="file" size={15} />
                          </button>
                          <button
                            type="button"
                            title="Eliminar cliente"
                            aria-label={`Eliminar ${fullName}`}
                            disabled={deletingId === cliente.id}
                            onClick={() => handleDeleteCliente(cliente)}
                          >
                            <Icon name="close" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="no-results">No encontramos clientes con esa búsqueda.</div>
            )}
          </div>
        )}
      </article>

      <ClienteModal
        isOpen={modalOpen}
        editingCliente={editingCliente}
        onClose={() => {
          setModalOpen(false);
          setEditingCliente(null);
        }}
        onSave={handleSaveCliente}
      />
    </section>
  );
}
