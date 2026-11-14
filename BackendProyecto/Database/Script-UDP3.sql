USE ProyectoFinal;
GO

-- UDT para crear la Orden de Compra
IF TYPE_ID(N'dbo.DetalleCompraUDT') IS NULL
BEGIN
    CREATE TYPE dbo.DetalleCompraUDT AS TABLE (
        IdProducto INT,
        Cantidad INT,
        PrecioCosto DECIMAL(18, 2)
    );
END;
GO

-- UDT para registrar el Ingreso a Bodega (puede ser menor a la cantidad comprada)
IF TYPE_ID(N'dbo.DetalleIngresoUDT') IS NULL
BEGIN
    CREATE TYPE dbo.DetalleIngresoUDT AS TABLE (
        IdProducto INT,
        CantidadIngresada INT
    );
END;
GO

-- Compras a proveedores (tablas: dbo.CompraProveedor y dbo.CompraProveedorItem)
CREATE OR ALTER PROCEDURE dbo.sp_RealizarOrdenCompra
    @IdProveedor BIGINT,
    @IdEmpleado BIGINT = NULL, -- Opcional: si no se envía, toma el primer empleado registrado
    @Detalles dbo.DetalleCompraUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdOrdenCompra BIGINT;
        DECLARE @MontoTotal FLOAT = 0;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);

        -- 1. Validar que el proveedor exista en dbo.Proveedores
        IF NOT EXISTS (SELECT 1 FROM [dbo].[Proveedores] WHERE [id] = @IdProveedor)
        BEGIN
            RAISERROR('El proveedor especificado no existe.', 16, 1);
        END;

        -- 2. Resolver y validar Empleado en dbo.Empleados
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

        -- 3. Validar detalles de la compra y existencia de productos en dbo.Productos
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

        -- 4. Insertar el encabezado de la compra en dbo.CompraProveedor
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

        -- 5. Insertar los detalles solicitados en dbo.CompraProveedorItem
        -- [Cantidad] = cantidad solicitada, [Unidades] inicia en 0 (unidades recibidas en bodega)
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
            0, -- Unidades recibidas inicia en 0
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

-- Procedimiento almacenado para el ingreso a bodega
-- (tablas: dbo.EntregaProveedores, dbo.EntregaProveedoresItems, dbo.CompraProveedorItem, dbo.Stock)
CREATE OR ALTER PROCEDURE dbo.sp_IngresoBodega
    @IdOrdenCompra BIGINT,
    @IdEmpleado BIGINT = NULL, -- Opcional: si no se envía, toma el empleado de la compra
    @IdSede BIGINT = NULL,     -- Opcional: si no se envía, toma la sede del empleado
    @DetallesIngreso dbo.DetalleIngresoUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdIngreso BIGINT;
        DECLARE @Fecha DATE = CAST(GETDATE() AS DATE);

        -- 1. Validar que la orden de compra exista en dbo.CompraProveedor
        IF NOT EXISTS (SELECT 1 FROM [dbo].[CompraProveedor] WHERE [id] = @IdOrdenCompra)
        BEGIN
            RAISERROR('La orden de compra especificada no existe.', 16, 1);
        END;

        IF NOT EXISTS (SELECT 1 FROM @DetallesIngreso)
        BEGIN
            RAISERROR('Debe especificar al menos un producto para el ingreso a bodega.', 16, 1);
        END;

        -- 2. Resolver Empleado y Sede para actualizar Stock
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

        -- Validar que los productos ingresados pertenezcan a la orden de compra
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

        -- 3. Registrar el encabezado de entrega en dbo.EntregaProveedores
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

        -- 4. Guardar el detalle del ingreso en dbo.EntregaProveedoresItems
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

        -- 5. Sumar existencias al inventario en dbo.Stock
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

        -- Si algún producto aún no tenía fila en dbo.Stock para esta sede, insertarla
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

        -- 6. Actualizar las unidades recibidas ([Unidades]) en dbo.CompraProveedorItem
        UPDATE cpi
        SET cpi.[Unidades] = cpi.[Unidades] + d.[CantidadIngresada]
        FROM [dbo].[CompraProveedorItem] cpi
        INNER JOIN [dbo].[Productos] p ON cpi.[Descripcion] = p.[Nombre]
        INNER JOIN @DetallesIngreso d ON p.[id] = d.[IdProducto]
        WHERE cpi.[idCompra] = @IdOrdenCompra;

        -- 7. Determinar si el ingreso de la orden es "Completa" o "Parcial"
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
