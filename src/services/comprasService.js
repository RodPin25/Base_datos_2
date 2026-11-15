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
                PrecioCosto: Number(d.PrecioCosto).toFixed(2)
            }))
        })
    });
}