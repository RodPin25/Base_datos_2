USE ProyectoFinal;
GO

-- ============================================================================
-- SCRIPT DE PROCEDIMIENTOS ALMACENADOS: EDICIÓN (UPDATE) Y ELIMINACIÓN (DELETE)
-- Diseñados para integrarse con la API de Backend (Django / pyodbc).
-- Todos los SPs manejan control de errores (TRY/CATCH), validaciones de
-- integridad referencial (FK), transacciones atómicas y retornan el formato
-- estándar: [Exito] (1 o 0), [Mensaje] y los datos modificados / ID eliminado.
-- ============================================================================


-- ============================================================================
-- 1. SEDES: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 1.1 SP: ACTUALIZAR SEDE
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarSede
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @Direccion NVARCHAR(255),
    @Contacto NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que la sede exista
        IF NOT EXISTS (SELECT 1 FROM dbo.Sedes WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La sede con el ID proporcionado no existe.';
            SELECT 
                0 AS Exito, 
                @MensajeSalida AS Mensaje, 
                NULL AS Id, 
                NULL AS Nombre, 
                NULL AS Direccion, 
                NULL AS Contacto;
            RETURN;
        END;

        -- Validar campos obligatorios
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            SET @MensajeSalida = 'El nombre de la sede es obligatorio.';
            SELECT 
                0 AS Exito, 
                @MensajeSalida AS Mensaje, 
                NULL AS Id, 
                NULL AS Nombre, 
                NULL AS Direccion, 
                NULL AS Contacto;
            RETURN;
        END;

        UPDATE dbo.Sedes
        SET Nombre = @Nombre,
            Direccion = @Direccion,
            Contacto = @Contacto
        WHERE id = @id;

        SET @MensajeSalida = 'Sede actualizada exitosamente.';

        SELECT 
            1 AS Exito,
            @MensajeSalida AS Mensaje,
            @id AS Id,
            @Nombre AS Nombre,
            @Direccion AS Direccion,
            @Contacto AS Contacto;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 
            0 AS Exito,
            @MensajeSalida AS Mensaje,
            NULL AS Id,
            NULL AS Nombre,
            NULL AS Direccion,
            NULL AS Contacto;
    END CATCH
END;
GO


-- 1.2 SP: ELIMINAR SEDE
CREATE OR ALTER PROCEDURE dbo.sp_EliminarSede
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar que la sede exista
        IF NOT EXISTS (SELECT 1 FROM dbo.Sedes WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La sede con el ID especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Empleados
        IF EXISTS (SELECT 1 FROM dbo.Empleados WHERE idSede = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la sede porque tiene empleados asignados.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Stock
        IF EXISTS (SELECT 1 FROM dbo.Stock WHERE idSede = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la sede porque tiene registros de stock asociados.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Inventario
        IF EXISTS (SELECT 1 FROM dbo.Inventario WHERE idSede = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la sede porque tiene inventarios registrados.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Ventas
        IF EXISTS (SELECT 1 FROM dbo.Ventas WHERE idSede = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la sede porque tiene transacciones de ventas registradas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Devoluciones
        IF EXISTS (SELECT 1 FROM dbo.Devoluciones WHERE idSede = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la sede porque tiene devoluciones asociadas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Sedes WHERE id = @id;

        SET @MensajeSalida = 'Sede eliminada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 2. ROLES: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 2.1 SP: ACTUALIZAR ROL
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarRol
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El rol especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            SET @MensajeSalida = 'El nombre del rol es obligatorio.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        -- Validar que no duplique otro rol
        IF EXISTS (SELECT 1 FROM dbo.Roles WHERE LOWER(Nombre) = LOWER(LTRIM(RTRIM(@Nombre))) AND id <> @id)
        BEGIN
            SET @MensajeSalida = 'Ya existe otro rol registrado con ese nombre.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        UPDATE dbo.Roles
        SET Nombre = @Nombre
        WHERE id = @id;

        SET @MensajeSalida = 'Rol actualizado exitosamente.';

        SELECT 
            1 AS Exito,
            @MensajeSalida AS Mensaje,
            @id AS Id,
            @Nombre AS Nombre;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
    END CATCH
END;
GO


-- 2.2 SP: ELIMINAR ROL
CREATE OR ALTER PROCEDURE dbo.sp_EliminarRol
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El rol especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar si hay empleados con este rol
        IF EXISTS (SELECT 1 FROM dbo.Empleados WHERE idRol = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el rol porque se encuentra asignado a uno o más empleados.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Roles WHERE id = @id;

        SET @MensajeSalida = 'Rol eliminado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 3. EMPLEADOS Y CREDENCIALES: ACTUALIZAR Y ELIMINAR (TRANSACCIONAL)
-- ============================================================================

-- 3.1 SP: ACTUALIZAR EMPLEADO Y/O CREDENCIALES
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarEmpleado
    @id BIGINT,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @Correo NVARCHAR(255) = NULL,
    @idSede BIGINT,
    @idRol BIGINT,
    @Usuario NVARCHAR(255) = NULL,       -- Opcional: solo si se actualiza el usuario
    @HashContra NVARCHAR(255) = NULL,    -- Opcional: solo si se actualiza la contraseña
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar existencia del empleado
        IF NOT EXISTS (SELECT 1 FROM dbo.Empleados WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El empleado especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        -- Validar existencia de Sede
        IF NOT EXISTS (SELECT 1 FROM dbo.Sedes WHERE id = @idSede)
        BEGIN
            SET @MensajeSalida = 'La sede especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        -- Validar existencia de Rol
        IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE id = @idRol)
        BEGIN
            SET @MensajeSalida = 'El rol especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        -- Si se proporciona un nuevo usuario, validar que no esté ocupado por otro empleado
        IF @Usuario IS NOT NULL AND LTRIM(RTRIM(@Usuario)) <> ''
        BEGIN
            IF EXISTS (SELECT 1 FROM dbo.Credenciales WHERE LOWER(Usuario) = LOWER(LTRIM(RTRIM(@Usuario))) AND idEmpleado <> @id)
            BEGIN
                SET @MensajeSalida = 'El nombre de usuario ya está siendo utilizado por otro empleado.';
                SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
                RETURN;
            END;
        END;

        BEGIN TRANSACTION;

        -- 1. Actualizar datos del empleado
        UPDATE dbo.Empleados
        SET Nombres = @Nombres,
            Apellidos = @Apellidos,
            Correo = @Correo,
            idSede = @idSede,
            idRol = @idRol
        WHERE id = @id;

        -- 2. Actualizar credenciales si se especificó usuario o contraseña
        IF @Usuario IS NOT NULL OR @HashContra IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM dbo.Credenciales WHERE idEmpleado = @id)
            BEGIN
                UPDATE dbo.Credenciales
                SET Usuario = ISNULL(@Usuario, Usuario),
                    HashContra = ISNULL(@HashContra, HashContra)
                WHERE idEmpleado = @id;
            END
            ELSE
            BEGIN
                -- En caso de que no existiera registro de credencial para este empleado
                DECLARE @NuevoIdCredencial BIGINT;
                SELECT @NuevoIdCredencial = ISNULL(MAX(id), 0) + 1 FROM dbo.Credenciales;

                INSERT INTO dbo.Credenciales (id, idEmpleado, Usuario, HashContra)
                VALUES (@NuevoIdCredencial, @id, ISNULL(@Usuario, 'usuario_' + CAST(@id AS NVARCHAR)), ISNULL(@HashContra, ''));
            END;
        END;

        COMMIT TRANSACTION;

        SET @MensajeSalida = 'Empleado actualizado exitosamente.';

        SELECT 
            1 AS Exito,
            @MensajeSalida AS Mensaje,
            e.id AS Id,
            e.Nombres,
            e.Apellidos,
            e.Correo,
            e.idSede,
            s.Nombre AS SedeNombre,
            e.idRol,
            r.Nombre AS RolNombre,
            c.Usuario
        FROM dbo.Empleados e
        INNER JOIN dbo.Sedes s ON e.idSede = s.id
        INNER JOIN dbo.Roles r ON e.idRol = r.id
        LEFT JOIN dbo.Credenciales c ON e.id = c.idEmpleado
        WHERE e.id = @id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
    END CATCH
END;
GO


-- 3.2 SP: ELIMINAR EMPLEADO Y SUS CREDENCIALES (TRANSACCIONAL)
CREATE OR ALTER PROCEDURE dbo.sp_EliminarEmpleado
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Empleados WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El empleado especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar dependencias con Ventas
        IF EXISTS (SELECT 1 FROM dbo.Ventas WHERE idEmpleado = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el empleado porque posee registros de ventas generadas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar dependencias con Compras a Proveedores
        IF EXISTS (SELECT 1 FROM dbo.CompraProveedor WHERE idEmpleado = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el empleado porque tiene órdenes de compra asociadas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar dependencias con Entrega de Proveedores
        IF EXISTS (SELECT 1 FROM dbo.EntregaProveedores WHERE idEmpleado = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el empleado porque tiene entregas registradas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar dependencias con Devoluciones
        IF EXISTS (SELECT 1 FROM dbo.Devoluciones WHERE idEmpleado = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el empleado porque procesó devoluciones.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar dependencias con Logs
        IF EXISTS (SELECT 1 FROM dbo.Logs WHERE idEmpleado = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el empleado porque cuenta con registros en la auditoría de logs.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        BEGIN TRANSACTION;

        -- Eliminar credenciales asociadas al empleado
        DELETE FROM dbo.Credenciales WHERE idEmpleado = @id;

        -- Eliminar el registro del empleado
        DELETE FROM dbo.Empleados WHERE id = @id;

        COMMIT TRANSACTION;

        SET @MensajeSalida = 'Empleado y credenciales eliminados exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 4. CLIENTES: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 4.1 SP: ACTUALIZAR CLIENTE
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarCliente
    @id BIGINT,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @NIT NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Clientes WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El cliente especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS NIT;
            RETURN;
        END;

        IF @Nombres IS NULL OR LTRIM(RTRIM(@Nombres)) = '' OR @Apellidos IS NULL OR LTRIM(RTRIM(@Apellidos)) = ''
        BEGIN
            SET @MensajeSalida = 'Nombres y apellidos son obligatorios.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS NIT;
            RETURN;
        END;

        UPDATE dbo.Clientes
        SET Nombres = @Nombres,
            Apellidos = @Apellidos,
            NIT = @NIT
        WHERE id = @id;

        SET @MensajeSalida = 'Cliente actualizado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @Nombres AS Nombres, @Apellidos AS Apellidos, @NIT AS NIT;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS NIT;
    END CATCH
END;
GO


-- 4.2 SP: ELIMINAR CLIENTE
CREATE OR ALTER PROCEDURE dbo.sp_EliminarCliente
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Clientes WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El cliente especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relaciones con Cotizaciones
        IF EXISTS (SELECT 1 FROM dbo.CotizacionItem WHERE idCliente = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el cliente porque tiene cotizaciones asociadas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Clientes WHERE id = @id;

        SET @MensajeSalida = 'Cliente eliminado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 5. PROVEEDORES: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 5.1 SP: ACTUALIZAR PROVEEDOR
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarProveedor
    @id BIGINT,
    @Codigo NVARCHAR(255),
    @Nombre NVARCHAR(255),
    @Contacto NVARCHAR(255),
    @Direccion NVARCHAR(255) = NULL,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Proveedores WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El proveedor especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Codigo, NULL AS Nombre, NULL AS Contacto, NULL AS Direccion;
            RETURN;
        END;

        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = '' OR @Codigo IS NULL OR LTRIM(RTRIM(@Codigo)) = ''
        BEGIN
            SET @MensajeSalida = 'El código y nombre del proveedor son obligatorios.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Codigo, NULL AS Nombre, NULL AS Contacto, NULL AS Direccion;
            RETURN;
        END;

        UPDATE dbo.Proveedores
        SET Codigo = @Codigo,
            Nombre = @Nombre,
            Contacto = @Contacto,
            Direccion = @Direccion
        WHERE id = @id;

        SET @MensajeSalida = 'Proveedor actualizado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @Codigo AS Codigo, @Nombre AS Nombre, @Contacto AS Contacto, @Direccion AS Direccion;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Codigo, NULL AS Nombre, NULL AS Contacto, NULL AS Direccion;
    END CATCH
END;
GO


-- 5.2 SP: ELIMINAR PROVEEDOR
CREATE OR ALTER PROCEDURE dbo.sp_EliminarProveedor
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Proveedores WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El proveedor especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar si tiene productos asignados
        IF EXISTS (SELECT 1 FROM dbo.Productos WHERE idProveedor = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el proveedor porque tiene productos vinculados.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar si tiene compras registradas
        IF EXISTS (SELECT 1 FROM dbo.CompraProveedor WHERE idProveedor = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el proveedor porque tiene compras registradas.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Proveedores WHERE id = @id;

        SET @MensajeSalida = 'Proveedor eliminado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 6. PRODUCTOS: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 6.1 SP: ACTUALIZAR PRODUCTO
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarProducto
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @Caracteristicas NVARCHAR(255),
    @Precio FLOAT,
    @idMarcas BIGINT,
    @idCategoriaPresentacion BIGINT,
    @idProveedor BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El producto especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Caracteristicas, NULL AS Precio, NULL AS idMarcas, NULL AS idCategoriaPresentacion, NULL AS idProveedor;
            RETURN;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Marcas WHERE id = @idMarcas)
        BEGIN
            SET @MensajeSalida = 'La marca especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Caracteristicas, NULL AS Precio, NULL AS idMarcas, NULL AS idCategoriaPresentacion, NULL AS idProveedor;
            RETURN;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.CategoriaPresentacion WHERE id = @idCategoriaPresentacion)
        BEGIN
            SET @MensajeSalida = 'La categoría-presentación especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Caracteristicas, NULL AS Precio, NULL AS idMarcas, NULL AS idCategoriaPresentacion, NULL AS idProveedor;
            RETURN;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Proveedores WHERE id = @idProveedor)
        BEGIN
            SET @MensajeSalida = 'El proveedor especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Caracteristicas, NULL AS Precio, NULL AS idMarcas, NULL AS idCategoriaPresentacion, NULL AS idProveedor;
            RETURN;
        END;

        UPDATE dbo.Productos
        SET Nombre = @Nombre,
            Caracteristicas = @Caracteristicas,
            Precio = @Precio,
            idMarcas = @idMarcas,
            idCategoriaPresentacion = @idCategoriaPresentacion,
            idProveedor = @idProveedor
        WHERE id = @id;

        SET @MensajeSalida = 'Producto actualizado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @Nombre AS Nombre, @Caracteristicas AS Caracteristicas, @Precio AS Precio, @idMarcas AS idMarcas, @idCategoriaPresentacion AS idCategoriaPresentacion, @idProveedor AS idProveedor;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Caracteristicas, NULL AS Precio, NULL AS idMarcas, NULL AS idCategoriaPresentacion, NULL AS idProveedor;
    END CATCH
END;
GO


-- 6.2 SP: ELIMINAR PRODUCTO
CREATE OR ALTER PROCEDURE dbo.sp_EliminarProducto
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'El producto especificado no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        -- Validar relación con Stock
        IF EXISTS (SELECT 1 FROM dbo.Stock WHERE idProducto = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar el producto porque tiene existencias en Stock.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Productos WHERE id = @id;

        SET @MensajeSalida = 'Producto eliminado exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO


-- ============================================================================
-- 7. MARCAS, CATEGORIAS Y PRESENTACIONES: ACTUALIZAR Y ELIMINAR
-- ============================================================================

-- 7.1 MARCAS
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarMarca
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Marcas WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La marca especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        UPDATE dbo.Marcas SET Nombre = @Nombre WHERE id = @id;
        SET @MensajeSalida = 'Marca actualizada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @Nombre AS Nombre;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarMarca
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Marcas WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La marca especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM dbo.Productos WHERE idMarcas = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la marca porque está asignada a productos.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Marcas WHERE id = @id;
        SET @MensajeSalida = 'Marca eliminada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO

-- 7.2 CATEGORIAS
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarCategoria
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Categoria WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La categoría especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        UPDATE dbo.Categoria SET Nombre = @Nombre WHERE id = @id;
        SET @MensajeSalida = 'Categoría actualizada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @Nombre AS Nombre;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarCategoria
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Categoria WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La categoría especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM dbo.CategoriaPresentacion WHERE idCategoria = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la categoría porque está asociada a presentaciones de productos.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Categoria WHERE id = @id;
        SET @MensajeSalida = 'Categoría eliminada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO

-- 7.3 PRESENTACIONES
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarPresentacion
    @id BIGINT,
    @NombreTipo NVARCHAR(255),
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Presentacion WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La presentación especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS NombreTipo;
            RETURN;
        END;

        UPDATE dbo.Presentacion SET NombreTipo = @NombreTipo WHERE id = @id;
        SET @MensajeSalida = 'Presentación actualizada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS Id, @NombreTipo AS NombreTipo;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS NombreTipo;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarPresentacion
    @id BIGINT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Presentacion WHERE id = @id)
        BEGIN
            SET @MensajeSalida = 'La presentación especificada no existe.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM dbo.CategoriaPresentacion WHERE idPresentacion = @id)
        BEGIN
            SET @MensajeSalida = 'No se puede eliminar la presentación porque está vinculada a categorías.';
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
            RETURN;
        END;

        DELETE FROM dbo.Presentacion WHERE id = @id;
        SET @MensajeSalida = 'Presentación eliminada exitosamente.';
        SELECT 1 AS Exito, @MensajeSalida AS Mensaje, @id AS IdEliminado;
    END TRY
    BEGIN CATCH
        SET @MensajeSalida = ERROR_MESSAGE();
        SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS IdEliminado;
    END CATCH
END;
GO

