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
