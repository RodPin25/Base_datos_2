USE ProyectoFinal;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RegistrarPago
    @IdFactura BIGINT,
    @IdMedioPago BIGINT,
    @MontoPagado DECIMAL(18, 2),
    @Referencia VARCHAR(100) = NULL -- Útil para números de autorización de tarjeta o transferencias
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdVenta BIGINT;
        DECLARE @CodigoFactura NVARCHAR(255);
        DECLARE @IdEmpleado BIGINT;
        DECLARE @TotalFactura DECIMAL(18, 2);

        -- 1. Validar que la factura exista en dbo.Facturas y obtener su venta asociada
        SELECT
            @IdVenta = [idVenta],
            @CodigoFactura = [Codigo]
        FROM [dbo].[Facturas]
        WHERE [id] = @IdFactura;

        IF @IdVenta IS NULL
        BEGIN
            RAISERROR('La factura especificada no existe.', 16, 1);
        END;

        IF EXISTS (SELECT 1 FROM [dbo].[Devoluciones] WHERE [idFactura] = @IdFactura)
        BEGIN
            RAISERROR('No se puede registrar un pago sobre una factura anulada.', 16, 1);
        END;

        -- 2. Validar que el método de pago exista en dbo.MetodoPago
        IF NOT EXISTS (SELECT 1 FROM [dbo].[MetodoPago] WHERE [id] = @IdMedioPago)
        BEGIN
            RAISERROR('El método de pago especificado no existe.', 16, 1);
        END;

        IF @MontoPagado <= 0
        BEGIN
            RAISERROR('El monto pagado debe ser mayor a cero.', 16, 1);
        END;

        -- 3. Obtener datos de la venta y calcular total desde dbo.Ventas y dbo.VentasItem
        SELECT
            @IdEmpleado = [idEmpleado],
            @TotalFactura = CAST([MontoTotal] AS DECIMAL(18, 2))
        FROM [dbo].[Ventas]
        WHERE [id] = @IdVenta;

        SELECT
            @TotalFactura = ISNULL(CAST(SUM([Subtotal]) AS DECIMAL(18, 2)), @TotalFactura)
        FROM [dbo].[VentasItem]
        WHERE [idVenta] = @IdVenta;

        -- 4. Actualizar el método de pago en dbo.Ventas
        UPDATE [dbo].[Ventas]
        SET [idMetodoPago] = @IdMedioPago
        WHERE [id] = @IdVenta;

        -- 5. Registrar el pago y su estado en la bitácora (dbo.Logs)
        DECLARE @NuevoIdLog BIGINT;
        SELECT @NuevoIdLog = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Logs];

        DECLARE @EstadoFactura NVARCHAR(50) = CASE
            WHEN @MontoPagado >= @TotalFactura THEN 'Pagada'
            ELSE 'Pago Parcial'
        END;

        DECLARE @DescripcionLog NVARCHAR(255) = LEFT(
            'Pago registrado (' + @EstadoFactura + ') - Factura ' + @CodigoFactura +
            ' por Q' + CAST(@MontoPagado AS NVARCHAR(30)) +
            ISNULL(' | Ref: ' + @Referencia, ''),
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

        -- Retornar confirmación de éxito
        SELECT
            1 AS Exito,
            'Pago registrado correctamente.' AS Mensaje,
            @EstadoFactura AS EstadoFactura,
            @MontoPagado AS MontoPagado,
            @TotalFactura AS TotalFactura;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerMediosPago
AS
BEGIN
    SET NOCOUNT ON;

    -- Retorna los medios de pago registrados en la tabla dbo.MetodoPago
    SELECT
        [id] AS IdMedioPago,
        [id] AS id,
        [Nombre]
    FROM [dbo].[MetodoPago]
    ORDER BY [id];
END;
GO
