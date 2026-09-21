// Centralized API configuration and fetch wrapper
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Normaliza la URL agregando pleca final si no la tiene (requerido por Django)
 */
const normalizeUrl = (url) => {
  return url.endsWith('/') ? url : `${url}/`;
};

/**
 * Cliente HTTP para realizar peticiones al backend de Django
 */
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = normalizeUrl(`${API_URL}${cleanEndpoint}`);

  const token = localStorage.getItem('access_token') || localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.Mensaje || data?.message || data?.detail || JSON.stringify(data?.errors || 'Error en la petición');
    throw new Error(errorMsg);
  }

  return data;
};

