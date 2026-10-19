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


def execute_sp(sp_name: str, params: dict | None = None, udt_params: dict | None = None):
    """
    Ejecuta un Stored Procedure en la base de datos asegurando nombre calificado de 3 partes:
    [ProyectoFinal].[dbo].[sp_nombre] para evitar que SQL Server busque en master.

    Soporta parámetros escalares (`params`) y parámetros de tipo tabla UDT (`udt_params`).
    Formato de `udt_params`:
    {
        '@NombreParametroUDT': {
            'type_name': 'dbo.NombreTipoUDT',
            'columns': ['Col1', 'Col2', ...],
            'rows': [{'Col1': val1, 'Col2': val2}, ...]
        }
    }
    """
    # Extraer el nombre base del SP (limpia prefijos como dbo. o ProyectoFinal.dbo.)
    clean_sp_name = sp_name.split('.')[-1]
    qualified_sp = f"[{DB_NAME}].[dbo].[{clean_sp_name}]"

    conn = get_connection()
    try:
        cursor = conn.cursor()

        if udt_params:
            sql_statements = ["SET NOCOUNT ON;"]
            sql_values = []
            exec_assignments = []

            if params:
                for key, val in params.items():
                    param_name = key if key.startswith('@') else f'@{key}'
                    exec_assignments.append(f'{param_name} = ?')
                    sql_values.append(val)

            for idx, (key, udt_info) in enumerate(udt_params.items()):
                param_name = key if key.startswith('@') else f'@{key}'
                var_name = f'@udt_{idx}_{param_name.lstrip("@")}'
                clean_type_name = udt_info['type_name'].split('.')[-1]
                columns = udt_info['columns']
                rows = udt_info.get('rows') or []

                sql_statements.append(f"DECLARE {var_name} [dbo].[{clean_type_name}];")
                if rows:
                    cols_sql = ', '.join(f'[{col}]' for col in columns)
                    row_placeholders = '(' + ', '.join('?' for _ in columns) + ')'
                    for i in range(0, len(rows), 500):
                        chunk = rows[i:i + 500]
                        values_sql = ', '.join(row_placeholders for _ in chunk)
                        sql_statements.append(f"INSERT INTO {var_name} ({cols_sql}) VALUES {values_sql};")
                        for row in chunk:
                            if isinstance(row, dict):
                                sql_values.extend(row[col] for col in columns)
                            else:
                                sql_values.extend(row)

                exec_assignments.append(f'{param_name} = {var_name}')

            if exec_assignments:
                placeholders = ', '.join(exec_assignments)
                sql_statements.append(f'EXEC {qualified_sp} {placeholders};')
            else:
                sql_statements.append(f'EXEC {qualified_sp};')

            sql = '\n'.join(sql_statements)
            cursor.execute(sql, sql_values)
        elif params:
            placeholders = ', '.join(f'{key} = ?' for key in params.keys())
            sql = f'EXEC {qualified_sp} {placeholders}'
            cursor.execute(sql, list(params.values()))
        else:
            cursor.execute(f'EXEC {qualified_sp}')

        # Avanzar si hay mensajes intermedios sin columnas antes del result set final
        while cursor.description is None:
            if not cursor.nextset():
                break

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

