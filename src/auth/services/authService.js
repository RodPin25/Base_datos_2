import { apiFetch } from '../../services/api';

/**
 * Decodifica un token JWT directamente en el frontend sin librerías externas
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error al decodificar token JWT:', e);
    return null;
  }
};

/**
 * Obtiene la información del usuario autenticado y su rol desde el JWT recibido
 */
export const getSessionUser = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const payload = decodeJWT(token);

  if (payload) {
    return {
      idEmpleado: payload.sub,
      sub: payload.sub,
      Usuario: payload.usuario || payload.Usuario,
      idRol: Number(payload.idRol),
      idSede: Number(payload.idSede),
    };
  }

  // Fallback auxiliar a localStorage si el token expiró o no se pudo decodificar
  try {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      const u = JSON.parse(raw);
      return {
        ...u,
        idRol: Number(u.idRol),
        idSede: Number(u.idSede),
      };
    }
  } catch {}

  return null;
};

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