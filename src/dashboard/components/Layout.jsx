import React, { useState, useEffect } from 'react';
import './Layout.css';
import UserList from '../../users/components/UserList';
import SedeList from '../../sedes/components/SedeList';
import RolList from '../../roles/components/RolList';
import { logoutUser, getSessionUser } from '../../auth/services/authService';

const Layout = ({ onLogout }) => {
  // Obtener la información y el rol del usuario decodificado directamente del JWT
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());

  // Extraer idRol directamente del payload del JWT (ej: 1, 2, 3)
  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;

  // Reglas de filtrado por rol:
  // - Rol 1: Muestra todo y permite agregar en empleados, sedes y roles.
  // - Rol 2: Muestra todo, pero sin botones de agregar en empleados, sedes y roles.
  // - Rol 3: No muestra ni permite empleados, sedes ni roles.
  const canViewAdminCatalogs = idRol !== 3;
  const canAddAdminCatalogs = idRol === 1;

  // Si es Rol 3, no puede iniciar en 'empleados', inicia en 'inventario'
  const [currentModule, setCurrentModule] = useState(() => {
    return idRol === 3 ? 'inventario' : 'empleados';
  });

  useEffect(() => {
    const userFromJwt = getSessionUser();
    if (userFromJwt) {
      setCurrentUser(userFromJwt);
      if (Number(userFromJwt.idRol) === 3 && ['empleados', 'sedes', 'roles'].includes(currentModule)) {
        setCurrentModule('inventario');
      }
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) onLogout();
  };

  // Función para renderizar dinámicamente el módulo seleccionado
  const renderModule = () => {
    // Protección de ruta: Rol 3 no tiene permitido ver empleados, sedes ni roles
    if (!canViewAdminCatalogs && ['empleados', 'sedes', 'roles'].includes(currentModule)) {
      return (
        <div className="placeholder-module" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>🚫 Acceso Denegado</h2>
          <p>Tu rol (Rol #{idRol}) no tiene permisos para acceder a este módulo.</p>
        </div>
      );
    }

    switch (currentModule) {
      case 'empleados':
        return <UserList canAdd={canAddAdminCatalogs} />;
      case 'sedes':
        return <SedeList canAdd={canAddAdminCatalogs} />;
      case 'roles':
        return <RolList canAdd={canAddAdminCatalogs} />;
      case 'inventario':
        return (
          <div className="placeholder-module">
            <h2>📦 Módulo de Inventario</h2>
            <p>Módulo habilitado según permisos de tu rol.</p>
          </div>
        );
      case 'compras':
        return (
          <div className="placeholder-module">
            <h2>🛒 Módulo de Compras</h2>
            <p>Módulo habilitado según permisos de tu rol.</p>
          </div>
        );
      case 'facturacion':
        return (
          <div className="placeholder-module">
            <h2>📄 Módulo de Facturación</h2>
            <p>Módulo habilitado según permisos de tu rol.</p>
          </div>
        );
      case 'reportes':
        return (
          <div className="placeholder-module">
            <h2>📊 Módulo de Reportes</h2>
            <p>Módulo habilitado según permisos de tu rol.</p>
          </div>
        );
      default:
        return canViewAdminCatalogs ? <UserList canAdd={canAddAdminCatalogs} /> : <div className="placeholder-module"><h2>Bienvenido</h2></div>;
    }
  };

  const getRoleBadge = () => {
    if (idRol === 1) return 'Rol 1 (Administrador total)';
    if (idRol === 2) return 'Rol 2 (Solo lectura catálogos)';
    if (idRol === 3) return 'Rol 3 (Operativo - Restringido)';
    return `Rol #${idRol || 'N/A'}`;
  };

  return (
    <div className="dashboard-container">
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Bases de Datos 2</h2>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {getRoleBadge()}
          </span>
        </div>

        <nav className="sidebar-nav">
          {/* Módulos de Empleados, Sedes y Roles: Se ocultan completamente si el rol es 3 */}
          {canViewAdminCatalogs && (
            <>
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
            </>
          )}

          {/* Módulos comunes a todos los roles */}
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="user-name">
                {currentUser?.Usuario || 'Usuario'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {getRoleBadge()}
              </span>
            </div>
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