import React, { useState } from 'react';
import './Layout.css';

// Importa aquí las vistas principales de tus carpetas
// (Asumiendo que las rutas de tus carpetas principales están organizadas)
import UserList from '../usuarios/components/UserList';
// import InventarioView from '../inventario/components/InventarioView';
// import FacturacionView from '../facturacion/components/FacturacionView';
// import ComprasView from '../compras/components/ComprasView';
// import DevolucionesView from '../devoluciones/components/DevolucionesView';
// import ReportesView from '../reportes/components/ReportesView';

const Layout = ({ onLogout }) => {
  // Estado para controlar qué módulo está activo ('usuarios', 'inventario', etc.)
  const [currentModule, setCurrentModule] = useState('usuarios');

  // Función para renderizar dinámicamente el módulo seleccionado
  const renderModule = () => {
    switch (currentModule) {
      case 'usuarios':
        return <UserList />;
      case 'inventario':
        return <div className="placeholder-module"><h2>Módulo de Inventario</h2><p>Aquí irá tu MasterTable de Inventario.</p></div>;
      case 'compras':
        return <div className="placeholder-module"><h2>Módulo de Compras</h2><p>Aquí irá tu MasterTable de Compras.</p></div>;
      case 'facturacion':
        return <div className="placeholder-module"><h2>Módulo de Facturación</h2><p>Aquí irá tu MasterTable de Facturación.</p></div>;
      case 'devoluciones':
        return <div className="placeholder-module"><h2>Módulo de Devoluciones</h2><p>Aquí irá tu MasterTable de Devoluciones.</p></div>;
      case 'reportes':
        return <div className="placeholder-module"><h2>Módulo de Reportes</h2><p>Aquí irán tus gráficos y reportes de BD2.</p></div>;
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
          <span>Panel de Control</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentModule === 'usuarios' ? 'active' : ''}`}
            onClick={() => setCurrentModule('usuarios')}
          >
            👥 Usuarios
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
            className={`nav-item ${currentModule === 'devoluciones' ? 'active' : ''}`}
            onClick={() => setCurrentModule('devoluciones')}
          >
            🔄 Devoluciones
          </button>
          <button 
            className={`nav-item ${currentModule === 'reportes' ? 'active' : ''}`}
            onClick={() => setCurrentModule('reportes')}
          >
            📊 Reportes
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
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
            <span className="user-name">Administrador BD2</span>
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