"""
views.py - Endpoints para Sedes, Roles, Empleados y Autenticación.
Todos los endpoints reciben y responden estrictamente a través de Schemas en el Payload.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from .db import execute_sp
from .security import hasher, comparar_hash, crear_token_acceso, obtener_payload_desde_request
from .schemas import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    SesionActualResponse,
    NewSedeRequest,
    NewSedeResponse,
    SedeRequest,
    SedeResponse,
    NewRolRequest,
    NewRolResponse,
    RolRequest,
    RolResponse,
    NewEmpleadoRequest,
    NewEmpleadoResponse,
    EmpleadoRequest,
    EmpleadoResponse,
    GenerarFacturaRequest,
    GenerarFacturaResponse,
    RegistrarPagoRequest,
    RegistrarPagoResponse,
    MedioPagoResponse,
    RealizarOrdenCompraRequest,
    RealizarOrdenCompraResponse,
    IngresoBodegaRequest,
    IngresoBodegaResponse,
)


# =============================================================================
# AUTENTICACIÓN / LOGIN
# =============================================================================

@extend_schema(
    request=LoginRequest,
    responses={200: LoginResponse},
    tags=['Autenticación'],
    description='Inicia sesión validando credenciales contra Argon2 y almacena el JWT en una cookie HttpOnly.'
)
@api_view(['POST'])
def login(request):
    """POST /api/auth/login/"""
    serializer = LoginRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    usuario = data['Usuario']
    password_plano = data['Password']

    try:
        # 1. Buscar en BD mediante SP
        result = execute_sp('dbo.sp_ObtenerCredencialesPorUsuario', {
            '@Usuario': usuario,
        })

        if not result:
            return Response(
                {'Exito': False, 'Mensaje': 'Usuario o contraseña incorrectos.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        row = result[0]
        hash_guardado = row['HashContra']

        # 2. Comparar contraseña con el hash Argon2
        if not comparar_hash(password_plano, hash_guardado):
            return Response(
                {'Exito': False, 'Mensaje': 'Usuario o contraseña incorrectos.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 3. Generar payload y token JWT con la información necesaria
        payload = {
            'sub': str(row['idEmpleado']),
            'usuario': row['Usuario'],
            'idRol': row['idRol'],
            'idSede': row['idSede'],
        }
        token = crear_token_acceso(payload)

        # 4. Respuesta y almacenamiento en Cookie HttpOnly
        response = Response({
            'Exito': True,
            'Mensaje': 'Inicio de sesión exitoso.',
            'access_token': token,
            'token_type': 'Bearer',
            'usuario': {
                'idEmpleado': row['idEmpleado'],
                'Usuario': row['Usuario'],
                'idRol': row['idRol'],
                'idSede': row['idSede'],
            }
        }, status=status.HTTP_200_OK)

        # Guardar JWT en cookie de sesión
        response.set_cookie(
            key='access_token',
            value=f'Bearer {token}',
            httponly=True,
            max_age=60 * 60 * 24,  # 24 horas
            samesite='Lax',
            secure=False,
        )

        return response

    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=None,
    responses={200: MessageResponse},
    tags=['Autenticación'],
    description='Cierra la sesión eliminando la cookie del token JWT.'
)
@api_view(['POST'])
def logout(request):
    """POST /api/auth/logout/"""
    response = Response({
        'Exito': True,
        'Mensaje': 'Sesión cerrada exitosamente.'
    }, status=status.HTTP_200_OK)
    response.delete_cookie('access_token')
    return response


@extend_schema(
    responses={200: SesionActualResponse},
    tags=['Autenticación'],
    description='Verifica la sesión actual leyendo la cookie o header Authorization.'
)
@api_view(['GET'])
def sesion_actual(request):
    """GET /api/auth/me/"""
    payload = obtener_payload_desde_request(request)
    if not payload:
        return Response(
            {'Exito': False, 'Mensaje': 'No hay sesión activa o el token expiró.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response({'Exito': True, 'usuario': payload}, status=status.HTTP_200_OK)


# =============================================================================
# SEDES
# =============================================================================

@extend_schema(
    request=NewSedeRequest,
    responses={201: NewSedeResponse, 400: NewSedeResponse},
    tags=['Sedes'],
    description='Crea una nueva sede enviando NewSedeRequest en el payload.'
)
@api_view(['POST'])
def crear_sede(request):
    """POST /api/sedes/crear/"""
    serializer = NewSedeRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_InsertarSede', {
            '@Nombre': data['Nombre'],
            '@Direccion': data['Direccion'],
            '@Contacto': data['Contacto'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_201_CREATED if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=SedeRequest,
    responses={200: SedeResponse(many=True)},
    tags=['Sedes'],
    description='Consulta sedes mediante payload SedeRequest (ej: {"id": 1} para específica, o {} para todas).'
)
@api_view(['POST'])
def obtener_sedes(request):
    """
    POST /api/sedes/
    Payload: {"id": 1}  -> devuelve sede específica
    Payload: {}         -> devuelve todas las sedes
    """
    data = request.data if isinstance(request.data, dict) else {}
    serializer = SedeRequest(data=data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Payload inválido', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    sede_id = serializer.validated_data.get('id')
    try:
        params = {'@id': int(sede_id)} if sede_id is not None else None
        result = execute_sp('dbo.sp_ObtenerSedes', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# ROLES
# =============================================================================

@extend_schema(
    request=NewRolRequest,
    responses={201: NewRolResponse, 400: NewRolResponse},
    tags=['Roles'],
    description='Crea un nuevo rol enviando NewRolRequest en el payload.'
)
@api_view(['POST'])
def crear_rol(request):
    """POST /api/roles/crear/"""
    serializer = NewRolRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_InsertarRol', {
            '@Nombre': data['Nombre'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_201_CREATED if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=RolRequest,
    responses={200: RolResponse(many=True)},
    tags=['Roles'],
    description='Consulta roles mediante payload RolRequest (ej: {"id": 1} para específico, o {} para todos).'
)
@api_view(['POST'])
def obtener_roles(request):
    """
    POST /api/roles/
    Payload: {"id": 1}  -> devuelve rol específico
    Payload: {}         -> devuelve todos los roles
    """
    data = request.data if isinstance(request.data, dict) else {}
    serializer = RolRequest(data=data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Payload inválido', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rol_id = serializer.validated_data.get('id')
    try:
        params = {'@id': int(rol_id)} if rol_id is not None else None
        result = execute_sp('dbo.sp_ObtenerRoles', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# EMPLEADOS
# =============================================================================

@extend_schema(
    request=NewEmpleadoRequest,
    responses={201: NewEmpleadoResponse, 400: NewEmpleadoResponse},
    tags=['Empleados'],
    description='Crea un empleado y credenciales enviando NewEmpleadoRequest en el payload. La contraseña se hashea con Argon2.'
)
@api_view(['POST'])
def crear_empleado(request):
    """POST /api/empleados/crear/"""
    serializer = NewEmpleadoRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        # Hashear la contraseña con Argon2 antes de enviarla a la BD
        hash_contra = hasher(data['Password'])

        result = execute_sp('dbo.sp_InsertarEmpleado', {
            '@Nombres': data['Nombres'],
            '@Apellidos': data['Apellidos'],
            '@Correo': data.get('Correo'),
            '@idSede': data['idSede'],
            '@idRol': data['idRol'],
            '@Usuario': data['Usuario'],
            '@HashContra': hash_contra,
        })
        row = result[0] if result else {}
        http_status = status.HTTP_201_CREATED if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=EmpleadoRequest,
    responses={200: EmpleadoResponse(many=True)},
    tags=['Empleados'],
    description='Consulta empleados mediante payload EmpleadoRequest (ej: {"id": 1} para específico, o {} para todos).'
)
@api_view(['POST'])
def obtener_empleados(request):
    """
    POST /api/empleados/
    Payload: {"id": 1}  -> devuelve empleado específico
    Payload: {}         -> devuelve todos los empleados
    """
    data = request.data if isinstance(request.data, dict) else {}
    serializer = EmpleadoRequest(data=data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Payload inválido', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    emp_id = serializer.validated_data.get('id')
    try:
        params = {'@id': int(emp_id)} if emp_id is not None else None
        result = execute_sp('dbo.sp_ObtenerEmpleados', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# FACTURACIÓN
# =============================================================================

@extend_schema(
    request=GenerarFacturaRequest,
    responses={201: GenerarFacturaResponse, 400: GenerarFacturaResponse},
    tags=['Facturación'],
    description='Genera una factura (directa con UDT dbo.DetalleTransaccionUDT o desde una cotización) ejecutando dbo.sp_GenerarFactura.'
)
@api_view(['POST'])
def generar_factura(request):
    """POST /api/facturas/generar/"""
    serializer = GenerarFacturaRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        detalles = data.get('Detalles') or []
        result = execute_sp(
            'dbo.sp_GenerarFactura',
            params={
                '@IdCliente': data['IdCliente'],
                '@IdMedioPago': data['IdMedioPago'],
                '@IdCotizacion': data.get('IdCotizacion'),
            },
            udt_params={
                '@Detalles': {
                    'type_name': 'dbo.DetalleTransaccionUDT',
                    'columns': ['IdProducto', 'Cantidad', 'PrecioUnitario'],
                    'rows': detalles,
                }
            },
        )
        row = result[0] if result else {}
        return Response(
            {
                'Exito': True,
                'Mensaje': 'Factura generada exitosamente.',
                'IdFacturaGenerada': row.get('IdFacturaGenerada'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e), 'IdFacturaGenerada': None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# PAGOS Y MEDIOS DE PAGO
# =============================================================================

@extend_schema(
    request=RegistrarPagoRequest,
    responses={201: RegistrarPagoResponse, 400: RegistrarPagoResponse},
    tags=['Pagos'],
    description='Registra un pago asociado a una factura y actualiza su estado si cubre el total mediante dbo.sp_RegistrarPago.'
)
@api_view(['POST'])
def registrar_pago(request):
    """POST /api/pagos/registrar/"""
    serializer = RegistrarPagoRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_RegistrarPago', {
            '@IdFactura': data['IdFactura'],
            '@IdMedioPago': data['IdMedioPago'],
            '@MontoPagado': data['MontoPagado'],
            '@Referencia': data.get('Referencia'),
        })
        row = result[0] if result else {}
        exito = bool(row.get('Exito', True))
        http_status = status.HTTP_201_CREATED if exito else status.HTTP_400_BAD_REQUEST
        return Response(
            {
                'Exito': exito,
                'Mensaje': row.get('Mensaje', 'Pago registrado correctamente.'),
            },
            status=http_status,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=None,
    responses={200: MedioPagoResponse(many=True)},
    tags=['Pagos'],
    description='Obtiene los medios de pago activos en el sistema mediante dbo.sp_ObtenerMediosPago.'
)
@api_view(['GET', 'POST'])
def obtener_medios_pago(request):
    """GET o POST /api/medios-pago/"""
    try:
        result = execute_sp('dbo.sp_ObtenerMediosPago')
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# ÓRDENES DE COMPRA Y BODEGA
# =============================================================================

@extend_schema(
    request=RealizarOrdenCompraRequest,
    responses={201: RealizarOrdenCompraResponse, 400: RealizarOrdenCompraResponse},
    tags=['Compras y Bodega'],
    description='Crea una orden de compra a proveedor enviando el detalle con dbo.DetalleCompraUDT a dbo.sp_RealizarOrdenCompra.'
)
@api_view(['POST'])
def realizar_orden_compra(request):
    """POST /api/ordenes-compra/crear/"""
    serializer = RealizarOrdenCompraRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        result = execute_sp(
            'dbo.sp_RealizarOrdenCompra',
            params={
                '@IdProveedor': data['IdProveedor'],
            },
            udt_params={
                '@Detalles': {
                    'type_name': 'dbo.DetalleCompraUDT',
                    'columns': ['IdProducto', 'Cantidad', 'PrecioCosto'],
                    'rows': data['Detalles'],
                }
            },
        )
        row = result[0] if result else {}
        return Response(
            {
                'Exito': True,
                'IdOrdenCompraGenerada': row.get('IdOrdenCompraGenerada'),
                'Mensaje': row.get('Mensaje', 'Orden de compra creada exitosamente.'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'IdOrdenCompraGenerada': None, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=IngresoBodegaRequest,
    responses={201: IngresoBodegaResponse, 400: IngresoBodegaResponse},
    tags=['Compras y Bodega'],
    description='Registra el ingreso de mercadería a bodega enviando dbo.DetalleIngresoUDT a dbo.sp_IngresoBodega y actualiza existencias y estado de la orden.'
)
@api_view(['POST'])
def registrar_ingreso_bodega(request):
    """POST /api/bodega/ingreso/"""
    serializer = IngresoBodegaRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    try:
        result = execute_sp(
            'dbo.sp_IngresoBodega',
            params={
                '@IdOrdenCompra': data['IdOrdenCompra'],
            },
            udt_params={
                '@DetallesIngreso': {
                    'type_name': 'dbo.DetalleIngresoUDT',
                    'columns': ['IdProducto', 'CantidadIngresada'],
                    'rows': data['DetallesIngreso'],
                }
            },
        )
        row = result[0] if result else {}
        return Response(
            {
                'Exito': True,
                'IdIngresoGenerado': row.get('IdIngresoGenerado'),
                'Mensaje': row.get('Mensaje', 'Ingreso a bodega procesado correctamente.'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'IdIngresoGenerado': None, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

