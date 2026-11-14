```sql
-- ============================================================================
-- Script-UDP1.sql: Generación de Factura y Venta (dbo.sp_GenerarFactura)
-- ============================================================================
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

        COMMIT TRANSACTION;

        SELECT
            @IdFactura AS IdFacturaGenerada,
            @CodigoFactura AS CodigoFactura,
            @IdVenta AS IdVentaGenerada,
            @MontoTotal AS MontoTotal;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO
```

```sql
-- ============================================================================
-- Script-UDP2.sql: Registro de Pagos y Consulta de Medios de Pago
-- ============================================================================
USE ProyectoFinal;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RegistrarPago
    @IdFactura BIGINT,
    @IdMedioPago BIGINT,
    @MontoPagado DECIMAL(18, 2),
    @Referencia VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdVenta BIGINT;
        DECLARE @CodigoFactura NVARCHAR(255);
        DECLARE @IdEmpleado BIGINT;
        DECLARE @TotalFactura DECIMAL(18, 2);

        -- 1. Validar que la factura exista en dbo.Facturas
        SELECT
            @IdVenta = [idVenta],
            @CodigoFactura = [Codigo]
        FROM [dbo].[Facturas]
        WHERE [id] = @IdFactura;

        IF @IdVenta IS NULL
        BEGIN
            RAISERROR('La factura especificada no existe.', 16, 1);
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

        -- 5. Registrar el pago en dbo.Logs
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

    SELECT
        [id] AS IdMedioPago,
        [id] AS id,
        [Nombre]
    FROM [dbo].[MetodoPago]
    ORDER BY [id];
END;
GO
```

```sql
-- ============================================================================
-- Script-UDP3.sql: Órdenes de Compra a Proveedores e Ingreso a Bodega
-- ============================================================================
USE ProyectoFinal;
GO

IF TYPE_ID(N'dbo.DetalleCompraUDT') IS NULL
BEGIN
    CREATE TYPE dbo.DetalleCompraUDT AS TABLE (
        IdProducto INT,
        Cantidad INT,
        PrecioCosto DECIMAL(18, 2)
    );
END;
GO

IF TYPE_ID(N'dbo.DetalleIngresoUDT') IS NULL
BEGIN
    CREATE TYPE dbo.DetalleIngresoUDT AS TABLE (
        IdProducto INT,
        CantidadIngresada INT
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_RealizarOrdenCompra
    @IdProveedor BIGINT,
    @IdEmpleado BIGINT = NULL,
    @Detalles dbo.DetalleCompraUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdOrdenCompra BIGINT;
        DECLARE @MontoTotal FLOAT = 0;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Proveedores] WHERE [id] = @IdProveedor)
        BEGIN
            RAISERROR('El proveedor especificado no existe.', 16, 1);
        END;

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

        IF NOT EXISTS (SELECT 1 FROM @Detalles)
        BEGIN
            RAISERROR('Debe incluir al menos un producto en la orden de compra.', 16, 1);
        END;

        IF EXISTS (
            SELECT 1
            FROM @Detalles d
            WHERE NOT EXISTS (
                SELECT 1
                FROM [dbo].[Productos] p
                WHERE p.[id] = d.[IdProducto]
            )
        )
        BEGIN
            RAISERROR('Uno o más productos especificados en la orden no existen.', 16, 1);
        END;

        SELECT @MontoTotal = ISNULL(SUM(CAST([Cantidad] AS FLOAT) * CAST([PrecioCosto] AS FLOAT)), 0)
        FROM @Detalles;

        SELECT @IdOrdenCompra = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[CompraProveedor];

        INSERT INTO [dbo].[CompraProveedor] (
            [id],
            [idProveedor],
            [idEmpleado],
            [Fecha],
            [MontoTotal]
        )
        VALUES (
            @IdOrdenCompra,
            @IdProveedor,
            @IdEmpleado,
            @Fecha,
            @MontoTotal
        );

        DECLARE @BaseIdCompraItem BIGINT;
        SELECT @BaseIdCompraItem = ISNULL(MAX([id]), 0) FROM [dbo].[CompraProveedorItem];

        INSERT INTO [dbo].[CompraProveedorItem] (
            [id],
            [idCompra],
            [Descripcion],
            [Cantidad],
            [PrecioUnitario],
            [Unidades],
            [Subtotal]
        )
        SELECT
            @BaseIdCompraItem + ROW_NUMBER() OVER (ORDER BY d.[IdProducto]),
            @IdOrdenCompra,
            p.[Nombre],
            d.[Cantidad],
            CAST(d.[PrecioCosto] AS FLOAT),
            0,
            CAST(d.[Cantidad] * d.[PrecioCosto] AS FLOAT)
        FROM @Detalles d
        INNER JOIN [dbo].[Productos] p ON p.[id] = d.[IdProducto];

        COMMIT TRANSACTION;

        SELECT
            @IdOrdenCompra AS IdOrdenCompraGenerada,
            'Orden de compra creada exitosamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_IngresoBodega
    @IdOrdenCompra BIGINT,
    @IdEmpleado BIGINT = NULL,
    @IdSede BIGINT = NULL,
    @DetallesIngreso dbo.DetalleIngresoUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdIngreso BIGINT;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);

        IF NOT EXISTS (SELECT 1 FROM [dbo].[CompraProveedor] WHERE [id] = @IdOrdenCompra)
        BEGIN
            RAISERROR('La orden de compra especificada no existe.', 16, 1);
        END;

        IF NOT EXISTS (SELECT 1 FROM @DetallesIngreso)
        BEGIN
            RAISERROR('Debe especificar al menos un producto para el ingreso a bodega.', 16, 1);
        END;

        IF @IdEmpleado IS NULL
        BEGIN
            SELECT @IdEmpleado = [idEmpleado]
            FROM [dbo].[CompraProveedor]
            WHERE [id] = @IdOrdenCompra;
        END;

        IF @IdSede IS NULL
        BEGIN
            SELECT @IdSede = [idSede]
            FROM [dbo].[Empleados]
            WHERE [id] = @IdEmpleado;
        END;

        IF NOT EXISTS (SELECT 1 FROM [dbo].[Sedes] WHERE [id] = @IdSede)
        BEGIN
            SELECT TOP 1 @IdSede = [id] FROM [dbo].[Sedes] ORDER BY [id];
        END;

        IF EXISTS (
            SELECT 1
            FROM @DetallesIngreso d
            LEFT JOIN [dbo].[Productos] p ON p.[id] = d.[IdProducto]
            LEFT JOIN [dbo].[CompraProveedorItem] cpi
                ON cpi.[idCompra] = @IdOrdenCompra AND cpi.[Descripcion] = p.[Nombre]
            WHERE p.[id] IS NULL OR cpi.[id] IS NULL
        )
        BEGIN
            RAISERROR('Uno o más productos no existen o no pertenecen a la orden de compra indicada.', 16, 1);
        END;

        SELECT @IdIngreso = ISNULL(MAX([id]), 0) + 1 FROM [dbo].[EntregaProveedores];

        INSERT INTO [dbo].[EntregaProveedores] (
            [id],
            [Fecha],
            [idEmpleado],
            [Notas],
            [idCompraProveedor]
        )
        VALUES (
            @IdIngreso,
            @Fecha,
            @IdEmpleado,
            'Ingreso a bodega en proceso',
            @IdOrdenCompra
        );

        DECLARE @BaseIdEntregaItem BIGINT;
        SELECT @BaseIdEntregaItem = ISNULL(MAX([id]), 0) FROM [dbo].[EntregaProveedoresItems];

        INSERT INTO [dbo].[EntregaProveedoresItems] (
            [id],
            [idCompraProveedorItem],
            [idEntrega],
            [Cantidad],
            [Notas]
        )
        SELECT
            @BaseIdEntregaItem + ROW_NUMBER() OVER (ORDER BY d.[IdProducto]),
            cpi.[id],
            @IdIngreso,
            d.[CantidadIngresada],
            'Ingreso a bodega de ' + p.[Nombre]
        FROM @DetallesIngreso d
        INNER JOIN [dbo].[Productos] p ON p.[id] = d.[IdProducto]
        INNER JOIN [dbo].[CompraProveedorItem] cpi
            ON cpi.[idCompra] = @IdOrdenCompra AND cpi.[Descripcion] = p.[Nombre];

        UPDATE s
        SET s.[Cantidad] = s.[Cantidad] + agg.[TotalIngresado],
            s.[FechaActualizacion] = @Fecha
        FROM [dbo].[Stock] s
        INNER JOIN (
            SELECT [IdProducto], SUM([CantidadIngresada]) AS [TotalIngresado]
            FROM @DetallesIngreso
            GROUP BY [IdProducto]
        ) agg ON s.[idProducto] = agg.[IdProducto]
        WHERE s.[idSede] = @IdSede;

        DECLARE @BaseIdStock BIGINT;
        SELECT @BaseIdStock = ISNULL(MAX([id]), 0) FROM [dbo].[Stock];

        INSERT INTO [dbo].[Stock] (
            [id],
            [idSede],
            [idProducto],
            [Cantidad],
            [FechaActualizacion]
        )
        SELECT
            @BaseIdStock + ROW_NUMBER() OVER (ORDER BY agg.[IdProducto]),
            @IdSede,
            agg.[IdProducto],
            agg.[TotalIngresado],
            @Fecha
        FROM (
            SELECT [IdProducto], SUM([CantidadIngresada]) AS [TotalIngresado]
            FROM @DetallesIngreso
            GROUP BY [IdProducto]
        ) agg
        WHERE NOT EXISTS (
            SELECT 1
            FROM [dbo].[Stock] s
            WHERE s.[idSede] = @IdSede AND s.[idProducto] = agg.[IdProducto]
        );

        UPDATE cpi
        SET cpi.[Unidades] = cpi.[Unidades] + d.[CantidadIngresada]
        FROM [dbo].[CompraProveedorItem] cpi
        INNER JOIN [dbo].[Productos] p ON cpi.[Descripcion] = p.[Nombre]
        INNER JOIN @DetallesIngreso d ON p.[id] = d.[IdProducto]
        WHERE cpi.[idCompra] = @IdOrdenCompra;

        DECLARE @TotalSolicitado INT;
        DECLARE @TotalRecibido INT;
        DECLARE @EstadoOrden NVARCHAR(50);

        SELECT
            @TotalSolicitado = ISNULL(SUM([Cantidad]), 0),
            @TotalRecibido = ISNULL(SUM([Unidades]), 0)
        FROM [dbo].[CompraProveedorItem]
        WHERE [idCompra] = @IdOrdenCompra;

        IF @TotalRecibido >= @TotalSolicitado
        BEGIN
            SET @EstadoOrden = 'Completa';
            UPDATE [dbo].[EntregaProveedores]
            SET [Notas] = 'Entrega Completa'
            WHERE [id] = @IdIngreso;
        END
        ELSE IF @TotalRecibido > 0
        BEGIN
            SET @EstadoOrden = 'Parcial';
            UPDATE [dbo].[EntregaProveedores]
            SET [Notas] = 'Entrega Parcial'
            WHERE [id] = @IdIngreso;
        END;

        COMMIT TRANSACTION;

        SELECT
            @IdIngreso AS IdIngresoGenerado,
            @EstadoOrden AS EstadoOrden,
            'Ingreso a bodega procesado correctamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO
```
