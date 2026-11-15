import { apiFetch } from "./api";

const BASE_API = '/reportes'

/**
 * Obtiene la bitacora completa
 */
export const getBitacora = async () => {
    return await apiFetch(`${BASE_API}/bitacora/`,{
        method:"GET"
    });
}

/**
 * Guarda en la bitacora
 */
export const insertarBitacora = async ({
    FechaInicio,
    FechaFin,
    IdEmpleado,
}) => {
    return await apiFetch(`${BASE_API}/bitacora/`, {
        method:'POST',
        body: JSON.stringify({
            FechaInicio: FechaInicio,
            FechaFin: FechaFin,
            IdEmpleado:Number(IdEmpleado)
        })
    });
}

/**
 * Obtiene el reporte de las compras que se han realizado a proveedores.
 */
export const getComprasProveedores = async () => {
    return await apiFetch(`${BASE_API}/compras-proveedores/`,{ method:'GET' });
}

/**
 * Reporte de órdenes de compra a proveedores y su estado de recepción en bodega mediante dbo.sp_ReporteComprasProveedores.
 */
export const getComprasProveedoresFecha = async ({
    FechaInicio = null,
    FechaFin = null,
    IdProveedor = null
}) => {
    return await apiFetch(`${BASE_API}/compras-proveedores/`,{
        method:'POST',
        body:JSON.stringify({
            ...(FechaInicio ? { FechaInicio } : {}),
            ...(FechaFin ? { FechaFin } : {}),
            ...(IdProveedor ? { IdProveedor: Number(IdProveedor) } : {})
        })
    });
}

/**
 * Reporte de inventario y valoración de stock por sede (con filtro opcional de stock mínimo) mediante dbo.sp_ReporteInventarioStock.
 */
export const getInventario = async () =>{
    return await apiFetch(`${BASE_API}/inventario-stock/`,{
        method:'GET'
    });
}

/**
 * Reporte de inventario y valoración de stock por sede (con filtro opcional de stock mínimo) mediante dbo.sp_ReporteInventarioStock.
 */
export const getInventarioFilter = async ({
    IdSede = null,
    StockMinimo = null
}) =>{
    return await apiFetch(`${BASE_API}/inventario-stock/`,{
        method:'POST',
        body: JSON.stringify({
            ...(IdSede ? { IdSede: Number(IdSede) } : {}),
            ...(StockMinimo !== null && StockMinimo !== undefined ? { StockMinimo: Number(StockMinimo) } : {})
        })
    });
}

/**
 * Ranking de productos más vendidos (excluyendo facturas anuladas) mediante dbo.sp_ReporteProductosMasVendidos.
 */
export const getMasVendidos = async () =>{
    return await apiFetch(`${BASE_API}/productos-mas-vendidos/`,{method:'GET'});
}

/**
 * Ranking de productos más vendidos (excluyendo facturas anuladas) mediante dbo.sp_ReporteProductosMasVendidos.
 */
export const getMasVendidosFilter = async ({
    FechaInicio = null,
    FechaFin = null,
    IdSede = null,
    Top = 10
}) => {
    return await apiFetch(`${BASE_API}/productos-mas-vendidos/`,{
        method:'POST',
        body:JSON.stringify({
            ...(FechaInicio ? { FechaInicio } : {}),
            ...(FechaFin ? { FechaFin } : {}),
            ...(IdSede ? { IdSede: Number(IdSede) } : {}),
            ...(Top ? { Top: Number(Top) } : {})
        })
    });
}

/**
 * Reporte detallado de ventas y facturas con filtros por fecha, sede, empleado y estado mediante dbo.sp_ReporteVentas.
 */
export const getVentas = async () => {
    return await apiFetch(`${BASE_API}/ventas/`,{method:'GET'});
}

/**
 * Reporte detallado de ventas y facturas con filtros por fecha, sede, empleado y estado mediante dbo.sp_ReporteVentas.
 */
export const getVentasFilter = async ({
    FechaInicio = null,
    FechaFin = null,
    IdSede = null,
    IdEmpleado = null,
    IncluirAnuladas = true
}) =>  {
    return await apiFetch(`${BASE_API}/ventas/`,{
        method:'POST',
        body:JSON.stringify({
            ...(FechaInicio ? { FechaInicio } : {}),
            ...(FechaFin ? { FechaFin } : {}),
            ...(IdSede ? { IdSede: Number(IdSede) } : {}),
            ...(IdEmpleado ? { IdEmpleado: Number(IdEmpleado) } : {}),
            IncluirAnuladas:Boolean(IncluirAnuladas)
        })
    });
}

/**
 * KPIs resumidos de ventas (facturas activas, anuladas, total vendido, total anulado, ticket promedio) mediante dbo.sp_ReporteResumenVentas.
 */
export const getResumen = async () =>{
    return await apiFetch(`${BASE_API}/ventas/resumen/`,{method:'GET'});
}

/**
 * KPIs resumidos de ventas (facturas activas, anuladas, total vendido, total anulado, ticket promedio) mediante dbo.sp_ReporteResumenVentas.
 */
export const getResumenFilter = async ({
    FechaInicio = null,
    FechaFin = null,
    IdSede = null
}) => {
    return await apiFetch(`${BASE_API}/ventas/resumen/`,{
        method:'POST',
        body:JSON.stringify({
            ...(FechaInicio ? { FechaInicio } : {}),
            ...(FechaFin ? { FechaFin } : {}),
            ...(IdSede ? { IdSede: Number(IdSede) } : {})
        })
    });
}