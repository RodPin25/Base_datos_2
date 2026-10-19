"""
schemas.py - Schemas (request/response) para Sedes, Roles, Empleados y Autenticación.
Todos los endpoints utilizan schemas tipados para request y response.
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
    Usuario = serializers.CharField()


# Aliases
EmpleadoCreateRequest = NewEmpleadoRequest
EmpleadoGetRequest = EmpleadoRequest


# =============================================================================
# FACTURACIÓN (dbo.sp_GenerarFactura & dbo.DetalleTransaccionUDT)
# =============================================================================

class DetalleTransaccionItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    Cantidad = serializers.IntegerField(min_value=1, help_text="Cantidad a facturar")
    PrecioUnitario = serializers.DecimalField(max_digits=18, decimal_places=2, help_text="Precio unitario del producto")


class GenerarFacturaRequest(serializers.Serializer):
    IdCliente = serializers.IntegerField(help_text="ID del cliente")
    IdMedioPago = serializers.IntegerField(help_text="ID del medio de pago")
    IdCotizacion = serializers.IntegerField(
        required=False,
        default=None,
        allow_null=True,
        help_text="ID de la cotización confirmada (opcional; si es nulo asume facturación directa)",
    )
    Detalles = DetalleTransaccionItemSerializer(
        many=True,
        required=False,
        default=list,
        help_text="Detalle de productos (dbo.DetalleTransaccionUDT). Requerido cuando IdCotizacion es nulo.",
    )

    def validate(self, attrs):
        if attrs.get('IdCotizacion') is None and not attrs.get('Detalles'):
            raise serializers.ValidationError(
                "Debe enviar 'Detalles' con al menos un producto para facturación directa, o especificar 'IdCotizacion'."
            )
        return attrs


class GenerarFacturaResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    Mensaje = serializers.CharField()
    IdFacturaGenerada = serializers.IntegerField(allow_null=True)


# =============================================================================
# PAGOS Y MEDIOS DE PAGO (dbo.sp_RegistrarPago & dbo.sp_ObtenerMediosPago)
# =============================================================================

class RegistrarPagoRequest(serializers.Serializer):
    IdFactura = serializers.IntegerField(help_text="ID de la factura")
    IdMedioPago = serializers.IntegerField(help_text="ID del medio de pago")
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


class MedioPagoResponse(serializers.Serializer):
    IdMedioPago = serializers.IntegerField()
    Nombre = serializers.CharField()
    Descripcion = serializers.CharField(allow_null=True, required=False)


# =============================================================================
# ÓRDENES DE COMPRA (dbo.sp_RealizarOrdenCompra & dbo.DetalleCompraUDT)
# =============================================================================

class DetalleCompraItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    Cantidad = serializers.IntegerField(min_value=1, help_text="Cantidad solicitada")
    PrecioCosto = serializers.DecimalField(max_digits=18, decimal_places=2, help_text="Precio de costo unitario")


class RealizarOrdenCompraRequest(serializers.Serializer):
    IdProveedor = serializers.IntegerField(help_text="ID del proveedor")
    Detalles = DetalleCompraItemSerializer(
        many=True,
        allow_empty=False,
        help_text="Lista de productos solicitados en la orden de compra (dbo.DetalleCompraUDT)",
    )


class RealizarOrdenCompraResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    IdOrdenCompraGenerada = serializers.IntegerField(allow_null=True)
    Mensaje = serializers.CharField()


# =============================================================================
# INGRESOS A BODEGA (dbo.sp_IngresoBodega & dbo.DetalleIngresoUDT)
# =============================================================================

class DetalleIngresoItemSerializer(serializers.Serializer):
    IdProducto = serializers.IntegerField(help_text="ID del producto")
    CantidadIngresada = serializers.IntegerField(min_value=1, help_text="Cantidad ingresada a bodega")


class IngresoBodegaRequest(serializers.Serializer):
    IdOrdenCompra = serializers.IntegerField(help_text="ID de la orden de compra")
    DetallesIngreso = DetalleIngresoItemSerializer(
        many=True,
        allow_empty=False,
        help_text="Detalle de productos ingresados a bodega (dbo.DetalleIngresoUDT)",
    )


class IngresoBodegaResponse(serializers.Serializer):
    Exito = serializers.BooleanField()
    IdIngresoGenerado = serializers.IntegerField(allow_null=True)
    Mensaje = serializers.CharField()

