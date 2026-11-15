USE ProyectoFinal;
GO

-- ============================================================================
-- 1. SP: INSERTAR SEDE
-- Retorna: Exito, Mensaje, Id y Data. Soporta parámetros OUTPUT opcionales.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_InsertarSede
    @Nombre NVARCHAR(255),
    @Direccion NVARCHAR(255),
    @Contacto NVARCHAR(255),
    @IdCreado BIGINT = NULL OUTPUT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar campos obligatorios
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            SET @MensajeSalida = 'El nombre de la sede es obligatorio.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre, NULL AS Direccion, NULL AS Contacto;
            RETURN;
        END;

        DECLARE @NuevoId BIGINT;
        SELECT @NuevoId = ISNULL(MAX(id), 0) + 1 FROM dbo.Sedes;

        INSERT INTO dbo.Sedes (id, Nombre, Direccion, Contacto)
        VALUES (@NuevoId, @Nombre, @Direccion, @Contacto);

        SET @IdCreado = @NuevoId;
        SET @MensajeSalida = 'Sede creada exitosamente.';

        SELECT 
            1 AS Exito,
            @MensajeSalida AS Mensaje,
            @NuevoId AS Id,
            @Nombre AS Nombre,
            @Direccion AS Direccion,
            @Contacto AS Contacto;
    END TRY
    BEGIN CATCH
        SET @IdCreado = NULL;
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

-- ============================================================================
-- 2. SP: OBTENER SEDE(S)
-- Si @id es NULL, devuelve todas las sedes. Si tiene valor, devuelve la específica.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerSedes
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id, 
        Nombre, 
        Direccion, 
        Contacto
    FROM dbo.Sedes
    WHERE (@id IS NULL OR id = @id);
END;
GO

-- ============================================================================
-- 3. SP: INSERTAR ROL
-- Retorna: Exito, Mensaje, Id y Data. Soporta parámetros OUTPUT opcionales.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_InsertarRol
    @Nombre NVARCHAR(255),
    @IdCreado BIGINT = NULL OUTPUT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        BEGIN
            SET @MensajeSalida = 'El nombre del rol es obligatorio.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        -- Validar si ya existe un rol con ese nombre
        IF EXISTS (SELECT 1 FROM dbo.Roles WHERE LOWER(Nombre) = LOWER(LTRIM(RTRIM(@Nombre))))
        BEGIN
            SET @MensajeSalida = 'Ya existe un rol con ese nombre.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombre;
            RETURN;
        END;

        DECLARE @NuevoId BIGINT;
        SELECT @NuevoId = ISNULL(MAX(id), 0) + 1 FROM dbo.Roles;

        INSERT INTO dbo.Roles (id, Nombre)
        VALUES (@NuevoId, @Nombre);

        SET @IdCreado = @NuevoId;
        SET @MensajeSalida = 'Rol creado exitosamente.';

        SELECT 
            1 AS Exito,
            @MensajeSalida AS Mensaje,
            @NuevoId AS Id,
            @Nombre AS Nombre;
    END TRY
    BEGIN CATCH
        SET @IdCreado = NULL;
        SET @MensajeSalida = ERROR_MESSAGE();

        SELECT 
            0 AS Exito,
            @MensajeSalida AS Mensaje,
            NULL AS Id,
            NULL AS Nombre;
    END CATCH
END;
GO

-- ============================================================================
-- 4. SP: OBTENER ROL(ES)
-- Si @id es NULL, devuelve todos los roles. Si tiene valor, devuelve el específico.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerRoles
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id, 
        Nombre
    FROM dbo.Roles
    WHERE (@id IS NULL OR id = @id);
END;
GO

-- ============================================================================
-- 5. SP: INSERTAR EMPLEADO Y CREDENCIALES (TRANSACCIONAL)
-- Retorna: Exito, Mensaje, Id y Data. Soporta parámetros OUTPUT opcionales.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_InsertarEmpleado
    @Nombres NVARCHAR(255),
    @Apellidos NVARCHAR(255),
    @Correo NVARCHAR(255) = NULL,
    @idSede BIGINT,
    @idRol BIGINT,
    @Usuario NVARCHAR(255),
    @HashContra NVARCHAR(255),
    @IdCreado BIGINT = NULL OUTPUT,
    @MensajeSalida NVARCHAR(255) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validar existencia de Sede
        IF NOT EXISTS (SELECT 1 FROM dbo.Sedes WHERE id = @idSede)
        BEGIN
            SET @MensajeSalida = 'La sede especificada no existe.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        -- Validar existencia de Rol
        IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE id = @idRol)
        BEGIN
            SET @MensajeSalida = 'El rol especificado no existe.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        -- Validar que el usuario no exista
        IF EXISTS (SELECT 1 FROM dbo.Credenciales WHERE LOWER(Usuario) = LOWER(LTRIM(RTRIM(@Usuario))))
        BEGIN
            SET @MensajeSalida = 'El nombre de usuario ya se encuentra registrado.';
            SET @IdCreado = NULL;
            SELECT 0 AS Exito, @MensajeSalida AS Mensaje, NULL AS Id, NULL AS Nombres, NULL AS Apellidos, NULL AS Correo, NULL AS idSede, NULL AS SedeNombre, NULL AS idRol, NULL AS RolNombre, NULL AS Usuario;
            RETURN;
        END;

        BEGIN TRANSACTION;

        -- Generar ID para Empleado
        DECLARE @NuevoIdEmpleado BIGINT;
        SELECT @NuevoIdEmpleado = ISNULL(MAX(id), 0) + 1 FROM dbo.Empleados;

        INSERT INTO dbo.Empleados (id, Nombres, Apellidos, Correo, idSede, idRol)
        VALUES (@NuevoIdEmpleado, @Nombres, @Apellidos, @Correo, @idSede, @idRol);

        -- Generar ID para Credencial
        DECLARE @NuevoIdCredencial BIGINT;
        SELECT @NuevoIdCredencial = ISNULL(MAX(id), 0) + 1 FROM dbo.Credenciales;

        INSERT INTO dbo.Credenciales (id, idEmpleado, Usuario, HashContra)
        VALUES (@NuevoIdCredencial, @NuevoIdEmpleado, @Usuario, @HashContra);

        COMMIT TRANSACTION;

        SET @IdCreado = @NuevoIdEmpleado;
        SET @MensajeSalida = 'Empleado y credenciales registrados exitosamente.';

        -- Retornar data completa
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
        INNER JOIN dbo.Credenciales c ON e.id = c.idEmpleado
        WHERE e.id = @NuevoIdEmpleado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SET @IdCreado = NULL;
        SET @MensajeSalida = ERROR_MESSAGE();

        SELECT 
            0 AS Exito,
            @MensajeSalida AS Mensaje,
            NULL AS Id,
            NULL AS Nombres,
            NULL AS Apellidos,
            NULL AS Correo,
            NULL AS idSede,
            NULL AS SedeNombre,
            NULL AS idRol,
            NULL AS RolNombre,
            NULL AS Usuario;
    END CATCH
END;
GO

-- ============================================================================
-- 6. SP: OBTENER EMPLEADO(S)
-- Si @id es NULL, devuelve todos los empleados. Si tiene valor, devuelve el específico.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerEmpleados
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        e.id,
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
    WHERE (@id IS NULL OR e.id = @id);
END;
GO

-- ============================================================================
-- 7. SP: LOGIN (OBTENER CREDENCIALES POR USUARIO)
-- Input: @Usuario
-- Devuelve: HashContra, idEmpleado, y datos asociados para autenticación
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerCredencialesPorUsuario
    @Usuario NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.idEmpleado,
        c.Usuario,
        c.HashContra,
        e.idRol,
        e.idSede
    FROM [ProyectoFinal].[dbo].[Credenciales] c
    INNER JOIN [ProyectoFinal].[dbo].[Empleados] e ON c.idEmpleado = e.id
    WHERE LOWER(c.Usuario) = LOWER(LTRIM(RTRIM(@Usuario)));
END;
GO

-- ============================================================================
-- 8. OBTENER CATEGORÍAS Y PRESENTACIONES (JOIN CategoriaPresentacion + Categoria + Presentacion)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerCategoriasPresentaciones
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.[id],
        cp.[idCategoria],
        c.[Nombre] AS CategoriaNombre,
        cp.[idPresentacion],
        p.[NombreTipo] AS PresentacionNombre,
        c.[Nombre] + ' - ' + p.[NombreTipo] AS NombreCompleto
    FROM [dbo].[CategoriaPresentacion] cp
    INNER JOIN [dbo].[Categoria] c ON c.[id] = cp.[idCategoria]
    INNER JOIN [dbo].[Presentacion] p ON p.[id] = cp.[idPresentacion]
    WHERE (@id IS NULL OR cp.[id] = @id)
    ORDER BY c.[Nombre], p.[NombreTipo];
END;
GO

-- ============================================================================
-- 9. OBTENER MARCAS
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerMarcas
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.[id],
        m.[Nombre]
    FROM [dbo].[Marcas] m
    WHERE (@id IS NULL OR m.[id] = @id)
    ORDER BY m.[Nombre];
END;
GO
