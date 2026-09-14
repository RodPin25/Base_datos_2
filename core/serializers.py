from rest_framework import serializers
from .models import Rol, Usuario, Sede, Marca, Categoria, Proveedor

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class SedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):
    # Incluimos los campos esenciales sin retornar el hash binario directamente
    class Meta:
        model = Usuario
        fields = ['id_usuario', 'nombre_usuario', 'correo', 'id_rol', 'id_sede']


# --- SERIALIZADORES PARA MANTENIMIENTOS DE TABLAS FUERTES ---

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'