import os
from dotenv import load_dotenv
import pyodbc

# Cargar el archivo .env ubicado en la misma ruta
load_dotenv()

# Obtener la Connection String
connection_string = os.getenv("CString")

if not connection_string:
    print("Error: No se encontró la variable 'CString' en el archivo .env.")
    exit(1)

print("Intentando conectar a SQL Server...")

try:
    # Establecer la conexión usando la connection string del .env
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    
    print("\n¡Conexión exitosa a la base de datos!\n")
    
    # Consultar las bases de datos disponibles
    print("Bases de datos encontradas:")
    cursor.execute("SELECT name FROM sys.databases")
    
    for row in cursor.fetchall():
        print(f" - {row[0]}")
        
    cursor.close()
    conn.close()

except Exception as e:
    print(f"\nError al conectar: {e}")