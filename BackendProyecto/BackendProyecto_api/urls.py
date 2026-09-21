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
]
