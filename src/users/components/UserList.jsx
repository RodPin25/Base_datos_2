import React from 'react';
import { useUsers } from '../hooks/useUsers';
import UserModal from './UserModal';
import './UserList.css';

const UserList = () => {
  const {
    users,
    loading,
    error,
    search,
    setSearch,
    isModalOpen,
    openModalForCreate,
    closeModal,
    handleSaveUser,
  } = useUsers();

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h2>Gestión de Empleados</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Lista obtenida directamente desde la base de datos (SQL Server)
          </p>
        </div>
        <button className="btn-primary" onClick={openModalForCreate}>
          + Nuevo Empleado
        </button>
      </div>

      <div className="users-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre, usuario, correo, sede o rol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="loading-text">Cargando registros desde la base de datos...</p>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Sede</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td><strong>{user.Nombres} {user.Apellidos}</strong></td>
                    <td><code>{user.Usuario}</code></td>
                    <td>{user.Correo || <span style={{ color: '#999' }}>N/A</span>}</td>
                    <td>
                      <span className="badge sede" style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px' }}>
                        {user.SedeNombre || `Sede #${user.idSede}`}
                      </span>
                    </td>
                    <td>
                      <span className="badge rol" style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>
                        {user.RolNombre || `Rol #${user.idRol}`}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No se encontraron empleados registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserList;