export const money = (value) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(Number(value || 0));

export function getRoleBadge(idRol) {
  if (idRol === 1) return 'Rol 1 · Administrador';
  if (idRol === 2) return 'Rol 2 · Consulta';
  if (idRol === 3) return 'Rol 3 · Operativo';
  return `Rol #${idRol || 'N/A'}`;
}

