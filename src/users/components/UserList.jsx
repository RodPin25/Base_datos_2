import React from 'react';
import { useUsers } from '../hooks/useUsers';
import UserModal from './UserModal';
import Icon from '../../dashboard/components/Icon';
import './UserList.css';

const UserList = ({ canAdd = true }) => {
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
          <p className="eyebrow">ADMINISTRACIÓN BD</p>
          <h2>Gestión de Empleados</h2>
          <p style={{ color: '#818a99', fontSize: '12.5px', margin: '7px 0 0 0' }}>
            Lista obtenida directamente desde la base de datos (SQL Server)
          </p>
        </div>
        {canAdd && (
          <button className="primary-button" onClick={openModalForCreate}>
            <Icon name="plus" size={18} />
            Nuevo Empleado
          </button>
        )}
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
                    <td>
                      <strong>
                        {user.Nombres} {user.Apellidos}
                      </strong>
                    </td>
                    <td>
                      <code>{user.Usuario}</code>
                    </td>
                    <td>{user.Correo || <span style={{ color: '#9aa2ae' }}>N/A</span>}</td>
                    <td>
                      <span
                        className="badge sede"
                        style={{
                          background: '#e9f8fb',
                          color: '#0891b2',
                          padding: '4px 10px',
                          borderRadius: '10px',
                        }}
                      >
                        {user.SedeNombre || `Sede #${user.idSede}`}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge rol"
                        style={{
                          background: '#eeefff',
                          color: '#4f46e5',
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontWeight: '650',
                        }}
                      >
                        {user.RolNombre || `Rol #${user.idRol}`}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No se encontraron empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && (
        <UserModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveUser} />
      )}
    </div>
  );
};

export default UserList;