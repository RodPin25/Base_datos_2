USE ProyectoFinal;
GO

IF TYPE_ID(N'dbo.DetalleTransaccionUDT') IS NULL
BEGIN
    CREATE TYPE dbo.DetalleTransaccionUDT AS TABLE (
        IdProducto INT,
        Cantidad INT,
        PrecioUnitario DECIMAL(18, 2)
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GenerarFactura
    @IdCliente BIGINT,
    @IdMedioPago BIGINT,
    @IdCotizacion BIGINT = NULL, -- Si es nulo, asume facturación directa
    @IdEmpleado BIGINT = NULL,   -- Opcional: si no se envía, toma el primer empleado activo
    @IdSede BIGINT = NULL,       -- Opcional: si no se envía, toma la sede del empleado
    @Detalles dbo.DetalleTransaccionUDT READONLY -- Uso de UDT para los detalles
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdVenta BIGINT;
        DECLARE @IdFactura BIGINT;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);
        DECLARE @NIT NVARCHAR(255);
        DECLARE @MontoTotal FLOAT = 0;

        -- 1. Validar Cliente y obtener NIT (tabla: dbo.Clientes)
        IF @IdCliente IS NULL AND @IdCotizacion IS NOT NULL
        BEGIN
            SELECT TOP 1 @IdCliente = idCliente
            FROM [dbo].[CotizacionItem]
            WHERE idCotizacion = @IdCotizacion;
        END;

        SELECT @NIT = [NIT]
        FROM [dbo].[Clientes]
        WHERE [id] = @IdCliente;

        IF @NIT IS NULL
        BEGIN
            RAISERROR('El cliente especificado no existe.', 16, 1);
        END;

        -- 2. Validar Método de Pago (tabla: dbo.MetodoPago)
        IF NOT EXISTS (SELECT 1 FROM [dbo].[MetodoPago] WHERE [id] = @IdMedioPago)
        BEGIN
            RAISERROR('El método de pago especificado no existe.', 16, 1);
        END;

        -- 3. Resolver y validar Empleado y Sede (tablas: dbo.Empleados, dbo.Sedes)
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

        IF @IdSede IS NULL
        BEGIN
            SELECT @IdSede = [idSede]
            FROM [dbo].[Empleados]
            WHERE [id] = @IdEmpleado;
        END;

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Sedes] WHERE [id] = @IdSede)
        BEGIN
            RAISERROR('La sede especificada no existe.', 16, 1);
        END;

        -- 4. Validar origen de los detalles y calcular MontoTotal
        IF @IdCotizacion IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Cotizacion] WHERE [id] = @IdCotizacion)
            BEGIN
                RAISERROR('La cotización especificada no existe.', 16, 1);
            END;

            IF NOT EXISTS (SELECT 1 FROM [dbo].[CotizacionItem] WHERE [idCotizacion] = @IdCotizacion)
            BEGIN
                RAISERROR('La cotización especificada no tiene ítems asociados.', 16, 1);
            END;

            SELECT @MontoTotal = ISNULL(SUM(CAST([Cantidad] AS FLOAT) * CAST([PrecioUnitario] AS FLOAT)), 0)
            FROM [dbo].[CotizacionItem]
            WHERE [idCotizacion] = @IdCotizacion;
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM @Detalles)
            BEGIN
                RAISERROR('Debe proporcionar al menos un producto en el detalle para facturación directa.', 16, 1);
            END;

            -- Verificar que todos los productos del detalle existan en Stock
            IF EXISTS (
                SELECT 1
                FROM @Detalles d
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM [dbo].[Stock] s
                    WHERE s.[idProducto] = d.[IdProducto]
                )
            )
            BEGIN
                RAISERROR('Uno o más productos no tienen registro en la tabla Stock.', 16, 1);
            END;

            SELECT @MontoTotal = ISNULL(SUM(CAST([Cantidad] AS FLOAT) * CAST([PrecioUnitario] AS FLOAT)), 0)
            FROM @Detalles;
        END;

        -- 5. Insertar encabezado de la Venta (tabla: dbo.Ventas)
        SELECT @IdVenta = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Ventas];
        DECLARE @CodigoVenta NVARCHAR(255) = 'VTA-' + RIGHT('000000' + CAST(@IdVenta AS NVARCHAR(20)), 6);

        INSERT INTO [dbo].[Ventas] (
            [id],
            [Codigo],
            [Fecha],
            [idEmpleado],
            [idMetodoPago],
            [idSede],
            [idCotizacion],
            [MontoTotal]
        )
        VALUES (
            @IdVenta,
            @CodigoVenta,
            @Fecha,
            @IdEmpleado,
            @IdMedioPago,
            @IdSede,
            @IdCotizacion,
            @MontoTotal
        );

        -- 6. Insertar encabezado de la Factura (tabla: dbo.Facturas)
        SELECT @IdFactura = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[Facturas];
        DECLARE @CodigoFactura NVARCHAR(255) = 'FAC-' + RIGHT('000000' + CAST(@IdFactura AS NVARCHAR(20)), 6);

        INSERT INTO [dbo].[Facturas] (
            [id],
            [Codigo],
            [idVenta],
            [NIT]
        )
        VALUES (
            @IdFactura,
            @CodigoFactura,
            @IdVenta,
            @NIT
        );

        -- 7. Insertar los ítems de la venta (tabla: dbo.VentasItem)
        DECLARE @BaseIdVentaItem BIGINT;
        SELECT @BaseIdVentaItem = ISNULL(MAX([id]), 0) FROM [dbo].[VentasItem];

        IF @IdCotizacion IS NOT NULL
        BEGIN
            -- Generación desde cotización confirmada (tabla: dbo.CotizacionItem)
            INSERT INTO [dbo].[VentasItem] (
                [id],
                [idVenta],
                [idStock],
                [Cantidad],
                [PrecioAplicado],
                [Subtotal]
            )
            SELECT
                @BaseIdVentaItem + ROW_NUMBER() OVER (ORDER BY ci.[id]),
                @IdVenta,
                ci.[idStock],
                ci.[Cantidad],
                ci.[PrecioUnitario],
                (CAST(ci.[Cantidad] AS FLOAT) * CAST(ci.[PrecioUnitario] AS FLOAT))
            FROM [dbo].[CotizacionItem] ci
            WHERE ci.[idCotizacion] = @IdCotizacion;
        END
        ELSE
        BEGIN
            -- Venta directa sin cotización usando @Detalles y vinculando con dbo.Stock
            INSERT INTO [dbo].[VentasItem] (
                [id],
                [idVenta],
                [idStock],
                [Cantidad],
                [PrecioAplicado],
                [Subtotal]
            )
            SELECT
                @BaseIdVentaItem + ROW_NUMBER() OVER (ORDER BY d.[IdProducto]),
                @IdVenta,
                st.[idStock],
                d.[Cantidad],
                CAST(d.[PrecioUnitario] AS FLOAT),
                CAST(d.[Cantidad] * d.[PrecioUnitario] AS FLOAT)
            FROM @Detalles d
            CROSS APPLY (
                SELECT TOP 1 s.[id] AS [idStock]
                FROM [dbo].[Stock] s
                WHERE s.[idProducto] = d.[IdProducto]
                ORDER BY CASE WHEN s.[idSede] = @IdSede THEN 0 ELSE 1 END, s.[id]
            ) st;
        END;

        -- 8. Actualizar existencias en dbo.Stock al vender
        UPDATE s
        SET s.[Cantidad] = s.[Cantidad] - agg.[TotalCantidad],
            s.[FechaActualizacion] = @Fecha
        FROM [dbo].[Stock] s
        INNER JOIN (
            SELECT [idStock], SUM([Cantidad]) AS [TotalCantidad]
            FROM [dbo].[VentasItem]
            WHERE [idVenta] = @IdVenta
            GROUP BY [idStock]
        ) agg ON s.[id] = agg.[idStock];

        -- 9. Validación de inventario en dbo.Stock (previene existencias negativas)
        IF EXISTS (
            SELECT 1
            FROM [dbo].[Stock] s
            INNER JOIN [dbo].[VentasItem] vi ON s.[id] = vi.[idStock]
            WHERE vi.[idVenta] = @IdVenta AND s.[Cantidad] < 0
        )
        BEGIN
            RAISERROR('Inventario insuficiente para uno o más productos facturados.', 16, 1);
        END;

        -- Confirmar la transacción si todo salió bien
        COMMIT TRANSACTION;

        -- Retornar el ID de la factura generada y datos asociados
        SELECT
            @IdFactura AS IdFacturaGenerada,
            @CodigoFactura AS CodigoFactura,
            @IdVenta AS IdVentaGenerada,
            @MontoTotal AS MontoTotal;

    END TRY
    BEGIN CATCH
        -- Revertir todos los cambios si ocurre algún error
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Propagar el error a la aplicación
        THROW;
    END CATCH
END;
GO

-- ============================================================================
-- SPs de soporte para consulta y creación de Cotizaciones y consulta/descarga de Facturas
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerCotizaciones
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.id,
        c.Codigo,
        CONVERT(VARCHAR(10), c.Fecha, 23) AS Fecha,
        CONVERT(VARCHAR(10), c.FechaLimite, 23) AS FechaLimite,
        c.MontoTotal,
        ci_info.idCliente,
        ISNULL(cl.Nombres + ' ' + cl.Apellidos, 'Sin cliente') AS ClienteNombre,
        ISNULL(cl.NIT, 'CF') AS NIT,
        v_info.idFactura AS IdFacturaAsociada,
        v_info.CodigoFactura AS CodigoFacturaAsociada,
        CASE
            WHEN v_info.idFactura IS NOT NULL THEN 'Aprobada'
            WHEN c.FechaLimite < CAST(GETDATE() AS DATE) THEN 'Vencida'
            ELSE 'Enviada'
        END AS Estado
    FROM dbo.Cotizacion c
    OUTER APPLY (
        SELECT TOP 1 ci.idCliente
        FROM dbo.CotizacionItem ci
        WHERE ci.idCotizacion = c.id
    ) ci_info
    LEFT JOIN dbo.Clientes cl ON cl.id = ci_info.idCliente
    OUTER APPLY (
        SELECT TOP 1 f.id AS idFactura, f.Codigo AS CodigoFactura
        FROM dbo.Ventas v
        INNER JOIN dbo.Facturas f ON f.idVenta = v.id
        WHERE v.idCotizacion = c.id
        ORDER BY f.id DESC
    ) v_info
    WHERE (@id IS NULL OR c.id = @id)
    ORDER BY c.id DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerDetalleCotizacion
    @IdCotizacion BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ci.id,
        ci.idCotizacion,
        ci.idCliente,
        ci.idStock,
        s.idProducto,
        p.Nombre AS ProductoNombre,
        p.Caracteristicas,
        ci.Cantidad,
        ci.PrecioUnitario,
        ci.Subtotal
    FROM dbo.CotizacionItem ci
    INNER JOIN dbo.Stock s ON s.id = ci.idStock
    INNER JOIN dbo.Productos p ON p.id = s.idProducto
    WHERE ci.idCotizacion = @IdCotizacion
    ORDER BY ci.id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CrearCotizacion
    @IdCliente BIGINT,
    @DiasValidez INT = 15,
    @IdSede BIGINT = NULL,
    @Detalles dbo.DetalleTransaccionUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Clientes WHERE id = @IdCliente)
        BEGIN
            RAISERROR('El cliente especificado no existe.', 16, 1);
        END;

        IF NOT EXISTS (SELECT 1 FROM @Detalles)
        BEGIN
            RAISERROR('Debe agregar al menos un producto a la cotización.', 16, 1);
        END;

        IF @IdSede IS NULL
        BEGIN
            SELECT TOP 1 @IdSede = id FROM dbo.Sedes ORDER BY id;
        END;

        IF EXISTS (
            SELECT 1
            FROM @Detalles d
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.Stock s WHERE s.idProducto = d.IdProducto
            )
        )
        BEGIN
            RAISERROR('Uno o más productos no tienen registro en la tabla Stock.', 16, 1);
        END;

        DECLARE @IdCotizacion BIGINT;
        SELECT @IdCotizacion = ISNULL(MAX(id), 0) + 1 FROM dbo.Cotizacion;
        DECLARE @CodigoCotizacion NVARCHAR(255) = 'COT-' + RIGHT('000000' + CAST(@IdCotizacion AS NVARCHAR(20)), 6);
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);
        DECLARE @FechaLimite DATE = DATEADD(DAY, ISNULL(@DiasValidez, 15), @Fecha);
        DECLARE @MontoTotal FLOAT = 0;

        SELECT @MontoTotal = ISNULL(SUM(CAST(Cantidad AS FLOAT) * CAST(PrecioUnitario AS FLOAT)), 0)
        FROM @Detalles;

        INSERT INTO dbo.Cotizacion (id, Codigo, Fecha, FechaLimite, MontoTotal)
        VALUES (@IdCotizacion, @CodigoCotizacion, @Fecha, @FechaLimite, @MontoTotal);

        DECLARE @BaseIdCotItem BIGINT;
        SELECT @BaseIdCotItem = ISNULL(MAX(id), 0) FROM dbo.CotizacionItem;

        INSERT INTO dbo.CotizacionItem (
            id, idCliente, idCotizacion, idStock, Cantidad, PrecioUnitario, Subtotal
        )
        SELECT
            @BaseIdCotItem + ROW_NUMBER() OVER (ORDER BY d.IdProducto),
            @IdCliente,
            @IdCotizacion,
            st.idStock,
            d.Cantidad,
            CAST(d.PrecioUnitario AS FLOAT),
            CAST(d.Cantidad * d.PrecioUnitario AS FLOAT)
        FROM @Detalles d
        CROSS APPLY (
            SELECT TOP 1 s.id AS idStock
            FROM dbo.Stock s
            WHERE s.idProducto = d.IdProducto
            ORDER BY CASE WHEN s.idSede = @IdSede THEN 0 ELSE 1 END, s.id
        ) st;

        COMMIT TRANSACTION;

        SELECT
            1 AS Exito,
            'Cotización creada exitosamente.' AS Mensaje,
            @IdCotizacion AS IdCotizacionGenerada,
            @CodigoCotizacion AS CodigoCotizacion,
            @MontoTotal AS MontoTotal;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerFacturas
    @id BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        f.id,
        f.Codigo,
        f.idVenta,
        f.NIT,
        v.Codigo AS CodigoVenta,
        CONVERT(VARCHAR(10), v.Fecha, 23) AS Fecha,
        v.MontoTotal,
        v.idCotizacion,
        cot.Codigo AS CodigoCotizacion,
        v.idMetodoPago,
        ISNULL(mp.Nombre, 'N/A') AS MetodoPagoNombre,
        v.idEmpleado,
        ISNULL(e.Nombres + ' ' + e.Apellidos, 'Empleado') AS EmpleadoNombre,
        v.idSede,
        ISNULL(s.Nombre, 'Sede Central') AS SedeNombre,
        ISNULL(s.Direccion, '') AS SedeDireccion,
        ISNULL(s.Contacto, '') AS SedeContacto,
        cl.id AS idCliente,
        ISNULL(cl.Nombres + ' ' + cl.Apellidos, 'Consumidor Final') AS ClienteNombre,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM dbo.Devoluciones d
                WHERE d.idFactura = f.id
            ) THEN 'Anulada'
            WHEN EXISTS (
                SELECT 1 FROM dbo.Logs l
                WHERE l.Descripcion LIKE '%Factura ' + f.Codigo + '%'
                  AND l.Descripcion LIKE '%(Pagada)%'
            ) THEN 'Pagada'
            WHEN EXISTS (
                SELECT 1 FROM dbo.Logs l
                WHERE l.Descripcion LIKE '%Factura ' + f.Codigo + '%'
                  AND l.Descripcion LIKE '%(Pago Parcial)%'
            ) THEN 'Pago Parcial'
            ELSE 'Pagada'
        END AS Estado
    FROM dbo.Facturas f
    INNER JOIN dbo.Ventas v ON v.id = f.idVenta
    LEFT JOIN dbo.Cotizacion cot ON cot.id = v.idCotizacion
    LEFT JOIN dbo.MetodoPago mp ON mp.id = v.idMetodoPago
    LEFT JOIN dbo.Empleados e ON e.id = v.idEmpleado
    LEFT JOIN dbo.Sedes s ON s.id = v.idSede
    OUTER APPLY (
        SELECT TOP 1 c.id, c.Nombres, c.Apellidos
        FROM dbo.Clientes c
        WHERE c.NIT = f.NIT
        ORDER BY c.id
    ) cl
    WHERE (@id IS NULL OR f.id = @id)
    ORDER BY f.id DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ObtenerDetalleFactura
    @IdFactura BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        vi.id,
        vi.idVenta,
        vi.idStock,
        s.idProducto,
        p.Nombre AS ProductoNombre,
        p.Caracteristicas,
        vi.Cantidad,
        vi.PrecioAplicado AS PrecioUnitario,
        vi.Subtotal
    FROM dbo.Facturas f
    INNER JOIN dbo.VentasItem vi ON vi.idVenta = f.idVenta
    INNER JOIN dbo.Stock s ON s.id = vi.idStock
    INNER JOIN dbo.Productos p ON p.id = s.idProducto
    WHERE f.id = @IdFactura
    ORDER BY vi.id;
END;
GO
