"""
schemas.py - Schemas (request/response) para Autenticación, Sedes, Roles, Empleados,
Clientes, Proveedores, Productos, Facturación, Pagos, Órdenes de Compra y Bodega.
"""
from rest_framework import serializers


# =============================================================================
# AUTH / LOGIN
# =============================================================================

class LoginRequest(serializers.Serializer):
    Usuario = serializers.CharField(max_length=255, help_text="Nombre de usuario")
    Password = serializers.CharField(max_length=255, write_only=True, help_text="Contraseña en texto plano")


class UsuarioInfoResponse(serializers.Serializer):
    idEmpleado = serializers.IntegerField()
    Usuario = serializers.CharField()
    idRol = serializers.IntegerField()
    idSede = serializers.IntegerField()


class LoginResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    access_token = serializers.CharField()
    token_type = serializers.CharField(default="Bearer")
    usuario = UsuarioInfoResponse()


class MessageResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()


class DeleteResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    IdEliminado = serializers.IntegerField(allow_null=True, required=False)


class IdDeleteRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del registro a eliminar")


class SesionActualResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    usuario = serializers.DictField()


# =============================================================================
# SEDES
# =============================================================================

class NewSedeRequest(serializers.Serializer):
    Nombre = serializers.CharField(max_length=255, help_text="Nombre de la sede")
    Direccion = serializers.CharField(max_length=255, help_text="Dirección de la sede")
    Contacto = serializers.CharField(max_length=255, help_text="Número o dato de contacto")


class UpdateSedeRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID de la sede a actualizar")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre de la sede")
    Direccion = serializers.CharField(max_length=255, help_text="Dirección de la sede")
    Contacto = serializers.CharField(max_length=255, help_text="Número o dato de contacto")


class NewSedeResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    Id = serializers.IntegerField(allow_null=True)
    Nombre = serializers.CharField(allow_null=True)
    Direccion = serializers.CharField(allow_null=True)
    Contacto = serializers.CharField(allow_null=True)


class SedeRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la sede a consultar (opcional, si no se envía o es null devuelve todas)")


class SedeResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Nombre = serializers.CharField()
    Direccion = serializers.CharField()
    Contacto = serializers.CharField()


# Aliases
SedeCreateRequest = NewSedeRequest
SedeGetRequest = SedeRequest


# =============================================================================
# ROLES
# =============================================================================

class NewRolRequest(serializers.Serializer):
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del rol")


class UpdateRolRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del rol a actualizar")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del rol")


class NewRolResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    Id = serializers.IntegerField(allow_null=True)
    Nombre = serializers.CharField(allow_null=True)


class RolRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del rol a consultar (opcional, si no se envía o es null devuelve todos)")


class RolResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Nombre = serializers.CharField()


# Aliases
RolCreateRequest = NewRolRequest
RolGetRequest = RolRequest


# =============================================================================
# EMPLEADOS
# =============================================================================

class NewEmpleadoRequest(serializers.Serializer):
    Nombres = serializers.CharField(max_length=255, help_text="Nombres del empleado")
    Apellidos = serializers.CharField(max_length=255, help_text="Apellidos del empleado")
    Correo = serializers.CharField(max_length=255, required=False, default=None, allow_null=True, allow_blank=True, help_text="Correo electrónico (opcional)")
    idSede = serializers.IntegerField(help_text="ID de la sede a la que pertenece")
    idRol = serializers.IntegerField(help_text="ID del rol asignado")
    Usuario = serializers.CharField(max_length=255, help_text="Nombre de usuario para login")
    Password = serializers.CharField(max_length=255, write_only=True, help_text="Contraseña en texto plano (se hashea con Argon2 en backend)")


class UpdateEmpleadoRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del empleado a actualizar")
    Nombres = serializers.CharField(max_length=255, help_text="Nombres del empleado")
    Apellidos = serializers.CharField(max_length=255, help_text="Apellidos del empleado")
    Correo = serializers.CharField(max_length=255, required=False, default=None, allow_null=True, allow_blank=True, help_text="Correo electrónico (opcional)")
    idSede = serializers.IntegerField(help_text="ID de la sede a la que pertenece")
    idRol = serializers.IntegerField(help_text="ID del rol asignado")
    Usuario = serializers.CharField(max_length=255, required=False, default=None, allow_null=True, allow_blank=True, help_text="Nuevo usuario (opcional)")
    Password = serializers.CharField(max_length=255, write_only=True, required=False, default=None, allow_null=True, allow_blank=True, help_text="Nueva contraseña (opcional)")


class NewEmpleadoResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    Id = serializers.IntegerField(allow_null=True)
    Nombres = serializers.CharField(allow_null=True)
    Apellidos = serializers.CharField(allow_null=True)
    Correo = serializers.CharField(allow_null=True)
    idSede = serializers.IntegerField(allow_null=True)
    SedeNombre = serializers.CharField(allow_null=True)
    idRol = serializers.IntegerField(allow_null=True)
    RolNombre = serializers.CharField(allow_null=True)
    Usuario = serializers.CharField(allow_null=True)


class EmpleadoRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del empleado a consultar (opcional, si no se envía o es null devuelve todos)")


class EmpleadoResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Nombres = serializers.CharField()
    Apellidos = serializers.CharField()
    Correo = serializers.CharField(allow_null=True)
    idSede = serializers.IntegerField()
    SedeNombre = serializers.CharField()
    idRol = serializers.IntegerField()
    RolNombre = serializers.CharField()
    Usuario = serializers.CharField(allow_null=True)


# Aliases
EmpleadoCreateRequest = NewEmpleadoRequest
EmpleadoGetRequest = EmpleadoRequest


# =============================================================================
# CLIENTES
# =============================================================================

class ClienteRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del cliente a consultar (opcional)")


class NewClienteRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del cliente (opcional, se autogenera si no se envía)")
    Nombres = serializers.CharField(max_length=255, help_text="Nombres del cliente")
    Apellidos = serializers.CharField(max_length=255, help_text="Apellidos del cliente")
    NIT = serializers.CharField(max_length=255, help_text="NIT del cliente")


class UpdateClienteRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del cliente a actualizar")
    Nombres = serializers.CharField(max_length=255, help_text="Nombres del cliente")
    Apellidos = serializers.CharField(max_length=255, help_text="Apellidos del cliente")
    NIT = serializers.CharField(max_length=255, help_text="NIT del cliente")


class ClienteResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Nombres = serializers.CharField()
    Apellidos = serializers.CharField()
    NIT = serializers.CharField()


# =============================================================================
# PROVEEDORES
# =============================================================================

class ProveedorRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del proveedor a consultar (opcional)")


class NewProveedorRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del proveedor (opcional, se autogenera si no se envía)")
    Codigo = serializers.CharField(max_length=255, help_text="Código del proveedor")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del proveedor")
    Contacto = serializers.CharField(max_length=255, help_text="Contacto del proveedor")
    Direccion = serializers.CharField(max_length=255, required=False, default=None, allow_null=True, allow_blank=True, help_text="Dirección del proveedor (opcional)")


class UpdateProveedorRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del proveedor a actualizar")
    Codigo = serializers.CharField(max_length=255, help_text="Código del proveedor")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del proveedor")
    Contacto = serializers.CharField(max_length=255, help_text="Contacto del proveedor")
    Direccion = serializers.CharField(max_length=255, required=False, default=None, allow_null=True, allow_blank=True, help_text="Dirección del proveedor (opcional)")


class ProveedorResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Codigo = serializers.CharField()
    Nombre = serializers.CharField()
    Contacto = serializers.CharField()
    Direccion = serializers.CharField(allow_null=True)


# =============================================================================
# PRODUCTOS
# =============================================================================

class ProductoRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del producto a consultar (opcional)")


class NewProductoRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del producto (opcional, se autogenera si no se envía)")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del producto")
    Caracteristicas = serializers.CharField(max_length=255, help_text="Características del producto")
    Precio = serializers.FloatField(min_value=0, help_text="Precio de venta")
    idMarcas = serializers.IntegerField(help_text="ID de la marca")
    idCategoriaPresentacion = serializers.IntegerField(help_text="ID de Categoría-Presentación")
    idProveedor = serializers.IntegerField(help_text="ID del proveedor")


class UpdateProductoRequest(serializers.Serializer):
    id = serializers.IntegerField(help_text="ID del producto a actualizar")
    Nombre = serializers.CharField(max_length=255, help_text="Nombre del producto")
    Caracteristicas = serializers.CharField(max_length=255, help_text="Características del producto")
    Precio = serializers.FloatField(min_value=0, help_text="Precio de venta")
    idMarcas = serializers.IntegerField(help_text="ID de la marca")
    idCategoriaPresentacion = serializers.IntegerField(help_text="ID de Categoría-Presentación")
    idProveedor = serializers.IntegerField(help_text="ID del proveedor")


class ProductoResponse(serializers.Serializer):
    id = serializers.IntegerField()
    Nombre = serializers.CharField()
    Caracteristicas = serializers.CharField()
    Precio = serializers.FloatField()
    idMarcas = serializers.IntegerField()
    idCategoriaPresentacion = serializers.IntegerField()
    idProveedor = serializers.IntegerField()


# =============================================================================
# FACTURACIÓN (dbo.sp_GenerarFactura & dbo.DetalleTransaccionUDT)
# =============================================================================

class DetalleTransaccionItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    Cantidad = serializers.IntegerField(min_value=1, help_text="Cantidad a facturar")
    PrecioUnitario = serializers.DecimalField(max_digits=18, decimal_places=2, help_text="Precio unitario del producto")


class GenerarFacturaRequest(serializers.Serializer):
    IdCliente = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID del cliente")
    IdMedioPago = serializers.IntegerField(help_text="ID del método de pago (tabla dbo.MetodoPago)")
    IdCotizacion = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID de la cotización confirmada (opcional; si es nulo asume facturación directa)",
    )
    IdEmpleado = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID del empleado que registra la venta (opcional; se toma de la sesión JWT o por defecto)",
    )
    IdSede = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID de la sede donde se realiza la venta (opcional; se toma del empleado)",
    )
    Detalles = DetalleTransaccionItemSerializer(
        many=True,
        required=False,
        default=list,
        help_text="Detalle de productos (dbo.DetalleTransaccionUDT). Requerido cuando IdCotizacion es nulo.",
    )

    def validate(self, attrs):
        if attrs.get('IdCotizacion') is None:
            if not attrs.get('Detalles'):
                raise serializers.ValidationError(
                    "Debe enviar 'Detalles' con al menos un producto para facturación directa, o especificar 'IdCotizacion'."
                )
            if attrs.get('IdCliente') is None:
                raise serializers.ValidationError(
                    "Debe enviar 'IdCliente' cuando realiza facturación directa sin cotización."
                )
        return attrs


class GenerarFacturaResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    IdFacturaGenerada = serializers.IntegerField(allow_null=True)
    CodigoFactura = serializers.CharField(allow_null=True, required=False)
    IdVentaGenerada = serializers.IntegerField(allow_null=True, required=False)
    MontoTotal = serializers.FloatField(allow_null=True, required=False)


class FacturaRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la factura a consultar (opcional)")


class CotizacionRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la cotización a consultar (opcional)")


class CrearCotizacionRequest(serializers.Serializer):
    IdCliente = serializers.IntegerField(help_text="ID del cliente")
    DiasValidez = serializers.IntegerField(required=False, default=15, min_value=1, help_text="Días de validez de la cotización")
    IdSede = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la sede")
    Detalles = DetalleTransaccionItemSerializer(many=True, allow_empty=False, help_text="Productos cotizados")



# =============================================================================
# PAGOS Y MEDIOS DE PAGO (dbo.sp_RegistrarPago & dbo.sp_ObtenerMediosPago)
# =============================================================================

class RegistrarPagoRequest(serializers.Serializer):
    IdFactura = serializers.IntegerField(help_text="ID de la factura (dbo.Facturas)")
    IdMedioPago = serializers.IntegerField(help_text="ID del método de pago (dbo.MetodoPago)")
    MontoPagado = serializers.DecimalField(max_digits=18, decimal_places=2, help_text="Monto pagado")
    Referencia = serializers.CharField(
        max_length=100,
        required=False,
        default=None,
        allow_null=True,
        allow_blank=True,
        help_text="Número de autorización de tarjeta o referencia de transferencia (opcional)",
    )


class RegistrarPagoResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    EstadoFactura = serializers.CharField(allow_null=True, required=False)
    MontoPagado = serializers.FloatField(allow_null=True, required=False)
    TotalFactura = serializers.FloatField(allow_null=True, required=False)


class MedioPagoResponse(serializers.Serializer):
    IdMedioPago = serializers.IntegerField()
    id = serializers.IntegerField(required=False)
    Nombre = serializers.CharField()


# =============================================================================
# ÓRDENES DE COMPRA (dbo.sp_RealizarOrdenCompra & dbo.DetalleCompraUDT)
# =============================================================================

class DetalleCompraItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    Cantidad = serializers.IntegerField(min_value=1, help_text="Cantidad solicitada")
    PrecioCosto = serializers.DecimalField(max_digits=18, decimal_places=2, help_text="Precio de costo unitario")


class RealizarOrdenCompraRequest(serializers.Serializer):
    IdProveedor = serializers.IntegerField(help_text="ID del proveedor (dbo.Proveedores)")
    IdEmpleado = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID del empleado que genera la compra (opcional; se toma del JWT o por defecto)",
    )
    Detalles = DetalleCompraItemSerializer(
        many=True,
        allow_empty=False,
        help_text="Lista de productos solicitados en la orden de compra (dbo.DetalleCompraUDT)",
    )


class RealizarOrdenCompraResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    IdOrdenCompraGenerada = serializers.IntegerField(allow_null=True)
    Mensaje = serializers.CharField()


class OrdenCompraRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la orden de compra a consultar (opcional)")


class OrdenCompraResponse(serializers.Serializer):
    id = serializers.IntegerField()
    idProveedor = serializers.IntegerField()
    ProveedorCodigo = serializers.CharField()
    ProveedorNombre = serializers.CharField()
    idEmpleado = serializers.IntegerField()
    EmpleadoNombre = serializers.CharField()
    Fecha = serializers.CharField()
    MontoTotal = serializers.FloatField()
    TotalSolicitado = serializers.IntegerField()
    TotalRecibido = serializers.IntegerField()
    Estado = serializers.CharField()


# =============================================================================
# INGRESOS A BODEGA (dbo.sp_IngresoBodega & dbo.DetalleIngresoUDT)
# =============================================================================

class DetalleIngresoItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    CantidadIngresada = serializers.IntegerField(min_value=1, help_text="Cantidad ingresada a bodega")


class IngresoBodegaRequest(serializers.Serializer):
    IdOrdenCompra = serializers.IntegerField(help_text="ID de la orden de compra (dbo.CompraProveedor)")
    IdEmpleado = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID del empleado que recibe en bodega (opcional)",
    )
    IdSede = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID de la sede a cuyo Stock ingresa la mercadería (opcional)",
    )
    DetallesIngreso = DetalleIngresoItemSerializer(
        many=True,
        allow_empty=False,
        help_text="Detalle de productos ingresados a bodega (dbo.DetalleIngresoUDT)",
    )

    def to_internal_value(self, data):
        if isinstance(data, dict) and 'DetallesIngreso' not in data and 'DetalleIngreso' in data:
            data = {**data, 'DetallesIngreso': data['DetalleIngreso']}
        return super().to_internal_value(data)


class IngresoBodegaResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    IdIngresoGenerado = serializers.IntegerField(allow_null=True)
    EstadoOrden = serializers.CharField(allow_null=True, required=False)
    Mensaje = serializers.CharField()


# =============================================================================
# ANULACIONES DE FACTURA (Script-UDP4.sql: dbo.sp_AnularFactura & dbo.sp_ObtenerAnulaciones)
# =============================================================================

class AnularFacturaRequest(serializers.Serializer):
    IdFactura = serializers.IntegerField(help_text="ID de la factura a anular (dbo.Facturas)")
    Motivo = serializers.CharField(
        max_length=255,
        required=False,
        default=None,
        allow_null=True,
        allow_blank=True,
        help_text="Motivo de la anulación (opcional)",
    )
    IdEmpleado = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID del empleado que anula (opcional; se toma del JWT)",
    )
    IdSede = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID de la sede (opcional; se toma de la venta o del JWT)",
    )


class AnularFacturaResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    IdDevolucion = serializers.IntegerField(allow_null=True, required=False)
    IdFactura = serializers.IntegerField(allow_null=True, required=False)
    CodigoFactura = serializers.CharField(allow_null=True, required=False)
    EstadoFactura = serializers.CharField(allow_null=True, required=False)


class AnulacionRequest(serializers.Serializer):
    id = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="ID de la anulación (opcional)")


class AnulacionResponse(serializers.Serializer):
    id = serializers.IntegerField()
    idFactura = serializers.IntegerField()
    CodigoFactura = serializers.CharField()
    idVenta = serializers.IntegerField()
    CodigoVenta = serializers.CharField()
    NIT = serializers.CharField()
    ClienteNombre = serializers.CharField()
    MontoTotal = serializers.FloatField()
    FechaAnulacion = serializers.CharField()
    idEmpleado = serializers.IntegerField()
    EmpleadoNombre = serializers.CharField()
    idSede = serializers.IntegerField()
    SedeNombre = serializers.CharField()
    Motivo = serializers.CharField(allow_null=True)


# =============================================================================
# REPORTERÍA (Script-UDP5.sql)
# =============================================================================

class ReporteVentasRequest(serializers.Serializer):
    FechaInicio = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha inicial (YYYY-MM-DD)")
    FechaFin = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha final (YYYY-MM-DD)")
    IdSede = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de sede")
    IdEmpleado = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de empleado")
    IncluirAnuladas = serializers.BooleanField(required=False, default=True, help_text="Incluir facturas anuladas en el listado")


class ReporteResumenVentasRequest(serializers.Serializer):
    FechaInicio = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha inicial (YYYY-MM-DD)")
    FechaFin = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha final (YYYY-MM-DD)")
    IdSede = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de sede")


class ReporteProductosMasVendidosRequest(serializers.Serializer):
    FechaInicio = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha inicial (YYYY-MM-DD)")
    FechaFin = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha final (YYYY-MM-DD)")
    IdSede = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de sede")
    Top = serializers.IntegerField(required=False, default=10, min_value=1, help_text="Cantidad máxima de productos a retornar")


class ReporteInventarioStockRequest(serializers.Serializer):
    IdSede = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de sede")
    StockMinimo = serializers.IntegerField(required=False, default=None, allow_null=True, min_value=0, help_text="Filtrar productos con stock menor o igual a este valor")


class ReporteComprasProveedoresRequest(serializers.Serializer):
    FechaInicio = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha inicial (YYYY-MM-DD)")
    FechaFin = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha final (YYYY-MM-DD)")
    IdProveedor = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de proveedor")


class ReporteBitacoraRequest(serializers.Serializer):
    FechaInicio = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha inicial (YYYY-MM-DD)")
    FechaFin = serializers.DateField(required=False, default=None, allow_null=True, help_text="Fecha final (YYYY-MM-DD)")
    IdEmpleado = serializers.IntegerField(required=False, default=None, allow_null=True, help_text="Filtrar por ID de empleado")
