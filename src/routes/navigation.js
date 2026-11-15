export const ROUTES = {
  LOGIN: '/login',
  INICIO: '/inicio',
  VENTAS: '/ventas',
  COTIZACIONES: '/cotizaciones',
  FACTURACION: '/facturacion',
  INVENTARIO: '/inventario',
  COMPRAS: '/compras',
  CLIENTES: '/clientes',
  REPORTES: '/reportes',
  EMPLEADOS: '/empleados',
  SEDES: '/sedes',
  ROLES: '/roles',
  ACCESO_DENEGADO: '/acceso-denegado',
};

// Roles: 1 = Administrador, 2 = Consulta, 3 = Operativo
export const mainNavItems = [
  { id: 'Inicio', path: ROUTES.INICIO, label: 'Inicio', icon: 'home', roles: [1, 3] },
  { id: 'Ventas', path: ROUTES.VENTAS, label: 'Ventas', icon: 'cart', roles: [1, 3] },
  { id: 'Cotizaciones', path: ROUTES.COTIZACIONES, label: 'Cotizaciones', icon: 'file', roles: [1, 3] },
  { id: 'Facturación', path: ROUTES.FACTURACION, label: 'Facturación', icon: 'receipt', roles: [1, 3] },
  { id: 'Inventario', path: ROUTES.INVENTARIO, label: 'Inventario', icon: 'box', badge: '24', roles: [1, 2, 3] },
  { id: 'Compras', path: ROUTES.COMPRAS, label: 'Compras', icon: 'truck', roles: [1, 3] },
  { id: 'Clientes', path: ROUTES.CLIENTES, label: 'Clientes', icon: 'users', roles: [1, 3] },
  { id: 'Reportes', path: ROUTES.REPORTES, label: 'Reportes', icon: 'chart', roles: [1] },
];

export const adminNavItems = [
  { id: 'empleados', path: ROUTES.EMPLEADOS, label: 'Empleados', icon: 'users', roles: [1] },
  { id: 'sedes', path: ROUTES.SEDES, label: 'Sedes', icon: 'building', roles: [1] },
  { id: 'roles', path: ROUTES.ROLES, label: 'Roles', icon: 'shield', roles: [1] },
];

export function canAccessRoute(idRol, allowedRoles = []) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!idRol) return false;
  return allowedRoles.includes(Number(idRol));
}

export function getDefaultRouteForRole(idRol) {
  if (Number(idRol) === 2) return ROUTES.INVENTARIO;
  return ROUTES.INICIO;
}
