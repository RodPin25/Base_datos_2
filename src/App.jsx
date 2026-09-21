import { useState, useEffect } from 'react';
import Login from './auth/components/Login';
import Layout from './dashboard/components/Layout';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Si ya existe token de sesión guardado, mantener al usuario autenticado
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      setIsAuth(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuth(false);
  };

  if (!isAuth) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout onLogout={handleLogout} />
  );
}

export default App;
