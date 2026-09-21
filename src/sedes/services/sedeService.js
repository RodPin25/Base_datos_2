import { apiFetch } from '../../services/api';

/**
 * Obtiene todas las sedes mediante GET a la BD
 */
export const getSedes = async (id = null) => {
  const endpoint = id ? `/sedes/?id=${id}` : '/sedes/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Crea una nueva sede enviando NewSedeRequest
 */
export const createSede = async (sedeData) => {
  return await apiFetch('/sedes/crear/', {
    method: 'POST',
    body: JSON.stringify({
      Nombre: sedeData.Nombre,
      Direccion: sedeData.Direccion,
      Contacto: sedeData.Contacto,
    }),
  });
};

