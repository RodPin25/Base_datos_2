"""
db.py - Conexión directa a SQL Server usando pyodbc y las variables del .env
"""
import ctypes
from decimal import Decimal
import os
from pathlib import Path
import re
from dotenv import load_dotenv
import pyodbc

# Asegurar que las variables de entorno estén cargadas
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env', override=True)

DB_NAME = os.getenv('DB_NAME', 'ProyectoFinal').strip('"\'')


def _resolve_odbc_driver(conn_str: str) -> str:
    """Si el driver ODBC no está registrado en /etc/odbcinst.ini, usa el binario local en venv."""
    if pyodbc.drivers():
        return conn_str
    venv_dir = BASE_DIR.parent / 'venv'
    local_odbcinst = venv_dir / 'lib' / 'libodbcinst.so.2'
    local_driver = venv_dir / 'opt' / 'microsoft' / 'msodbcsql17' / 'lib64' / 'libmsodbcsql-17.11.so.1.1'
    if local_odbcinst.exists():
        ctypes.CDLL(str(local_odbcinst), mode=ctypes.RTLD_GLOBAL)
    if local_driver.exists():
        conn_str = re.sub(r'DRIVER=\{[^}]+\}', f'DRIVER={local_driver}', conn_str, flags=re.IGNORECASE)
    return conn_str


def _normalize_param_value(val):
    """Convierte Decimal a float para evitar errores de precisión en bindings de pyodbc."""
    if isinstance(val, Decimal):
        return float(val)
    return val


def _build_conn_str(database: str | None = None) -> str:
    """Construye y resuelve la cadena de conexión ODBC."""
    target_db = database or DB_NAME
    conn_str = os.getenv('DATABASE_URL', '').strip('"\'')
    if not conn_str:
        driver = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server').strip('"\'')
        server = os.getenv('DB_SERVER', 'localhost').strip('"\'')
        port = os.getenv('DB_PORT', '1433').strip('"\'')
        user = os.getenv('DB_USER', 'sa').strip('"\'')
        password = os.getenv('DB_PASSWORD', '').strip('"\'')
        trust_cert = os.getenv('DB_TRUST_CERTIFICATE', 'yes').strip('"\'')
        server_part = f"{server},{port}" if port else server
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server_part};"
            f"DATABASE={target_db};"
            f"UID={user};"
            f"PWD={password};"
            f"TrustServerCertificate={trust_cert};"
        )
    elif database:
        conn_str = re.sub(r'DATABASE=[^;]+', f'DATABASE={target_db}', conn_str, flags=re.IGNORECASE)
    return _resolve_odbc_driver(conn_str)


def get_connection(database: str | None = None, autocommit: bool = False):
    """Abre y devuelve una conexión pyodbc a SQL Server asegurando el contexto de BD."""
    target_db = database or DB_NAME
    conn_str = _build_conn_str(target_db)
    conn = pyodbc.connect(conn_str, autocommit=autocommit)
    # Forzar el cambio explícito al contexto de la base de datos objetivo
    cursor = conn.cursor()
    cursor.execute(f"USE [{target_db}];")
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
            udt_values = []
            exec_values = []
            exec_assignments = []

            if params:
                for key, val in params.items():
                    param_name = key if key.startswith('@') else f'@{key}'
                    exec_assignments.append(f'{param_name} = ?')
                    exec_values.append(_normalize_param_value(val))

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
                                udt_values.extend(_normalize_param_value(row[col]) for col in columns)
                            else:
                                udt_values.extend(_normalize_param_value(v) for v in row)

                exec_assignments.append(f'{param_name} = {var_name}')

            if exec_assignments:
                placeholders = ', '.join(exec_assignments)
                sql_statements.append(f'EXEC {qualified_sp} {placeholders};')
            else:
                sql_statements.append(f'EXEC {qualified_sp};')

            sql = '\n'.join(sql_statements)
            cursor.execute(sql, udt_values + exec_values)
        elif params:
            placeholders = ', '.join(
                f"{key if key.startswith('@') else '@' + key} = ?"
                for key in params.keys()
            )
            sql = f'EXEC {qualified_sp} {placeholders}'
            cursor.execute(sql, [_normalize_param_value(v) for v in params.values()])
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
