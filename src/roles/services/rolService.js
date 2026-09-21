import { apiFetch } from '../../services/api';

/**
 * Obtiene todos los roles mediante GET a la BD
 */
export const getRoles = async (id = null) => {
  const endpoint = id ? `/roles/?id=${id}` : '/roles/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Crea un nuevo rol enviando NewRolRequest
 */
export const createRol = async (rolData) => {
  return await apiFetch('/roles/crear/', {
    method: 'POST',
    body: JSON.stringify({
      Nombre: rolData.Nombre,
    }),
  });
};

