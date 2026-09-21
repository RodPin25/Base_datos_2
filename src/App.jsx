import React, { useState } from 'react';
import Login from './auth/components/Login';
import Layout from './dashboard/components/Layout';

function App() {
  // Estado para controlar la sesión (puedes verificar si hay un token en localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout onLogout={() => setIsAuthenticated(false)} />
  );
}

export default App;