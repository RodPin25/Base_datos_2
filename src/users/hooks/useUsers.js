import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Modal y búsqueda
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Si es null es Creación, si tiene datos es Edición

  // Cargar usuarios al montar el componente
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  // Manejar Guardar (Crear o Editar)
  const handleSaveUser = async (userData) => {
    try {
      if (currentUser) {
        await updateUser(currentUser.id, userData);
      } else {
        await createUser(userData);
      }
      fetchUsersData(); // Recargar lista
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  // Manejar Eliminar
  const handleDeleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const openModalForCreate = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  // Filtrar usuarios por nombre o correo
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return {
    users: filteredUsers,
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
  };
};