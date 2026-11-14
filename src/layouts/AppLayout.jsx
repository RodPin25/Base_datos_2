import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../shared/components/Icon';
import { logoutUser, getSessionUser } from '../services/authService';
import { getRoleBadge } from '../shared/utils/formatters';
import { ROUTES, mainNavItems, adminNavItems } from '../routes/navigation';
import './AppLayout.css';

export default function AppLayout({ onLogout }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getSessionUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;
  const canViewAdminCatalogs = idRol !== 3;
  const roleBadge = getRoleBadge(idRol);

  useEffect(() => {
    const userFromJwt = getSessionUser();
    if (userFromJwt) {
      setCurrentUser(userFromJwt);
    }
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) onLogout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const displayName = currentUser?.Usuario || 'Usuario';
  const avatarInitials =
    displayName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>Colora</strong>
            <small>Gestión comercial</small>
          </div>
        </div>

        <button
          type="button"
          className="mobile-close"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        >
          <Icon name="close" />
        </button>

        <p className="nav-caption">MENÚ PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        {canViewAdminCatalogs && (
          <>
            <p className="nav-caption" style={{ marginTop: 18 }}>
              ADMINISTRACIÓN BD
            </p>
            <nav aria-label="Catálogos de administración">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="sidebar-help" style={{ marginTop: 'auto' }}>
          <div className="help-icon">
            <Icon name="bell" size={18} />
          </div>
          <strong>¿Necesitas ayuda?</strong>
          <p>Consulta la guía rápida para aprender a usar el sistema.</p>
          <button type="button" onClick={() => navigate(ROUTES.INICIO)}>
            Ver resumen
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{avatarInitials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{roleBadge}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <div className={`search ${searchOpen ? 'search-expanded' : ''}`}>
            <Icon name="search" size={19} />
            <input
              aria-label="Buscar"
              placeholder="Buscar productos, facturas o clientes..."
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
            <kbd>⌘ K</kbd>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Notificaciones"
              onClick={() => setNoticeOpen(!noticeOpen)}
            >
              <Icon name="bell" size={21} />
              <span />
            </button>
            <div className="top-divider" />
            <button className="location-button" type="button">
              <span className="location-dot" />
              <span>
                <small>SUCURSAL / SESIÓN</small>
                <strong>
                  {currentUser?.idSede ? `Sede #${currentUser.idSede}` : 'Central'} · {roleBadge}
                </strong>
              </span>
              <span>⌄</span>
            </button>
          </div>

          {noticeOpen && (
            <div className="notification-popover">
              <strong>Notificaciones</strong>
              <p>Tienes 4 órdenes pendientes de recibir hoy.</p>
              <button
                type="button"
                onClick={() => {
                  navigate(ROUTES.COMPRAS);
                  setNoticeOpen(false);
                }}
              >
                Revisar órdenes
              </button>
            </div>
          )}
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
