import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { getSessionUser } from '../services/authService';
import { getRoleBadge } from '../shared/utils/formatters';
import { ROUTES, canAccessRoute, getDefaultRouteForRole } from './navigation';

import LoginPage from '../pages/login/LoginPage';
import InicioPage from '../pages/inicio/InicioPage';
import VentasPage from '../pages/ventas/VentasPage';
import CotizacionesPage from '../pages/cotizaciones/CotizacionesPage';
import FacturacionPage from '../pages/facturacion/FacturacionPage';
import InventarioPage from '../pages/inventario/InventarioPage';
import ComprasPage from '../pages/compras/ComprasPage';
import ClientesPage from '../pages/clientes/ClientesPage';
import ReportesPage from '../pages/reportes/ReportesPage';
import EmpleadosPage from '../pages/empleados/EmpleadosPage';
import SedesPage from '../pages/sedes/SedesPage';
import RolesPage from '../pages/roles/RolesPage';
import AccesoDenegadoPage from '../pages/acceso-denegado/AccesoDenegadoPage';

function RoleRoute({ allowedRoles, children }) {
  const currentUser = getSessionUser();
  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;
  const defaultRoute = getDefaultRouteForRole(idRol);

  if (!canAccessRoute(idRol, allowedRoles)) {
    return <AccesoDenegadoPage roleBadge={getRoleBadge(idRol)} defaultRoute={defaultRoute} />;
  }

  return children;
}

export default function AppRouter({ isAuth, onLoginSuccess, onLogout }) {
  if (!isAuth) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage onLoginSuccess={onLoginSuccess} />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    );
  }

  const currentUser = getSessionUser();
  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;
  const defaultRoute = getDefaultRouteForRole(idRol);
  const canAddAdminCatalogs = idRol === 1;

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Navigate to={defaultRoute} replace />} />

      <Route element={<AppLayout onLogout={onLogout} />}>
        <Route index element={<Navigate to={defaultRoute} replace />} />

        <Route
          path={ROUTES.INICIO}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <InicioPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.VENTAS}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <VentasPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.COTIZACIONES}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <CotizacionesPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.FACTURACION}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <FacturacionPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.INVENTARIO}
          element={
            <RoleRoute allowedRoles={[1, 2, 3]}>
              <InventarioPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.COMPRAS}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <ComprasPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.CLIENTES}
          element={
            <RoleRoute allowedRoles={[1, 3]}>
              <ClientesPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.REPORTES}
          element={
            <RoleRoute allowedRoles={[1]}>
              <ReportesPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.EMPLEADOS}
          element={
            <RoleRoute allowedRoles={[1]}>
              <EmpleadosPage canAdd={canAddAdminCatalogs} />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.SEDES}
          element={
            <RoleRoute allowedRoles={[1]}>
              <SedesPage canAdd={canAddAdminCatalogs} />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ROLES}
          element={
            <RoleRoute allowedRoles={[1]}>
              <RolesPage canAdd={canAddAdminCatalogs} />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Route>
    </Routes>
  );
}
