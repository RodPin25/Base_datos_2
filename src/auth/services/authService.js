import { apiFetch } from '../../services/api';

/**
 * Inicia sesión enviando { Usuario, Password } según el schema LoginRequest
 */
export const loginUser = async ({ usuario, password }) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      Usuario: usuario,
      Password: password,
    }),
  });

  return data;
};

/**
 * Cierra la sesión
 */
export const logoutUser = async () => {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
};

/**
 * Obtiene la sesión actual
 */
export const getSesionActual = async () => {
  return await apiFetch('/auth/me', { method: 'GET' });
};