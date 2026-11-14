"""
views.py - Endpoints para Autenticación, Sedes, Roles, Empleados, Clientes,
Proveedores, Productos, Facturación, Pagos, Órdenes de Compra e Ingresos a Bodega.
"""
import pyodbc
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from .db import execute_sp
from .security import (
    hasher,
    comparar_hash,
    crear_token_acceso,
    obtener_payload_desde_request,
    requiere_autenticacion,
)
from .schemas import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    DeleteResponse,
    IdDeleteRequest,
    SesionActualResponse,
    NewSedeRequest,
    UpdateSedeRequest,
    NewSedeResponse,
    SedeRequest,
    SedeResponse,
    NewRolRequest,
    UpdateRolRequest,
    NewRolResponse,
    RolRequest,
    RolResponse,
    NewEmpleadoRequest,
    UpdateEmpleadoRequest,
    NewEmpleadoResponse,
    EmpleadoRequest,
    EmpleadoResponse,
    ClienteRequest,
    NewClienteRequest,
    UpdateClienteRequest,
    ClienteResponse,
    ProveedorRequest,
    NewProveedorRequest,
    UpdateProveedorRequest,
    ProveedorResponse,
    ProductoRequest,
    NewProductoRequest,
    UpdateProductoRequest,
    ProductoResponse,
    GenerarFacturaRequest,
    GenerarFacturaResponse,
    FacturaRequest,
    CotizacionRequest,
    CrearCotizacionRequest,
    RegistrarPagoRequest,
    RegistrarPagoResponse,
    MedioPagoResponse,
    RealizarOrdenCompraRequest,
    RealizarOrdenCompraResponse,
    IngresoBodegaRequest,
    IngresoBodegaResponse,
    AnularFacturaRequest,
    AnularFacturaResponse,
    AnulacionRequest,
    AnulacionResponse,
    ReporteVentasRequest,
    ReporteResumenVentasRequest,
    ReporteProductosMasVendidosRequest,
    ReporteInventarioStockRequest,
    ReporteComprasProveedoresRequest,
    ReporteBitacoraRequest,
)


def _extract_id_from_request(request, serializer_cls):
    """Extrae el parámetro opcional `id` tanto desde query_params (GET) como desde body (POST)."""
    if request.method == 'GET':
        raw_id = request.query_params.get('id')
        data = {'id': raw_id} if raw_id not in (None, '') else {}
    else:
        data = request.data if isinstance(request.data, dict) else {}
    serializer = serializer_cls(data=data)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data.get('id')


def _extract_filter_params(request, serializer_cls):
    """Extrae y valida parámetros de filtro desde query_params (GET) o body (POST)."""
    if request.method == 'GET':
        data = {k: v for k, v in request.query_params.items() if v not in (None, '')}
    else:
        data = request.data if isinstance(request.data, dict) else {}
    serializer = serializer_cls(data=data)
    return serializer


def _execute_report(request, serializer_cls, sp_name: str, param_keys: list[str], single_row: bool = False):
    """Ejecuta un Stored Procedure de reportería con filtros validados por serializer."""
    serializer = _extract_filter_params(request, serializer_cls)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Parámetros de filtro inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    params = {}
    for key in param_keys:
        val = data.get(key)
        if key == 'IncluirAnuladas' and val is not None:
            val = 1 if val else 0
        params[f'@{key}'] = val
    try:
        result = execute_sp(sp_name, params)
        if single_row:
            return Response(result[0] if result else {}, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_200_OK)
    except pyodbc.Error as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

        if not comparar_hash(password_plano, hash_guardado):
            return Response(
                {'Exito': False, 'Mensaje': 'Usuario o contraseña incorrectos.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = {
            'sub': str(row['idEmpleado']),
            'usuario': row['Usuario'],
            'idRol': row['idRol'],
            'idSede': row['idSede'],
        }
        token = crear_token_acceso(payload)

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
    description='Consulta sedes mediante GET (/api/sedes/?id=1) o POST con payload SedeRequest.'
)
@api_view(['GET', 'POST'])
def obtener_sedes(request):
    """GET o POST /api/sedes/"""
    try:
        sede_id = _extract_id_from_request(request, SedeRequest)
        params = {'@id': int(sede_id)} if sede_id is not None else None
        result = execute_sp('dbo.sp_ObtenerSedes', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=UpdateSedeRequest,
    responses={200: NewSedeResponse, 400: NewSedeResponse},
    tags=['Sedes'],
    description='Actualiza una sede existente mediante dbo.sp_ActualizarSede.'
)
@api_view(['PUT', 'POST'])
def actualizar_sede(request):
    """PUT o POST /api/sedes/actualizar/"""
    serializer = UpdateSedeRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_ActualizarSede', {
            '@id': data['id'],
            '@Nombre': data['Nombre'],
            '@Direccion': data['Direccion'],
            '@Contacto': data['Contacto'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse, 400: DeleteResponse},
    tags=['Sedes'],
    description='Elimina una sede validando integridad referencial mediante dbo.sp_EliminarSede.'
)
@api_view(['DELETE', 'POST'])
def eliminar_sede(request):
    """DELETE o POST /api/sedes/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarSede', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    description='Consulta roles mediante GET (/api/roles/?id=1) o POST con payload RolRequest.'
)
@api_view(['GET', 'POST'])
def obtener_roles(request):
    """GET o POST /api/roles/"""
    try:
        rol_id = _extract_id_from_request(request, RolRequest)
        params = {'@id': int(rol_id)} if rol_id is not None else None
        result = execute_sp('dbo.sp_ObtenerRoles', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=UpdateRolRequest,
    responses={200: NewRolResponse, 400: NewRolResponse},
    tags=['Roles'],
    description='Actualiza un rol existente mediante dbo.sp_ActualizarRol.'
)
@api_view(['PUT', 'POST'])
def actualizar_rol(request):
    """PUT o POST /api/roles/actualizar/"""
    serializer = UpdateRolRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_ActualizarRol', {
            '@id': data['id'],
            '@Nombre': data['Nombre'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse, 400: DeleteResponse},
    tags=['Roles'],
    description='Elimina un rol validando integridad referencial mediante dbo.sp_EliminarRol.'
)
@api_view(['DELETE', 'POST'])
def eliminar_rol(request):
    """DELETE o POST /api/roles/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarRol', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    description='Consulta empleados mediante GET (/api/empleados/?id=1) o POST con payload EmpleadoRequest.'
)
@api_view(['GET', 'POST'])
def obtener_empleados(request):
    """GET o POST /api/empleados/"""
    try:
        emp_id = _extract_id_from_request(request, EmpleadoRequest)
        params = {'@id': int(emp_id)} if emp_id is not None else None
        result = execute_sp('dbo.sp_ObtenerEmpleados', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=UpdateEmpleadoRequest,
    responses={200: NewEmpleadoResponse, 400: NewEmpleadoResponse},
    tags=['Empleados'],
    description='Actualiza un empleado y opcionalmente sus credenciales mediante dbo.sp_ActualizarEmpleado.'
)
@api_view(['PUT', 'POST'])
def actualizar_empleado(request):
    """PUT o POST /api/empleados/actualizar/"""
    serializer = UpdateEmpleadoRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        password_plano = data.get('Password')
        hash_contra = hasher(password_plano) if password_plano else None
        usuario = data.get('Usuario') or None

        result = execute_sp('dbo.sp_ActualizarEmpleado', {
            '@id': data['id'],
            '@Nombres': data['Nombres'],
            '@Apellidos': data['Apellidos'],
            '@Correo': data.get('Correo'),
            '@idSede': data['idSede'],
            '@idRol': data['idRol'],
            '@Usuario': usuario,
            '@HashContra': hash_contra,
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse, 400: DeleteResponse},
    tags=['Empleados'],
    description='Elimina un empleado y sus credenciales mediante dbo.sp_EliminarEmpleado.'
)
@api_view(['DELETE', 'POST'])
def eliminar_empleado(request):
    """DELETE o POST /api/empleados/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarEmpleado', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# CLIENTES
# =============================================================================

@extend_schema(
    request=ClienteRequest,
    responses={200: ClienteResponse(many=True)},
    tags=['Clientes'],
    description='Consulta clientes mediante dbo.sp_Clientes_Seleccionar.'
)
@api_view(['GET', 'POST'])
def obtener_clientes(request):
    """GET o POST /api/clientes/"""
    try:
        cli_id = _extract_id_from_request(request, ClienteRequest)
        params = {'@id': int(cli_id)} if cli_id is not None else None
        result = execute_sp('dbo.sp_Clientes_Seleccionar', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=NewClienteRequest,
    responses={201: ClienteResponse},
    tags=['Clientes'],
    description='Crea un cliente mediante dbo.sp_Clientes_Insertar.'
)
@api_view(['POST'])
def crear_cliente(request):
    """POST /api/clientes/crear/"""
    serializer = NewClienteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_Clientes_Insertar', {
            '@id': data.get('id'),
            '@Nombres': data['Nombres'],
            '@Apellidos': data['Apellidos'],
            '@NIT': data['NIT'],
        })
        row = result[0] if result else {'Exito': True, 'Mensaje': 'Cliente creado exitosamente.'}
        return Response(row, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=UpdateClienteRequest,
    responses={200: ClienteResponse},
    tags=['Clientes'],
    description='Actualiza un cliente mediante dbo.sp_ActualizarCliente.'
)
@api_view(['PUT', 'POST'])
def actualizar_cliente(request):
    """PUT o POST /api/clientes/actualizar/"""
    serializer = UpdateClienteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_ActualizarCliente', {
            '@id': data['id'],
            '@Nombres': data['Nombres'],
            '@Apellidos': data['Apellidos'],
            '@NIT': data['NIT'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse},
    tags=['Clientes'],
    description='Elimina un cliente mediante dbo.sp_EliminarCliente.'
)
@api_view(['DELETE', 'POST'])
def eliminar_cliente(request):
    """DELETE o POST /api/clientes/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarCliente', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# PROVEEDORES
# =============================================================================

@extend_schema(
    request=ProveedorRequest,
    responses={200: ProveedorResponse(many=True)},
    tags=['Proveedores'],
    description='Consulta proveedores mediante dbo.sp_Proveedores_Seleccionar.'
)
@api_view(['GET', 'POST'])
def obtener_proveedores(request):
    """GET o POST /api/proveedores/"""
    try:
        prov_id = _extract_id_from_request(request, ProveedorRequest)
        params = {'@id': int(prov_id)} if prov_id is not None else None
        result = execute_sp('dbo.sp_Proveedores_Seleccionar', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=NewProveedorRequest,
    responses={201: ProveedorResponse},
    tags=['Proveedores'],
    description='Crea un proveedor mediante dbo.sp_Proveedores_Insertar.'
)
@api_view(['POST'])
def crear_proveedor(request):
    """POST /api/proveedores/crear/"""
    serializer = NewProveedorRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_Proveedores_Insertar', {
            '@id': data.get('id'),
            '@Codigo': data['Codigo'],
            '@Nombre': data['Nombre'],
            '@Contacto': data['Contacto'],
            '@Direccion': data.get('Direccion'),
        })
        row = result[0] if result else {'Exito': True, 'Mensaje': 'Proveedor creado exitosamente.'}
        return Response(row, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=UpdateProveedorRequest,
    responses={200: ProveedorResponse},
    tags=['Proveedores'],
    description='Actualiza un proveedor mediante dbo.sp_ActualizarProveedor.'
)
@api_view(['PUT', 'POST'])
def actualizar_proveedor(request):
    """PUT o POST /api/proveedores/actualizar/"""
    serializer = UpdateProveedorRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_ActualizarProveedor', {
            '@id': data['id'],
            '@Codigo': data['Codigo'],
            '@Nombre': data['Nombre'],
            '@Contacto': data['Contacto'],
            '@Direccion': data.get('Direccion'),
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse},
    tags=['Proveedores'],
    description='Elimina un proveedor mediante dbo.sp_EliminarProveedor.'
)
@api_view(['DELETE', 'POST'])
def eliminar_proveedor(request):
    """DELETE o POST /api/proveedores/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarProveedor', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# PRODUCTOS
# =============================================================================

@extend_schema(
    request=ProductoRequest,
    responses={200: ProductoResponse(many=True)},
    tags=['Productos'],
    description='Consulta productos mediante dbo.sp_Productos_Seleccionar.'
)
@api_view(['GET', 'POST'])
def obtener_productos(request):
    """GET o POST /api/productos/"""
    try:
        prod_id = _extract_id_from_request(request, ProductoRequest)
        params = {'@id': int(prod_id)} if prod_id is not None else None
        result = execute_sp('dbo.sp_Productos_Seleccionar', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=NewProductoRequest,
    responses={201: ProductoResponse},
    tags=['Productos'],
    description='Crea un producto mediante dbo.sp_Productos_Insertar.'
)
@api_view(['POST'])
def crear_producto(request):
    """POST /api/productos/crear/"""
    serializer = NewProductoRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_Productos_Insertar', {
            '@id': data.get('id'),
            '@Nombre': data['Nombre'],
            '@Caracteristicas': data['Caracteristicas'],
            '@Precio': data['Precio'],
            '@idMarcas': data['idMarcas'],
            '@idCategoriaPresentacion': data['idCategoriaPresentacion'],
            '@idProveedor': data['idProveedor'],
        })
        row = result[0] if result else {'Exito': True, 'Mensaje': 'Producto creado exitosamente.'}
        return Response(row, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=UpdateProductoRequest,
    responses={200: ProductoResponse},
    tags=['Productos'],
    description='Actualiza un producto mediante dbo.sp_ActualizarProducto.'
)
@api_view(['PUT', 'POST'])
def actualizar_producto(request):
    """PUT o POST /api/productos/actualizar/"""
    serializer = UpdateProductoRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    data = serializer.validated_data
    try:
        result = execute_sp('dbo.sp_ActualizarProducto', {
            '@id': data['id'],
            '@Nombre': data['Nombre'],
            '@Caracteristicas': data['Caracteristicas'],
            '@Precio': data['Precio'],
            '@idMarcas': data['idMarcas'],
            '@idCategoriaPresentacion': data['idCategoriaPresentacion'],
            '@idProveedor': data['idProveedor'],
        })
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=IdDeleteRequest,
    responses={200: DeleteResponse},
    tags=['Productos'],
    description='Elimina un producto mediante dbo.sp_EliminarProducto.'
)
@api_view(['DELETE', 'POST'])
def eliminar_producto(request):
    """DELETE o POST /api/productos/eliminar/"""
    serializer = IdDeleteRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        result = execute_sp('dbo.sp_EliminarProducto', {'@id': serializer.validated_data['id']})
        row = result[0] if result else {}
        http_status = status.HTTP_200_OK if row.get('Exito') else status.HTTP_400_BAD_REQUEST
        return Response(row, status=http_status)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# COTIZACIONES Y FACTURACIÓN
# =============================================================================

@extend_schema(
    request=CotizacionRequest,
    tags=['Cotizaciones'],
    description='Consulta cotizaciones mediante dbo.sp_ObtenerCotizaciones.'
)
@api_view(['GET', 'POST'])
def obtener_cotizaciones(request):
    """GET o POST /api/cotizaciones/"""
    try:
        cot_id = _extract_id_from_request(request, CotizacionRequest)
        params = {'@id': int(cot_id)} if cot_id is not None else None
        result = execute_sp('dbo.sp_ObtenerCotizaciones', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Cotizaciones'],
    description='Obtiene el encabezado y los ítems de una cotización específica.'
)
@api_view(['GET', 'POST'])
def obtener_detalle_cotizacion(request):
    """GET o POST /api/cotizaciones/detalle/?id=1"""
    try:
        cot_id = _extract_id_from_request(request, CotizacionRequest)
        if cot_id is None:
            return Response({'Exito': False, 'Mensaje': 'Debe proporcionar el ID de la cotización.'}, status=status.HTTP_400_BAD_REQUEST)
        header = execute_sp('dbo.sp_ObtenerCotizaciones', {'@id': int(cot_id)})
        items = execute_sp('dbo.sp_ObtenerDetalleCotizacion', {'@IdCotizacion': int(cot_id)})
        return Response({
            'Exito': True,
            'cotizacion': header[0] if header else None,
            'detalles': items,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=CrearCotizacionRequest,
    tags=['Cotizaciones'],
    description='Crea una nueva cotización y sus ítems mediante dbo.sp_CrearCotizacion.'
)
@api_view(['POST'])
def crear_cotizacion(request):
    """POST /api/cotizaciones/crear/"""
    serializer = CrearCotizacionRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    session_user = obtener_payload_desde_request(request) or {}
    id_sede = data.get('IdSede') or (int(session_user['idSede']) if session_user.get('idSede') else None)

    try:
        result = execute_sp(
            'dbo.sp_CrearCotizacion',
            params={
                '@IdCliente': data['IdCliente'],
                '@DiasValidez': data.get('DiasValidez', 15),
                '@IdSede': id_sede,
            },
            udt_params={
                '@Detalles': {
                    'type_name': 'dbo.DetalleTransaccionUDT',
                    'columns': ['IdProducto', 'Cantidad', 'PrecioUnitario'],
                    'rows': data['Detalles'],
                }
            },
        )
        row = result[0] if result else {}
        return Response(
            {
                'Exito': True,
                'Mensaje': row.get('Mensaje', 'Cotización creada exitosamente.'),
                'IdCotizacionGenerada': row.get('IdCotizacionGenerada'),
                'CodigoCotizacion': row.get('CodigoCotizacion'),
                'MontoTotal': row.get('MontoTotal'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=FacturaRequest,
    tags=['Facturación'],
    description='Consulta las facturas emitidas mediante dbo.sp_ObtenerFacturas.'
)
@api_view(['GET', 'POST'])
def obtener_facturas(request):
    """GET o POST /api/facturas/"""
    try:
        fac_id = _extract_id_from_request(request, FacturaRequest)
        params = {'@id': int(fac_id)} if fac_id is not None else None
        result = execute_sp('dbo.sp_ObtenerFacturas', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Facturación'],
    description='Obtiene el encabezado y los ítems detallados de una factura para vista previa o descarga.'
)
@api_view(['GET', 'POST'])
def obtener_detalle_factura(request):
    """GET o POST /api/facturas/detalle/?id=1"""
    try:
        fac_id = _extract_id_from_request(request, FacturaRequest)
        if fac_id is None:
            return Response({'Exito': False, 'Mensaje': 'Debe proporcionar el ID de la factura.'}, status=status.HTTP_400_BAD_REQUEST)
        header = execute_sp('dbo.sp_ObtenerFacturas', {'@id': int(fac_id)})
        items = execute_sp('dbo.sp_ObtenerDetalleFactura', {'@IdFactura': int(fac_id)})
        return Response({
            'Exito': True,
            'factura': header[0] if header else None,
            'detalles': items,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# FACTURACIÓN (Script-UDP1.sql: dbo.sp_GenerarFactura)
# =============================================================================

@extend_schema(
    request=GenerarFacturaRequest,
    responses={201: GenerarFacturaResponse, 400: GenerarFacturaResponse},
    tags=['Facturación'],
    description='Genera una venta y factura (directa con UDT dbo.DetalleTransaccionUDT o desde una cotización) ejecutando dbo.sp_GenerarFactura.'
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
    session_user = obtener_payload_desde_request(request) or {}
    id_empleado = data.get('IdEmpleado') or (int(session_user['sub']) if session_user.get('sub') else None)
    id_sede = data.get('IdSede') or (int(session_user['idSede']) if session_user.get('idSede') else None)

    try:
        detalles = data.get('Detalles') or []
        result = execute_sp(
            'dbo.sp_GenerarFactura',
            params={
                '@IdCliente': data.get('IdCliente'),
                '@IdMedioPago': data['IdMedioPago'],
                '@IdCotizacion': data.get('IdCotizacion'),
                '@IdEmpleado': id_empleado,
                '@IdSede': id_sede,
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
                'CodigoFactura': row.get('CodigoFactura'),
                'IdVentaGenerada': row.get('IdVentaGenerada'),
                'MontoTotal': row.get('MontoTotal'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'Mensaje': str(e), 'IdFacturaGenerada': None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# PAGOS Y MEDIOS DE PAGO (Script-UDP2.sql: dbo.sp_RegistrarPago & dbo.sp_ObtenerMediosPago)
# =============================================================================

@extend_schema(
    request=RegistrarPagoRequest,
    responses={201: RegistrarPagoResponse, 400: RegistrarPagoResponse},
    tags=['Pagos'],
    description='Registra un pago asociado a una factura y actualiza la venta y bitácora mediante dbo.sp_RegistrarPago.'
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
                'EstadoFactura': row.get('EstadoFactura'),
                'MontoPagado': row.get('MontoPagado'),
                'TotalFactura': row.get('TotalFactura'),
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
    description='Obtiene los métodos de pago registrados en dbo.MetodoPago mediante dbo.sp_ObtenerMediosPago.'
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
# ÓRDENES DE COMPRA Y BODEGA (Script-UDP3.sql: dbo.sp_RealizarOrdenCompra & dbo.sp_IngresoBodega)
# =============================================================================

@extend_schema(
    request=RealizarOrdenCompraRequest,
    responses={201: RealizarOrdenCompraResponse, 400: RealizarOrdenCompraResponse},
    tags=['Compras y Bodega'],
    description='Crea una orden de compra a proveedor en dbo.CompraProveedor y dbo.CompraProveedorItem usando dbo.DetalleCompraUDT.'
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
    session_user = obtener_payload_desde_request(request) or {}
    id_empleado = data.get('IdEmpleado') or (int(session_user['sub']) if session_user.get('sub') else None)

    try:
        result = execute_sp(
            'dbo.sp_RealizarOrdenCompra',
            params={
                '@IdProveedor': data['IdProveedor'],
                '@IdEmpleado': id_empleado,
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
    description='Registra el ingreso de mercadería a bodega en dbo.EntregaProveedores, dbo.EntregaProveedoresItems y actualiza dbo.Stock y dbo.CompraProveedorItem.'
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
    session_user = obtener_payload_desde_request(request) or {}
    id_empleado = data.get('IdEmpleado') or (int(session_user['sub']) if session_user.get('sub') else None)
    id_sede = data.get('IdSede') or (int(session_user['idSede']) if session_user.get('idSede') else None)

    try:
        result = execute_sp(
            'dbo.sp_IngresoBodega',
            params={
                '@IdOrdenCompra': data['IdOrdenCompra'],
                '@IdEmpleado': id_empleado,
                '@IdSede': id_sede,
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
                'EstadoOrden': row.get('EstadoOrden'),
                'Mensaje': row.get('Mensaje', 'Ingreso a bodega procesado correctamente.'),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {'Exito': False, 'IdIngresoGenerado': None, 'Mensaje': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# =============================================================================
# ANULACIONES DE FACTURA (Script-UDP4.sql)
# =============================================================================

@extend_schema(
    request=AnularFacturaRequest,
    responses={200: AnularFacturaResponse, 400: AnularFacturaResponse},
    tags=['Facturación'],
    description='Anula una factura, registra la devolución en dbo.Devoluciones, revierte el stock en dbo.Stock y guarda bitácora en dbo.Logs mediante dbo.sp_AnularFactura.'
)
@api_view(['POST'])
def anular_factura(request):
    """POST /api/facturas/anular/"""
    serializer = AnularFacturaRequest(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'Exito': False, 'Mensaje': 'Datos inválidos', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = serializer.validated_data
    session_user = obtener_payload_desde_request(request) or {}
    id_empleado = data.get('IdEmpleado') or (int(session_user['sub']) if session_user.get('sub') else None)
    id_sede = data.get('IdSede') or (int(session_user['idSede']) if session_user.get('idSede') else None)

    try:
        result = execute_sp(
            'dbo.sp_AnularFactura',
            params={
                '@IdFactura': data['IdFactura'],
                '@Motivo': data.get('Motivo'),
                '@IdEmpleado': id_empleado,
                '@IdSede': id_sede,
            },
        )
        row = result[0] if result else {}
        exito = bool(row.get('Exito', True))
        http_status = status.HTTP_200_OK if exito else status.HTTP_400_BAD_REQUEST
        return Response(
            {
                'Exito': exito,
                'Mensaje': row.get('Mensaje', 'Factura anulada exitosamente.'),
                'IdDevolucion': row.get('IdDevolucion'),
                'IdFactura': row.get('IdFactura'),
                'CodigoFactura': row.get('CodigoFactura'),
                'EstadoFactura': row.get('EstadoFactura'),
            },
            status=http_status,
        )
    except pyodbc.Error as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    request=AnulacionRequest,
    responses={200: AnulacionResponse(many=True)},
    tags=['Facturación'],
    description='Consulta el historial de facturas anuladas mediante dbo.sp_ObtenerAnulaciones.'
)
@api_view(['GET', 'POST'])
def obtener_anulaciones(request):
    """GET o POST /api/facturas/anulaciones/"""
    try:
        anulacion_id = _extract_id_from_request(request, AnulacionRequest)
        params = {'@id': int(anulacion_id)} if anulacion_id is not None else None
        result = execute_sp('dbo.sp_ObtenerAnulaciones', params)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'Exito': False, 'Mensaje': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# REPORTERÍA (Script-UDP5.sql)
# =============================================================================

@extend_schema(
    request=ReporteVentasRequest,
    tags=['Reportería'],
    description='Reporte detallado de ventas y facturas con filtros por fecha, sede, empleado y estado mediante dbo.sp_ReporteVentas.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_ventas(request):
    """GET o POST /api/reportes/ventas/"""
    return _execute_report(
        request,
        ReporteVentasRequest,
        'dbo.sp_ReporteVentas',
        ['FechaInicio', 'FechaFin', 'IdSede', 'IdEmpleado', 'IncluirAnuladas'],
    )


@extend_schema(
    request=ReporteResumenVentasRequest,
    tags=['Reportería'],
    description='KPIs resumidos de ventas (facturas activas, anuladas, total vendido, total anulado, ticket promedio) mediante dbo.sp_ReporteResumenVentas.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_resumen_ventas(request):
    """GET o POST /api/reportes/ventas/resumen/"""
    return _execute_report(
        request,
        ReporteResumenVentasRequest,
        'dbo.sp_ReporteResumenVentas',
        ['FechaInicio', 'FechaFin', 'IdSede'],
        single_row=True,
    )


@extend_schema(
    request=ReporteProductosMasVendidosRequest,
    tags=['Reportería'],
    description='Ranking de productos más vendidos (excluyendo facturas anuladas) mediante dbo.sp_ReporteProductosMasVendidos.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_productos_mas_vendidos(request):
    """GET o POST /api/reportes/productos-mas-vendidos/"""
    return _execute_report(
        request,
        ReporteProductosMasVendidosRequest,
        'dbo.sp_ReporteProductosMasVendidos',
        ['FechaInicio', 'FechaFin', 'IdSede', 'Top'],
    )


@extend_schema(
    request=ReporteInventarioStockRequest,
    tags=['Reportería'],
    description='Reporte de inventario y valoración de stock por sede (con filtro opcional de stock mínimo) mediante dbo.sp_ReporteInventarioStock.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_inventario_stock(request):
    """GET o POST /api/reportes/inventario-stock/"""
    return _execute_report(
        request,
        ReporteInventarioStockRequest,
        'dbo.sp_ReporteInventarioStock',
        ['IdSede', 'StockMinimo'],
    )


@extend_schema(
    request=ReporteComprasProveedoresRequest,
    tags=['Reportería'],
    description='Reporte de órdenes de compra a proveedores y su estado de recepción en bodega mediante dbo.sp_ReporteComprasProveedores.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_compras_proveedores(request):
    """GET o POST /api/reportes/compras-proveedores/"""
    return _execute_report(
        request,
        ReporteComprasProveedoresRequest,
        'dbo.sp_ReporteComprasProveedores',
        ['FechaInicio', 'FechaFin', 'IdProveedor'],
    )


@extend_schema(
    request=ReporteBitacoraRequest,
    tags=['Reportería'],
    description='Reporte de bitácora de auditoría (dbo.Logs) mediante dbo.sp_ReporteBitacora.'
)
@api_view(['GET', 'POST'])
@requiere_autenticacion
def reporte_bitacora(request):
    """GET o POST /api/reportes/bitacora/"""
    return _execute_report(
        request,
        ReporteBitacoraRequest,
        'dbo.sp_ReporteBitacora',
        ['FechaInicio', 'FechaFin', 'IdEmpleado'],
    )
