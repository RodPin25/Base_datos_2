import React from 'react';
import { useLogin } from '../hooks/useLogin';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const {
    usuario,
    setUsuario,
    password,
    setPassword,
    error,
    loading,
    handleLogin,
  } = useLogin(onLoginSuccess);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Bases de Datos 2</h2>
          <p>Módulo de Autenticación</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              placeholder="Ingresa tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;