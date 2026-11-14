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

export const mainNavItems = [
  { id: 'Inicio', path: ROUTES.INICIO, label: 'Inicio', icon: 'home' },
  { id: 'Ventas', path: ROUTES.VENTAS, label: 'Ventas', icon: 'cart' },
  { id: 'Cotizaciones', path: ROUTES.COTIZACIONES, label: 'Cotizaciones', icon: 'file' },
  { id: 'Facturación', path: ROUTES.FACTURACION, label: 'Facturación', icon: 'receipt' },
  { id: 'Inventario', path: ROUTES.INVENTARIO, label: 'Inventario', icon: 'box', badge: '24' },
  { id: 'Compras', path: ROUTES.COMPRAS, label: 'Compras', icon: 'truck' },
  { id: 'Clientes', path: ROUTES.CLIENTES, label: 'Clientes', icon: 'users' },
  { id: 'Reportes', path: ROUTES.REPORTES, label: 'Reportes', icon: 'chart' },
];

export const adminNavItems = [
  { id: 'empleados', path: ROUTES.EMPLEADOS, label: 'Empleados', icon: 'users' },
  { id: 'sedes', path: ROUTES.SEDES, label: 'Sedes', icon: 'building' },
  { id: 'roles', path: ROUTES.ROLES, label: 'Roles', icon: 'shield' },
];
