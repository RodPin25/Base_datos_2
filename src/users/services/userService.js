import { apiFetch } from '../../services/api';

/**
 * Obtiene todos los empleados mediante GET a la BD
 */
export const getUsers = async (id = null) => {
  const endpoint = id ? `/empleados/?id=${id}` : '/empleados/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Crea un nuevo empleado en la BD enviando NewEmpleadoRequest
 */
export const createUser = async (empleadoData) => {
  return await apiFetch('/empleados/crear/', {
    method: 'POST',
    body: JSON.stringify({
      Nombres: empleadoData.Nombres,
      Apellidos: empleadoData.Apellidos,
      Correo: empleadoData.Correo || null,
      idSede: Number(empleadoData.idSede),
      idRol: Number(empleadoData.idRol),
      Usuario: empleadoData.Usuario,
      Password: empleadoData.Password,
    }),
  });
};