import React, { useState, useEffect } from 'react';
import './Layout.css';
import UserList from '../../users/components/UserList';
import SedeList from '../../sedes/components/SedeList';
import RolList from '../../roles/components/RolList';
import { logoutUser } from '../../auth/services/authService';

const Layout = ({ onLogout }) => {
  // Estado para controlar qué módulo está activo ('empleados', 'sedes', 'roles', etc.)
  const [currentModule, setCurrentModule] = useState('empleados');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('usuario');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Ignorar si no hay JSON válido
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) onLogout();
  };

  // Función para renderizar dinámicamente el módulo seleccionado
  const renderModule = () => {
    switch (currentModule) {
      case 'empleados':
        return <UserList />;
      case 'sedes':
        return <SedeList />;
      case 'roles':
        return <RolList />;
      case 'inventario':
        return <div className="placeholder-module"><h2>Módulo de Inventario</h2><p>Próximamente disponible.</p></div>;
      case 'compras':
        return <div className="placeholder-module"><h2>Módulo de Compras</h2><p>Próximamente disponible.</p></div>;
      case 'facturacion':
        return <div className="placeholder-module"><h2>Módulo de Facturación</h2><p>Próximamente disponible.</p></div>;
      case 'reportes':
        return <div className="placeholder-module"><h2>Módulo de Reportes</h2><p>Próximamente disponible.</p></div>;
      default:
        return <UserList />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Bases de Datos 2</h2>
          <span>Proyecto Final</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentModule === 'empleados' ? 'active' : ''}`}
            onClick={() => setCurrentModule('empleados')}
          >
            👥 Empleados
          </button>
          <button 
            className={`nav-item ${currentModule === 'sedes' ? 'active' : ''}`}
            onClick={() => setCurrentModule('sedes')}
          >
            🏢 Sedes
          </button>
          <button 
            className={`nav-item ${currentModule === 'roles' ? 'active' : ''}`}
            onClick={() => setCurrentModule('roles')}
          >
            🛡️ Roles
          </button>
          <button 
            className={`nav-item ${currentModule === 'inventario' ? 'active' : ''}`}
            onClick={() => setCurrentModule('inventario')}
          >
            📦 Inventario
          </button>
          <button 
            className={`nav-item ${currentModule === 'compras' ? 'active' : ''}`}
            onClick={() => setCurrentModule('compras')}
          >
            🛒 Compras
          </button>
          <button 
            className={`nav-item ${currentModule === 'facturacion' ? 'active' : ''}`}
            onClick={() => setCurrentModule('facturacion')}
          >
            📄 Facturación
          </button>
          <button 
            className={`nav-item ${currentModule === 'reportes' ? 'active' : ''}`}
            onClick={() => setCurrentModule('reportes')}
          >
            📊 Reportes
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content-wrapper">
        {/* BARRA SUPERIOR (NAVBAR) */}
        <header className="top-navbar">
          <div className="navbar-title">
            <span>Sistema de Gestión / <strong>{currentModule.toUpperCase()}</strong></span>
          </div>
          <div className="navbar-user">
            <span className="user-avatar">👤</span>
            <span className="user-name">
              {currentUser ? `${currentUser.Usuario || 'Usuario'} (Sede #${currentUser.idSede || '1'})` : 'Sesión Activa'}
            </span>
          </div>
        </header>

        {/* CONTENEDOR DINÁMICO */}
        <main className="content-area">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default Layout;