# core/services.py
from django.db import connection

class AutenticacionService:
    @staticmethod
    def validar_usuario(nombre_usuario, contrasena_plana):
        """
        Ejecuta el Procedimiento Almacenado en SQL Server que valida 
        y compara la contraseña cifrada desde la base de datos.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ValidarUsuario %s, %s", [nombre_usuario, contrasena_plana])
            row = cursor.fetchone()
            
            if row:
                return {
                    "id_usuario": row[0],
                    "nombre_usuario": row[1],
                    "rol": row[2],
                    "id_sede": row[3]
                }
            return None