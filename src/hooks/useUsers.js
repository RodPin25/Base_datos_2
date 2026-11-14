import { useState, useEffect } from 'react';
import { getUsers, createUser } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para el Modal y búsqueda
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar empleados al montar el componente
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar empleados desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  // Manejar Crear Empleado
  const handleSaveUser = async (userData) => {
    try {
      const resp = await createUser(userData);
      alert(resp.Mensaje || 'Empleado creado exitosamente');
      await fetchUsersData(); // Recargar lista
      closeModal();
    } catch (err) {
      alert(err.message || 'Error al registrar empleado');
    }
  };

  const openModalForCreate = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Filtrar empleados por nombre, apellido, correo, usuario, sede o rol
  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    const fullName = `${user.Nombres || ''} ${user.Apellidos || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (user.Correo && user.Correo.toLowerCase().includes(term)) ||
      (user.Usuario && user.Usuario.toLowerCase().includes(term)) ||
      (user.SedeNombre && user.SedeNombre.toLowerCase().includes(term)) ||
      (user.RolNombre && user.RolNombre.toLowerCase().includes(term))
    );
  });

  return {
    users: filteredUsers,
    loading,
    error,
    search,
    setSearch,
    isModalOpen,
    openModalForCreate,
    closeModal,
    handleSaveUser,
    refreshUsers: fetchUsersData,
  };
};