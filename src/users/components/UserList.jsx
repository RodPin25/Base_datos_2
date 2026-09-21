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
    currentUser,
    openModalForCreate,
    openModalForEdit,
    closeModal,
    handleSaveUser,
    handleDeleteUser,
  } = useUsers();

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={openModalForCreate}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="users-toolbar">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="loading-text">Cargando registros...</p>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role?.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon edit" onClick={() => openModalForEdit(user)}>Editar</button>
                      <button className="btn-icon delete" onClick={() => handleDeleteUser(user.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No se encontraron usuarios.</td>
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
        userToEdit={currentUser}
      />
    </div>
  );
};

export default UserList;