"""
urls.py - Rutas de la API para BackendProyecto_api
"""
from django.urls import path
from . import views

urlpatterns = [
    # Autenticación
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/me/', views.sesion_actual, name='sesion_actual'),

    # Sedes
    path('sedes/crear/', views.crear_sede, name='crear_sede'),
    path('sedes/', views.obtener_sedes, name='obtener_sedes'),

    # Roles
    path('roles/crear/', views.crear_rol, name='crear_rol'),
    path('roles/', views.obtener_roles, name='obtener_roles'),

    # Empleados
    path('empleados/crear/', views.crear_empleado, name='crear_empleado'),
    path('empleados/', views.obtener_empleados, name='obtener_empleados'),

    # Facturación
    path('facturas/generar/', views.generar_factura, name='generar_factura'),

    # Pagos y Medios de Pago
    path('pagos/registrar/', views.registrar_pago, name='registrar_pago'),
    path('medios-pago/', views.obtener_medios_pago, name='obtener_medios_pago'),

    # Órdenes de Compra y Bodega
    path('ordenes-compra/crear/', views.realizar_orden_compra, name='realizar_orden_compra'),
    path('bodega/ingreso/', views.registrar_ingreso_bodega, name='registrar_ingreso_bodega'),
]

