"""
db.py - Conexión directa a SQL Server usando pyodbc y el DATABASE_URL del .env
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import pyodbc

# Asegurar que las variables de entorno estén cargadas
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

DB_NAME = os.getenv('DB_NAME', 'ProyectoFinal').strip('"\'')


def get_connection():
    """Abre y devuelve una conexión pyodbc a SQL Server asegurando el contexto de BD."""
    conn_str = os.getenv('DATABASE_URL', '')
    if conn_str:
        conn_str = conn_str.strip('"\'')
    else:
        driver = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server').strip('"\'')
        server = os.getenv('DB_SERVER', '127.0.0.1').strip('"\'')
        port = os.getenv('DB_PORT', '14333').strip('"\'')
        user = os.getenv('DB_USER', 'sa').strip('"\'')
        password = os.getenv('DB_PASSWORD', '').strip('"\'')
        conn_str = f"DRIVER={{{driver}}};SERVER={server},{port};DATABASE={DB_NAME};UID={user};PWD={password};TrustServerCertificate=yes;"

    conn = pyodbc.connect(conn_str)
    # Forzar el cambio explícito al contexto de la base de datos del proyecto
    cursor = conn.cursor()
    cursor.execute(f"USE [{DB_NAME}];")
    cursor.close()
    return conn


def execute_sp(sp_name: str, params: dict | None = None):
    """
    Ejecuta un Stored Procedure en la base de datos asegurando nombre calificado de 3 partes:
    [ProyectoFinal].[dbo].[sp_nombre] para evitar que SQL Server busque en master.
    """
    # Extraer el nombre base del SP (limpia prefijos como dbo. o ProyectoFinal.dbo.)
    clean_sp_name = sp_name.split('.')[-1]
    qualified_sp = f"[{DB_NAME}].[dbo].[{clean_sp_name}]"

    conn = get_connection()
    try:
        cursor = conn.cursor()

        if params:
            placeholders = ', '.join(f'{key} = ?' for key in params.keys())
            sql = f'EXEC {qualified_sp} {placeholders}'
            cursor.execute(sql, list(params.values()))
        else:
            cursor.execute(f'EXEC {qualified_sp}')

        # Obtener nombres de columna del result set
        if cursor.description:
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            conn.commit()
            return [dict(zip(columns, row)) for row in rows]

        conn.commit()
        return []

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
