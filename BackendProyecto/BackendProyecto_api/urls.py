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
    path('sedes/', views.obtener_sedes, name='obtener_sedes'),
    path('sedes/crear/', views.crear_sede, name='crear_sede'),
    path('sedes/actualizar/', views.actualizar_sede, name='actualizar_sede'),
    path('sedes/eliminar/', views.eliminar_sede, name='eliminar_sede'),

    # Roles
    path('roles/', views.obtener_roles, name='obtener_roles'),
    path('roles/crear/', views.crear_rol, name='crear_rol'),
    path('roles/actualizar/', views.actualizar_rol, name='actualizar_rol'),
    path('roles/eliminar/', views.eliminar_rol, name='eliminar_rol'),

    # Empleados
    path('empleados/', views.obtener_empleados, name='obtener_empleados'),
    path('empleados/crear/', views.crear_empleado, name='crear_empleado'),
    path('empleados/actualizar/', views.actualizar_empleado, name='actualizar_empleado'),
    path('empleados/eliminar/', views.eliminar_empleado, name='eliminar_empleado'),

    # Clientes
    path('clientes/', views.obtener_clientes, name='obtener_clientes'),
    path('clientes/crear/', views.crear_cliente, name='crear_cliente'),
    path('clientes/actualizar/', views.actualizar_cliente, name='actualizar_cliente'),
    path('clientes/eliminar/', views.eliminar_cliente, name='eliminar_cliente'),

    # Proveedores
    path('proveedores/', views.obtener_proveedores, name='obtener_proveedores'),
    path('proveedores/crear/', views.crear_proveedor, name='crear_proveedor'),
    path('proveedores/actualizar/', views.actualizar_proveedor, name='actualizar_proveedor'),
    path('proveedores/eliminar/', views.eliminar_proveedor, name='eliminar_proveedor'),

    # Productos
    path('productos/', views.obtener_productos, name='obtener_productos'),
    path('productos/crear/', views.crear_producto, name='crear_producto'),
    path('productos/actualizar/', views.actualizar_producto, name='actualizar_producto'),
    path('productos/eliminar/', views.eliminar_producto, name='eliminar_producto'),

    # Cotizaciones
    path('cotizaciones/', views.obtener_cotizaciones, name='obtener_cotizaciones'),
    path('cotizaciones/detalle/', views.obtener_detalle_cotizacion, name='obtener_detalle_cotizacion'),
    path('cotizaciones/crear/', views.crear_cotizacion, name='crear_cotizacion'),

    # Facturación
    path('facturas/', views.obtener_facturas, name='obtener_facturas'),
    path('facturas/detalle/', views.obtener_detalle_factura, name='obtener_detalle_factura'),
    path('facturas/generar/', views.generar_factura, name='generar_factura'),
    path('facturas/anular/', views.anular_factura, name='anular_factura'),
    path('facturas/anulaciones/', views.obtener_anulaciones, name='obtener_anulaciones'),

    # Pagos y Medios de Pago
    path('pagos/registrar/', views.registrar_pago, name='registrar_pago'),
    path('medios-pago/', views.obtener_medios_pago, name='obtener_medios_pago'),

    # Órdenes de Compra y Bodega
    path('ordenes-compra/crear/', views.realizar_orden_compra, name='realizar_orden_compra'),
    path('bodega/ingreso/', views.registrar_ingreso_bodega, name='registrar_ingreso_bodega'),

    # Reportería
    path('reportes/ventas/', views.reporte_ventas, name='reporte_ventas'),
    path('reportes/ventas/resumen/', views.reporte_resumen_ventas, name='reporte_resumen_ventas'),
    path('reportes/productos-mas-vendidos/', views.reporte_productos_mas_vendidos, name='reporte_productos_mas_vendidos'),
    path('reportes/inventario-stock/', views.reporte_inventario_stock, name='reporte_inventario_stock'),
    path('reportes/compras-proveedores/', views.reporte_compras_proveedores, name='reporte_compras_proveedores'),
    path('reportes/bitacora/', views.reporte_bitacora, name='reporte_bitacora'),
]
