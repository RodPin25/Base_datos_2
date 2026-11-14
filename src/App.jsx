import { useState } from 'react';
import AppRouter from './routes/AppRouter';
import './App.css';

function hasStoredToken() {
  return Boolean(localStorage.getItem('access_token') || localStorage.getItem('token'));
}

function App() {
  const [isAuth, setIsAuth] = useState(hasStoredToken);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuth(false);
  };

  return (
    <AppRouter
      isAuth={isAuth}
      onLoginSuccess={handleLoginSuccess}
      onLogout={handleLogout}
    />
  );
}

export default App;
