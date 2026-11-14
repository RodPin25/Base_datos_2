import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { getRoleBadge } from '../shared/utils/formatters';
import { getSessionUser } from '../services/authService';
import { ROUTES } from './navigation';

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

function AdminRoute({ children }) {
  const currentUser = getSessionUser();
  const idRol = currentUser?.idRol ? Number(currentUser.idRol) : null;
  const canViewAdminCatalogs = idRol !== 3;
  const canAddAdminCatalogs = idRol === 1;

  if (!canViewAdminCatalogs) {
    return <AccesoDenegadoPage roleBadge={getRoleBadge(idRol)} />;
  }

  return React.cloneElement(children, { canAdd: canAddAdminCatalogs });
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

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.INICIO} replace />} />

      <Route element={<AppLayout onLogout={onLogout} />}>
        <Route index element={<Navigate to={ROUTES.INICIO} replace />} />
        <Route path={ROUTES.INICIO} element={<InicioPage />} />
        <Route path={ROUTES.VENTAS} element={<VentasPage />} />
        <Route path={ROUTES.COTIZACIONES} element={<CotizacionesPage />} />
        <Route path={ROUTES.FACTURACION} element={<FacturacionPage />} />
        <Route path={ROUTES.INVENTARIO} element={<InventarioPage />} />
        <Route path={ROUTES.COMPRAS} element={<ComprasPage />} />
        <Route path={ROUTES.CLIENTES} element={<ClientesPage />} />
        <Route path={ROUTES.REPORTES} element={<ReportesPage />} />

        <Route
          path={ROUTES.EMPLEADOS}
          element={
            <AdminRoute>
              <EmpleadosPage />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.SEDES}
          element={
            <AdminRoute>
              <SedesPage />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ROLES}
          element={
            <AdminRoute>
              <RolesPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.INICIO} replace />} />
      </Route>
    </Routes>
  );
}
