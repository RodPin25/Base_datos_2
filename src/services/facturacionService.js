import { apiFetch } from './api';

/**
 * Obtiene los clientes registrados (dbo.sp_Clientes_Seleccionar)
 */
export const getClientes = async (id = null) => {
  const endpoint = id ? `/clientes/?id=${id}` : '/clientes/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Obtiene los productos disponibles (dbo.sp_Productos_Seleccionar)
 */
export const getProductos = async (id = null) => {
  const endpoint = id ? `/productos/?id=${id}` : '/productos/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Obtiene los métodos de pago (dbo.sp_ObtenerMediosPago)
 */
export const getMediosPago = async () => {
  return await apiFetch('/medios-pago/', { method: 'GET' });
};

/**
 * Obtiene todas las cotizaciones (dbo.sp_ObtenerCotizaciones)
 */
export const getCotizaciones = async (id = null) => {
  const endpoint = id ? `/cotizaciones/?id=${id}` : '/cotizaciones/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Obtiene el encabezado e ítems de una cotización (dbo.sp_ObtenerDetalleCotizacion)
 */
export const getDetalleCotizacion = async (idCotizacion) => {
  return await apiFetch(`/cotizaciones/detalle/?id=${idCotizacion}`, { method: 'GET' });
};

/**
 * Crea una nueva cotización (dbo.sp_CrearCotizacion)
 */
export const crearCotizacion = async ({ IdCliente, DiasValidez = 15, IdSede = null, Detalles }) => {
  return await apiFetch('/cotizaciones/crear/', {
    method: 'POST',
    body: JSON.stringify({
      IdCliente: Number(IdCliente),
      DiasValidez: Number(DiasValidez),
      ...(IdSede ? { IdSede: Number(IdSede) } : {}),
      Detalles: Detalles.map((d) => ({
        IdProducto: Number(d.IdProducto),
        Cantidad: Number(d.Cantidad),
        PrecioUnitario: Number(d.PrecioUnitario).toFixed(2),
      })),
    }),
  });
};

/**
 * Obtiene todas las facturas emitidas (dbo.sp_ObtenerFacturas)
 */
export const getFacturas = async (id = null) => {
  const endpoint = id ? `/facturas/?id=${id}` : '/facturas/';
  return await apiFetch(endpoint, { method: 'GET' });
};

/**
 * Obtiene el encabezado y los ítems de una factura (dbo.sp_ObtenerDetalleFactura)
 */
export const getDetalleFactura = async (idFactura) => {
  return await apiFetch(`/facturas/detalle/?id=${idFactura}`, { method: 'GET' });
};

/**
 * Genera una factura directa o desde una cotización (dbo.sp_GenerarFactura)
 */
export const generarFactura = async ({
  IdCliente = null,
  IdMedioPago,
  IdCotizacion = null,
  IdEmpleado = null,
  IdSede = null,
  Detalles = [],
}) => {
  return await apiFetch('/facturas/generar/', {
    method: 'POST',
    body: JSON.stringify({
      ...(IdCliente ? { IdCliente: Number(IdCliente) } : {}),
      IdMedioPago: Number(IdMedioPago),
      ...(IdCotizacion ? { IdCotizacion: Number(IdCotizacion) } : {}),
      ...(IdEmpleado ? { IdEmpleado: Number(IdEmpleado) } : {}),
      ...(IdSede ? { IdSede: Number(IdSede) } : {}),
      Detalles: Detalles.map((d) => ({
        IdProducto: Number(d.IdProducto),
        Cantidad: Number(d.Cantidad),
        PrecioUnitario: Number(d.PrecioUnitario).toFixed(2),
      })),
    }),
  });
};
/**
 * Obtiene todas las facturas anuladas
 */
export const getAnulaciones = async () =>{
  return await apiFetch('/facturas/anulaciones/',{ method: 'GET' });
}

/**
 * Obtiene la factura anulada por medio del Id de la anulacion, no ID de factura.
 */
export const getAnulacionesId = async ({ id }) =>{
  return await apiFetch('/facturas/anulaciones/',{ 
    method: 'POST',
    body: JSON.stringify({
      id:Number(id),
    }) 
  });
}

/**
 * Anula una factura por medio del sp de anulacion de facturas
 */
export const anularFactura = async ({
  IdFactura,
  Motivo = null,
  IdEmpleado = null,
  IdSede = null,
}) => {
  return await apiFetch('/facturas/anular/', {
    method: 'POST',
    body: JSON.stringify({
      IdFactura: Number(IdFactura),
      ...(Motivo ? { Motivo } : {}),
      ...(IdEmpleado ? { IdEmpleado: Number(IdEmpleado) } : {}),
      ...(IdSede ? { IdSede: Number(IdSede) } : {}),
    }),
  });
};

/**
 * Registra el pago de una factura (dbo.sp_RegistrarPago)
 */
export const registrarPago = async ({ IdFactura, IdMedioPago, MontoPagado, Referencia = null }) => {
  return await apiFetch('/pagos/registrar/', {
    method: 'POST',
    body: JSON.stringify({
      IdFactura: Number(IdFactura),
      IdMedioPago: Number(IdMedioPago),
      MontoPagado: Number(MontoPagado).toFixed(2),
      Referencia: Referencia || null,
    }),
  });
};
