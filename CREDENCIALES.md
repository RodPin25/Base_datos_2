# Credenciales de Acceso - Proyecto Final (Colora)

Este documento contiene las credenciales de acceso a la aplicación (cargadas mediante el **Seeder**) y los parámetros de conexión local a la base de datos SQL Server.

---

## 1. Usuarios de la Aplicación (Login API / Frontend)

Estas credenciales se crean al ejecutar [Seeder.sql] o [seed.py]. Las contraseñas están almacenadas en la tabla `[dbo].[Credenciales]` utilizando hashes **Argon2id**.

| ID Empleado | Usuario | Contraseña | ID Rol | Nombre del Rol | Sede Asignada | Permisos en el Sistema |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| `1` | `admin` | `Admin123*` | `1` | **Administrador** | Sede Central Zona 10 (`idSede = 1`) | Acceso total y creación/edición en catálogos de Empleados, Sedes y Roles |
| `2` | `consulta` | `Consulta123*` | `2` | **Consulta** | Sede Central Zona 10 (`idSede = 1`) | Visualización de todos los módulos y catálogos (solo lectura en administración) |
| `3` | `operativo` | `Operativo123*` | `3` | **Operativo** | Sede Central Zona 10 (`idSede = 1`) | Operaciones de ventas, cotizaciones, facturación, compras e inventario (sin acceso a catálogos de administración) |
| `4` | `bodega` | `Bodega123*` | `3` | **Operativo** | Sucursal Norte Zona 17 (`idSede = 2`) | Operaciones de bodega, recepciones y ventas en Sucursal Norte (`idSede = 2`) |

### Ejemplo de petición de Login (`POST /api/auth/login/`)

```json
{
  "Usuario": "admin",
  "Password": "Admin123*"
}
```

---

## 2. Credenciales de Base de Datos Local (SQL Server)

Configuradas por defecto en [.env] y [.env.example]:

| Parámetro | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| **Servidor (`DB_SERVER`)** | `localhost` | Instancia local de SQL Server |
| **Puerto (`DB_PORT`)** | `1433` | Puerto estándar de SQL Server |
| **Base de Datos (`DB_NAME`)** | `ProyectoFinal` | Nombre de la base de datos del proyecto |
| **Usuario (`DB_USER`)** | `sa` | Usuario administrador de SQL Server |
| **Contraseña (`DB_PASSWORD`)** | `Password123*` | Contraseña local de SQL Server |
| **Driver ODBC (`DB_DRIVER`)** | `ODBC Driver 17 for SQL Server` | Driver utilizado por `pyodbc` |

---

## 3. Cómo Cargar los Datos y Usuarios (Seeder)

1. Crear el esquema ejecutando [ScriptDb.sql]( en SQL Server.
2. Poblar los procedimientos almacenados y los datos iniciales ejecutando desde la terminal:

```bash
cd BackendProyecto
python seed.py --with-sps
```

*(O bien ejecutando manualmente en SSMS los scripts de `BackendProyecto/Database/` y por último [Seeder.sql]*

---
## Link de Google drive con el codigo
`https://drive.google.com/drive/folders/1pQf4Ji7euYHy4xnjH8-vlIi1f5hpLIKH?usp=sharing`