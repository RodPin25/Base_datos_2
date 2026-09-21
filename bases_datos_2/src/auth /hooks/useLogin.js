import { useState } from 'react';
import { loginUser } from '../services/authService';

export const useLogin = (onSuccess) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      
      // Guardar el token en localStorage (por ejemplo)
      localStorage.setItem('token', data.token);
      
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleLogin,
  };
};