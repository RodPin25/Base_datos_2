import { apiFetch } from "./api";

/**
 * Registra el ingreso de mercadería a bodega en dbo.EntregaProveedores, dbo.EntregaProveedoresItems y actualiza dbo.Stock y dbo.CompraProveedorItem.
 */
export const bodegaIngreso = async ({
    IdOrdenCompra,
    IdEmpleado,
    IdSede,
    DetalleIngreso = []
}) => {
    return await apiFetch(`/bodega/ingreso/`,{
        method:'POST',
        body: JSON.stringify({
            IdOrdenCompra:Number(IdOrdenCompra),
            IdEmpleado:Number(IdEmpleado),
            IdSede:Number(IdSede),
            DetalleIngreso: DetalleIngreso.map((d) => ({
                IdProducto:Number(d.IdProducto),
                CantidadIngresada:Number(d.CantidadIngresada)
            }))
        })
    });
}

/**
 * Crea una orden de compra a proveedor en dbo.CompraProveedor y dbo.CompraProveedorItem usando dbo.DetalleCompraUDT.
 */
export const crearOrdenCompra = async ({
    IdProveedor,
    IdEmpleado,
    Detalles = []
}) => {
    return await apiFetch('/ordenes-compra/crear/',{
        method:'POST',
        body: JSON.stringify({
            IdProveedor:Number(IdProveedor),
            IdEmpleado:Number(IdEmpleado),
            Detalles: Detalles.map((d) => ({
                IdProducto: Number(d.IdProducto),
                Cantidad:Number(d.Cantidad),
                PrecioCosto: Number(Number(d.PrecioCosto).toFixed(2))
            }))
        })
    });
}

/**
 * Obtiene todas las órdenes de compra a proveedores (dbo.sp_ObtenerOrdenesCompra).
 */
export const getOrdenesCompra = async () => {
    return await apiFetch('/ordenes-compra/', { method: 'GET' });
};

/**
 * Obtiene el catálogo de proveedores si está disponible en el backend.
 */
export const getProveedores = async () => {
    return await apiFetch('/proveedores/', { method: 'GET' });
};

/**
 * Consulta órdenes de compra a proveedores mediante dbo.sp_ObtenerOrdenesCompra.
 */
export const consultarOrdenID = async ({
    id
}) => {
    return await apiFetch('/ordenes-compra/',{
        method:'POST',
        body:JSON.stringify({
            id:Number(id)
        })
    });
}


/**
 * Consulta órdenes de compra a proveedores mediante dbo.sp_ObtenerOrdenesCompra.
 */
export const detalleOrden = async () => {
    return await apiFetch('/ordenes-compra/detalle/', {method:'GET'});
}


/**
 * Obtiene el encabezado y los ítems detallados de una orden de compra específica.
 */
export const detalleOrdenId = async ({
    id
}) => {
    return await apiFetch('/ordenes-compra/detalle/',{
        method:'POST',
        body: JSON.stringify({
            id:Number(id)
        })
    });
}