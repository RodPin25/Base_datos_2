#!/usr/bin/env python3
"""
seed.py - Script ejecutable para poblar la base de datos SQL Server (ProyectoFinal)
con todos los procedimientos almacenados y datos iniciales de prueba.

Uso desde la carpeta BackendProyecto:
    python seed.py
    python seed.py --with-sps   # También ejecuta los scripts de Stored Procedures antes del seeder
"""
import argparse
import re
import sys
from pathlib import Path

# Asegurar que el directorio BackendProyecto esté en sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from BackendProyecto_api.db import get_connection, DB_NAME  # noqa: E402


DATABASE_DIR = BASE_DIR / 'Database'

SP_SCRIPTS_ORDER = [
    'sps.sql',
    'sps_edit_delete.sql',
    'script_mantenimientos (1).sql',
    'Script-UDP1.sql',
    'Script-UDP2.sql',
    'Script-UDP3.sql',
    'Script-UDP4.sql',
    'Script-UDP5.sql',
]


def split_sql_batches(sql_text: str) -> list[str]:
    """Divide un archivo .sql en lotes separados por sentencias GO."""
    batches = re.split(r'^\s*GO\s*;?\s*$', sql_text, flags=re.IGNORECASE | re.MULTILINE)
    return [b.strip() for b in batches if b.strip()]


def execute_sql_file(conn, file_path: Path):
    """Ejecuta todos los lotes de un archivo SQL sobre la conexión activa."""
    print(f"  -> Ejecutando {file_path.name}...")
    sql_content = file_path.read_text(encoding='utf-8')
    batches = split_sql_batches(sql_content)

    cursor = conn.cursor()
    try:
        for batch in batches:
            cursor.execute(batch)
            while cursor.nextset():
                pass
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def ensure_schema_and_tables():
    """Verifica si la base de datos y las tablas existen; si no, ejecuta ScriptDb.sql."""
    master_conn = get_connection(database='master', autocommit=True)
    try:
        cur = master_conn.cursor()
        cur.execute("SELECT 1 FROM sys.databases WHERE name = ?", (DB_NAME,))
        db_exists = cur.fetchone() is not None
        if not db_exists:
            print(f"  -> Creando base de datos [{DB_NAME}]...")
            cur.execute(f"CREATE DATABASE [{DB_NAME}];")
        cur.close()
    finally:
        master_conn.close()

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');")
        table_count = cur.fetchone()[0]
        cur.close()

        if table_count == 0:
            script_db_path = DATABASE_DIR / 'ScriptDb.sql'
            print(f"  -> Ejecutando {script_db_path.name} (creando tablas y llaves foráneas)...")
            sql_content = script_db_path.read_text(encoding='utf-8')
            batches = split_sql_batches(sql_content)
            cur = conn.cursor()
            try:
                for batch in batches:
                    if re.match(r'^\s*CREATE\s+DATABASE\b', batch, flags=re.IGNORECASE):
                        continue
                    cur.execute(batch)
                    while cur.nextset():
                        pass
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
    finally:
        conn.close()


def run_seeder(include_sps: bool = False):
    print(f"Conectando a SQL Server (Base de datos: {DB_NAME})...")
    ensure_schema_and_tables()
    conn = get_connection()
    try:
        if include_sps:
            print("\n[1/2] Instalando / actualizando Stored Procedures y UDTs...")
            for script_name in SP_SCRIPTS_ORDER:
                script_path = DATABASE_DIR / script_name
                if script_path.exists():
                    execute_sql_file(conn, script_path)
                else:
                    print(f"  [!] Advertencia: No se encontró {script_path}")

        seeder_path = DATABASE_DIR / 'Seeder.sql'
        if not seeder_path.exists():
            raise FileNotFoundError(f"No se encontró el archivo {seeder_path}")

        step_label = "[2/2]" if include_sps else "[1/1]"
        print(f"\n{step_label} Poblando base de datos con {seeder_path.name}...")
        execute_sql_file(conn, seeder_path)

        print("\n============================================================")
        print(" SEEDER EJECUTADO EXITOSAMENTE")
        print("============================================================")
        print("Usuarios de prueba creados:")
        print("  1. Rol Administrador (idRol=1): Usuario: admin      | Password: Admin123*")
        print("  2. Rol Consulta      (idRol=2): Usuario: consulta   | Password: Consulta123*")
        print("  3. Rol Operativo     (idRol=3): Usuario: operativo  | Password: Operativo123*")
        print("  4. Rol Operativo S2  (idRol=3): Usuario: bodega     | Password: Bodega123*")
        print("============================================================")
    finally:
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Pobla la base de datos ProyectoFinal con datos de prueba.'
    )
    parser.add_argument(
        '--with-sps',
        action='store_true',
        help='Ejecuta también los scripts de Stored Procedures (sps, UDP1, UDP2, UDP3) antes de insertar los datos.',
    )
    args = parser.parse_args()
    run_seeder(include_sps=args.with_sps)
