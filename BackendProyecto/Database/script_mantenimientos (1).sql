USE ProyectoFinal;
GO

-- ============================================================================
-- 1. MANTENIMIENTO: PRODUCTOS
-- ============================================================================

-- Crear / Insertar Producto
CREATE OR ALTER PROCEDURE dbo.sp_Productos_Insertar
    @id BIGINT = NULL,
    @Nombre NVARCHAR(255),
    @Caracteristicas NVARCHAR(255),
    @Precio FLOAT,
    @idMarcas BIGINT,
    @idCategoriaPresentacion BIGINT,
    @idProveedor BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT @id = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Productos];

    INSERT INTO [dbo].[Productos] ([id], [Nombre], [Caracteristicas], [Precio], [idMarcas], [idCategoriaPresentacion], [idProveedor])
    VALUES (@id, @Nombre, @Caracteristicas, @Precio, @idMarcas, @idCategoriaPresentacion, @idProveedor);

    SELECT
        1 AS Exito,
        'Producto creado exitosamente.' AS Mensaje,
        @id AS Id,
        @Nombre AS Nombre,
        @Caracteristicas AS Caracteristicas,
        @Precio AS Precio,
        @idMarcas AS idMarcas,
        @idCategoriaPresentacion AS idCategoriaPresentacion,
        @idProveedor AS idProveedor;
END;
GO

-- Leer / Consultar Productos (Todos o por ID)
CREATE OR ALTER PROCEDURE dbo.sp_Productos_Seleccionar
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT [id], [Nombre], [Caracteristicas], [Precio], [idMarcas], [idCategoriaPresentacion], [idProveedor]
        FROM [dbo].[Productos];
    ELSE
        SELECT [id], [Nombre], [Caracteristicas], [Precio], [idMarcas], [idCategoriaPresentacion], [idProveedor]
        FROM [dbo].[Productos]
        WHERE [id] = @id;
END;
GO

-- Actualizar Producto
CREATE OR ALTER PROCEDURE dbo.sp_Productos_Actualizar
    @id BIGINT,
    @Nombre NVARCHAR(255),
    @Caracteristicas NVARCHAR(255),
    @Precio FLOAT,
    @idMarcas BIGINT,
    @idCategoriaPresentacion BIGINT,
    @idProveedor BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Productos]
    SET [Nombre] = @Nombre,
        [Caracteristicas] = @Caracteristicas,
        [Precio] = @Precio,
        [idMarcas] = @idMarcas,
        [idCategoriaPresentacion] = @idCategoriaPresentacion,
        [idProveedor] = @idProveedor
    WHERE [id] = @id;
END;
GO

-- Eliminar Producto
CREATE OR ALTER PROCEDURE dbo.sp_Productos_Eliminar
    @id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [dbo].[Productos]
    WHERE [id] = @id;
END;
GO


-- ============================================================================
-- 2. MANTENIMIENTO: EMPLEADOS
-- ============================================================================

-- Crear / Insertar Empleado
CREATE OR ALTER PROCEDURE dbo.sp_Empleados_Insertar
    @id BIGINT = NULL,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @Correo NVARCHAR(255) = NULL,
    @idSede BIGINT,
    @idRol BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT @id = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Empleados];

    INSERT INTO [dbo].[Empleados] ([id], [Nombres], [Apellidos], [Correo], [idSede], [idRol])
    VALUES (@id, @Nombres, @Apellidos, @Correo, @idSede, @idRol);

    SELECT
        1 AS Exito,
        'Empleado creado exitosamente.' AS Mensaje,
        @id AS Id,
        @Nombres AS Nombres,
        @Apellidos AS Apellidos,
        @Correo AS Correo,
        @idSede AS idSede,
        @idRol AS idRol;
END;
GO

-- Leer / Consultar Empleados
CREATE OR ALTER PROCEDURE dbo.sp_Empleados_Seleccionar
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT [id], [Nombres], [Apellidos], [Correo], [idSede], [idRol]
        FROM [dbo].[Empleados];
    ELSE
        SELECT [id], [Nombres], [Apellidos], [Correo], [idSede], [idRol]
        FROM [dbo].[Empleados]
        WHERE [id] = @id;
END;
GO

-- Actualizar Empleado
CREATE OR ALTER PROCEDURE dbo.sp_Empleados_Actualizar
    @id BIGINT,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @Correo NVARCHAR(255) = NULL,
    @idSede BIGINT,
    @idRol BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Empleados]
    SET [Nombres] = @Nombres,
        [Apellidos] = @Apellidos,
        [Correo] = @Correo,
        [idSede] = @idSede,
        [idRol] = @idRol
    WHERE [id] = @id;
END;
GO

-- Eliminar Empleado
CREATE OR ALTER PROCEDURE dbo.sp_Empleados_Eliminar
    @id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [dbo].[Empleados]
    WHERE [id] = @id;
END;
GO


-- ============================================================================
-- 3. MANTENIMIENTO: CLIENTES
-- ============================================================================

-- Crear / Insertar Cliente
CREATE OR ALTER PROCEDURE dbo.sp_Clientes_Insertar
    @id BIGINT = NULL,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @NIT NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT @id = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Clientes];

    INSERT INTO [dbo].[Clientes] ([id], [Nombres], [Apellidos], [NIT])
    VALUES (@id, @Nombres, @Apellidos, @NIT);

    SELECT
        1 AS Exito,
        'Cliente creado exitosamente.' AS Mensaje,
        @id AS Id,
        @Nombres AS Nombres,
        @Apellidos AS Apellidos,
        @NIT AS NIT;
END;
GO

-- Leer / Consultar Clientes
CREATE OR ALTER PROCEDURE dbo.sp_Clientes_Seleccionar
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT [id], [Nombres], [Apellidos], [NIT]
        FROM [dbo].[Clientes];
    ELSE
        SELECT [id], [Nombres], [Apellidos], [NIT]
        FROM [dbo].[Clientes]
        WHERE [id] = @id;
END;
GO

-- Actualizar Cliente
CREATE OR ALTER PROCEDURE dbo.sp_Clientes_Actualizar
    @id BIGINT,
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @NIT NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Clientes]
    SET [Nombres] = @Nombres,
        [Apellidos] = @Apellidos,
        [NIT] = @NIT
    WHERE [id] = @id;
END;
GO

-- Eliminar Cliente
CREATE OR ALTER PROCEDURE dbo.sp_Clientes_Eliminar
    @id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [dbo].[Clientes]
    WHERE [id] = @id;
END;
GO


-- ============================================================================
-- 4. MANTENIMIENTO: PROVEEDORES
-- ============================================================================

-- Crear / Insertar Proveedor
CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Insertar
    @id BIGINT = NULL,
    @Codigo NVARCHAR(255),
    @Nombre NVARCHAR(255),
    @Contacto NVARCHAR(255),
    @Direccion NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT @id = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Proveedores];

    INSERT INTO [dbo].[Proveedores] ([id], [Codigo], [Nombre], [Contacto], [Direccion])
    VALUES (@id, @Codigo, @Nombre, @Contacto, @Direccion);

    SELECT
        1 AS Exito,
        'Proveedor creado exitosamente.' AS Mensaje,
        @id AS Id,
        @Codigo AS Codigo,
        @Nombre AS Nombre,
        @Contacto AS Contacto,
        @Direccion AS Direccion;
END;
GO

-- Leer / Consultar Proveedores
CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Seleccionar
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @id IS NULL
        SELECT [id], [Codigo], [Nombre], [Contacto], [Direccion]
        FROM [dbo].[Proveedores];
    ELSE
        SELECT [id], [Codigo], [Nombre], [Contacto], [Direccion]
        FROM [dbo].[Proveedores]
        WHERE [id] = @id;
END;
GO

-- Actualizar Proveedor
CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Actualizar
    @id BIGINT,
    @Codigo NVARCHAR(255),
    @Nombre NVARCHAR(255),
    @Contacto NVARCHAR(255),
    @Direccion NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Proveedores]
    SET [Codigo] = @Codigo,
        [Nombre] = @Nombre,
        [Contacto] = @Contacto,
        [Direccion] = @Direccion
    WHERE [id] = @id;
END;
GO

-- Eliminar Proveedor
CREATE OR ALTER PROCEDURE dbo.sp_Proveedores_Eliminar
    @id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM [dbo].[Proveedores]
    WHERE [id] = @id;
END;
GO
