import { useState } from 'react';
import { loginUser } from '../services/authService';

export const useLogin = (onSuccess) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({ usuario: usuario.trim(), password });

      // Guardar token JWT y datos del usuario en localStorage
      const token = data.access_token || data.token;
      if (token) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('token', token);
      }
      if (data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return {
    usuario,
    setUsuario,
    password,
    setPassword,
    error,
    loading,
    handleLogin,
  };
};