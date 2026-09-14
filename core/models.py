from django.db import models

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True, db_column='Idrol')
    nombre_rol = models.CharField(max_length=50, db_column='Nombre_Rol')

    class Meta:
        db_table = 'Roles'
        managed = False

    def __str__(self):
        return self.nombre_rol


class Sede(models.Model):
    id_sede = models.AutoField(primary_key=True, db_column='idsede')
    direccion_sede = models.CharField(max_length=200, db_column='direccion_sede')
    contacto_sede = models.CharField(max_length=100, db_column='contacto_sede')

    class Meta:
        db_table = 'SEDE'
        managed = False


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True, db_column='IdUsuario')
    nombre_usuario = models.CharField(max_length=50, db_column='NombreUsuario')
    correo = models.EmailField(max_length=100, db_column='Correo')
    contrasena = models.BinaryField(db_column='Contraseña')
    id_rol = models.ForeignKey(Rol, on_delete=models.DO_NOTHING, db_column='Idrol')
    id_sede = models.ForeignKey(Sede, on_delete=models.DO_NOTHING, db_column='idSede')

    class Meta:
        db_table = 'Usuarios'
        managed = False


class Marca(models.Model):
    id_marca = models.AutoField(primary_key=True, db_column='idMarca')
    nombre_marca = models.CharField(max_length=100, db_column='Nombre_marca')

    class Meta:
        db_table = 'marcas'
        managed = False


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True, db_column='idCategoria')
    nombre = models.CharField(max_length=100, db_column='nombre')

    class Meta:
        db_table = 'categorias'
        managed = False


class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True, db_column='idproveedor')
    codigo_proveedor = models.CharField(max_length=20, db_column='codigo_proveedor')
    nombre = models.CharField(max_length=150, db_column='nombre')
    contacto = models.CharField(max_length=100, db_column='contacto')
    direccion_proveedor = models.CharField(max_length=200, db_column='direccion_proveedor')

    class Meta:
        db_table = 'proveedores'
        managed = False