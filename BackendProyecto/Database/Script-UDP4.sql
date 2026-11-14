USE ProyectoFinal;
GO

-- ============================================================================
-- Script-UDP4.sql: Anulaciones de Facturas y Devoluciones
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_AnularFactura
    @IdFactura BIGINT,
    @Motivo NVARCHAR(255) = NULL,
    @IdEmpleado BIGINT = NULL,
    @IdSede BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdVenta BIGINT;
        DECLARE @CodigoFactura NVARCHAR(255);
        DECLARE @IdSedeVenta BIGINT;
        DECLARE @IdDevolucion BIGINT;
        DECLARE @NuevoIdLog BIGINT;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);

        -- 1. Validar que la factura exista y obtener su venta asociada
        SELECT
            @IdVenta = f.[idVenta],
            @CodigoFactura = f.[Codigo],
            @IdSedeVenta = v.[idSede]
        FROM [dbo].[Facturas] f
        INNER JOIN [dbo].[Ventas] v ON v.[id] = f.[idVenta]
        WHERE f.[id] = @IdFactura;

        IF @IdVenta IS NULL
        BEGIN
            RAISERROR('La factura especificada no existe.', 16, 1);
        END;

        -- 2. Validar que la factura no haya sido anulada previamente
        IF EXISTS (SELECT 1 FROM [dbo].[Devoluciones] WHERE [idFactura] = @IdFactura)
        BEGIN
            RAISERROR('La factura ya se encuentra anulada.', 16, 1);
        END;

        -- 3. Resolver y validar Empleado
        IF @IdEmpleado IS NULL
        BEGIN
            SELECT TOP 1 @IdEmpleado = [id]
            FROM [dbo].[Empleados]
            ORDER BY [id];
        END;

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Empleados] WHERE [id] = @IdEmpleado)
        BEGIN
            RAISERROR('El empleado especificado no existe.', 16, 1);
        END;

        -- 4. Resolver y validar Sede
        IF @IdSede IS NULL
        BEGIN
            SET @IdSede = @IdSedeVenta;
        END;

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Sedes] WHERE [id] = @IdSede)
        BEGIN
            RAISERROR('La sede especificada no existe.', 16, 1);
        END;

        -- 5. Revertir el stock de los ítems vendidos en dbo.Stock
        UPDATE s
        SET
            s.[Cantidad] = s.[Cantidad] + vi.[Cantidad],
            s.[FechaActualizacion] = @Fecha
        FROM [dbo].[Stock] s
        INNER JOIN [dbo].[VentasItem] vi ON vi.[idStock] = s.[id]
        WHERE vi.[idVenta] = @IdVenta;

        -- 6. Registrar la anulación/devolución en dbo.Devoluciones
        SELECT @IdDevolucion = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Devoluciones];

        INSERT INTO [dbo].[Devoluciones] (
            [id],
            [idFactura],
            [Fecha],
            [idEmpleado],
            [idSede]
        )
        VALUES (
            @IdDevolucion,
            @IdFactura,
            @Fecha,
            @IdEmpleado,
            @IdSede
        );

        -- 7. Registrar en bitácora (dbo.Logs)
        SELECT @NuevoIdLog = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Logs];

        DECLARE @MotivoLimpio NVARCHAR(255) = NULLIF(LTRIM(RTRIM(@Motivo)), '');
        DECLARE @DescripcionLog NVARCHAR(255) = LEFT(
            'Factura anulada (Anulada) - Factura ' + @CodigoFactura +
            ISNULL(' | Motivo: ' + @MotivoLimpio, ''),
            255
        );

        INSERT INTO [dbo].[Logs] (
            [id],
            [Descripcion],
            [FechaHora],
            [idEmpleado]
        )
        VALUES (
            @NuevoIdLog,
            @DescripcionLog,
            GETDATE(),
            @IdEmpleado
        );

        COMMIT TRANSACTION;

        SELECT
            1 AS Exito,
            'Factura anulada exitosamente y stock revertido.' AS Mensaje,
            @IdDevolucion AS IdDevolucion,
            @IdFactura AS IdFactura,
            @CodigoFactura AS CodigoFactura,
            'Anulada' AS EstadoFactura;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerAnulaciones
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        d.[id],
        d.[idFactura],
        f.[Codigo] AS CodigoFactura,
        f.[idVenta],
        v.[Codigo] AS CodigoVenta,
        f.[NIT],
        ISNULL(cl.[Nombres] + ' ' + cl.[Apellidos], 'Consumidor Final') AS ClienteNombre,
        v.[MontoTotal],
        CONVERT(VARCHAR(10), d.[Fecha], 23) AS FechaAnulacion,
        d.[idEmpleado],
        ISNULL(e.[Nombres] + ' ' + e.[Apellidos], 'Empleado') AS EmpleadoNombre,
        d.[idSede],
        ISNULL(s.[Nombre], 'Sede') AS SedeNombre,
        logInfo.[Motivo]
    FROM [dbo].[Devoluciones] d
    INNER JOIN [dbo].[Facturas] f ON f.[id] = d.[idFactura]
    INNER JOIN [dbo].[Ventas] v ON v.[id] = f.[idVenta]
    LEFT JOIN [dbo].[Empleados] e ON e.[id] = d.[idEmpleado]
    LEFT JOIN [dbo].[Sedes] s ON s.[id] = d.[idSede]
    OUTER APPLY (
        SELECT TOP 1 c.[Nombres], c.[Apellidos]
        FROM [dbo].[Clientes] c
        WHERE c.[NIT] = f.[NIT]
        ORDER BY c.[id]
    ) cl
    OUTER APPLY (
        SELECT TOP 1
            CASE
                WHEN CHARINDEX('| Motivo: ', l.[Descripcion]) > 0
                    THEN SUBSTRING(
                        l.[Descripcion],
                        CHARINDEX('| Motivo: ', l.[Descripcion]) + 10,
                        255
                    )
                ELSE NULL
            END AS Motivo
        FROM [dbo].[Logs] l
        WHERE l.[Descripcion] LIKE 'Factura anulada (Anulada) - Factura ' + f.[Codigo] + '%'
        ORDER BY l.[id] DESC
    ) logInfo
    WHERE (@id IS NULL OR d.[id] = @id)
    ORDER BY d.[id] DESC;
END;
GO
