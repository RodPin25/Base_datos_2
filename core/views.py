from django.shortcuts import render
#-- Aquí implementamos el endpoint de Login (invocando la capa de servicio para validar con la base de datos) y los ViewSets para los mantenimientos de usuarios, roles y las tablas fuertes
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Rol, Usuario, Sede, Marca, Categoria, Proveedor
from .serializers import (
    RolSerializer, UsuarioSerializer, SedeSerializer,
    MarcaSerializer, CategoriaSerializer, ProveedorSerializer
)
from .services import AutenticacionService


# --- AUTENTICACIÓN / LOGIN CIFRADO ---
class LoginView(APIView):
    def post(self, request):
        usuario = request.data.get('usuario')
        contrasena = request.data.get('contrasena')

        if not usuario or not contrasena:
            return Response(
                {'error': 'Debe proporcionar usuario y contraseña.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        datos_usuario = AutenticacionService.validar_usuario(usuario, contrasena)

        if datos_usuario:
            return Response({
                'mensaje': 'Autenticación exitosa',
                'usuario': datos_usuario
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Credenciales inválidas.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


# --- ADMINISTRACIÓN DE USUARIOS Y ROLES ---
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


# --- MANTENIMIENTOS DE TABLAS FUERTES (FASE 1) ---
class SedeViewSet(viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
# Create your views here.
