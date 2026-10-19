```
CREATE TYPE dbo.DetalleTransaccionUDT AS TABLE (
    IdProducto INT,
    Cantidad INT,
    PrecioUnitario DECIMAL(18, 2)
);
GO

CREATE PROCEDURE dbo.sp_GenerarFactura
    @IdCliente INT,
    @IdMedioPago INT,
    @IdCotizacion INT = NULL, -- Si es nulo, asume facturación directa
    @Detalles dbo.DetalleTransaccionUDT READONLY -- Uso de UDT para los detalles
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Iniciar el bloque transaccional
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdFactura INT;
        DECLARE @Fecha DATETIME = GETDATE();

        -- 1. Insertar el encabezado de la factura
        INSERT INTO Facturas (IdCliente, Fecha, IdMedioPago, IdCotizacion)
        VALUES (@IdCliente, @Fecha, @IdMedioPago, @IdCotizacion);

        SET @IdFactura = SCOPE_IDENTITY();

        -- 2. Lógica para procesar los detalles (Desde Cotización o Desde UDT)
        IF @IdCotizacion IS NOT NULL
        BEGIN
            -- Generación desde cotización confirmada
            INSERT INTO FacturasDetalle (IdFactura, IdProducto, Cantidad, PrecioUnitario, Subtotal)
            SELECT @IdFactura, IdProducto, Cantidad, PrecioUnitario, (Cantidad * PrecioUnitario)
            FROM CotizacionesDetalle
            WHERE IdCotizacion = @IdCotizacion;

            -- Opcional: Actualizar el estado de la cotización
            UPDATE Cotizaciones SET Estado = 'Facturada' WHERE IdCotizacion = @IdCotizacion;
        END
        ELSE
        BEGIN
            -- Venta directa sin cotización ("cotizar" en el momento)
            INSERT INTO FacturasDetalle (IdFactura, IdProducto, Cantidad, PrecioUnitario, Subtotal)
            SELECT @IdFactura, IdProducto, Cantidad, PrecioUnitario, (Cantidad * PrecioUnitario)
            FROM @Detalles;
        END

        -- 3. Actualizar existencias al vender
        UPDATE p
        SET p.Existencia = p.Existencia - d.Cantidad
        FROM Productos p
        INNER JOIN FacturasDetalle d ON p.IdProducto = d.IdProducto
        WHERE d.IdFactura = @IdFactura;

        -- 4. Validación de inventario (previene existencias negativas)
        IF EXISTS (SELECT 1 FROM Productos p 
                   INNER JOIN FacturasDetalle d ON p.IdProducto = d.IdProducto 
                   WHERE d.IdFactura = @IdFactura AND p.Existencia < 0)
        BEGIN
            RAISERROR('Inventario insuficiente para uno o más productos facturados.', 16, 1);
        END

        -- Confirmar la transacción si todo salió bien
        COMMIT TRANSACTION;
        
        -- Retornar el ID de la factura generada para proceder a la impresión
        SELECT @IdFactura AS IdFacturaGenerada;

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
```
```
CREATE PROCEDURE dbo.sp_RegistrarPago
    @IdFactura INT,
    @IdMedioPago INT,
    @MontoPagado DECIMAL(18, 2),
    @Referencia VARCHAR(100) = NULL -- Útil para números de autorización de tarjeta o transferencias
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Insertar el registro del pago
        INSERT INTO Pagos (IdFactura, IdMedioPago, Monto, FechaPago, Referencia)
        VALUES (@IdFactura, @IdMedioPago, @MontoPagado, GETDATE(), @Referencia);

        -- 2. (Opcional) Actualizar el saldo o estado de la factura si manejan pagos parciales
        DECLARE @TotalPagado DECIMAL(18, 2);
        DECLARE @TotalFactura DECIMAL(18, 2);

        -- Calcular total pagado hasta el momento
        SELECT @TotalPagado = SUM(Monto) FROM Pagos WHERE IdFactura = @IdFactura;
        
        -- Obtener total de la factura
        SELECT @TotalFactura = SUM(Subtotal) FROM FacturasDetalle WHERE IdFactura = @IdFactura;

        -- Si el pago cubre o supera el total, marcar la factura como 'Pagada'
        IF @TotalPagado >= @TotalFactura
        BEGIN
            UPDATE Facturas 
            SET Estado = 'Pagada' 
            WHERE IdFactura = @IdFactura;
        END

        COMMIT TRANSACTION;

        -- Retornar confirmación de éxito
        SELECT 1 AS Exito, 'Pago registrado correctamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        THROW;
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_ObtenerMediosPago
AS
BEGIN
    SET NOCOUNT ON;

    -- Retorna los medios de pago que están activos en el sistema
    SELECT 
        IdMedioPago,
        Nombre,
        Descripcion
    FROM MediosPago
    WHERE Estado = 1; -- Asumiendo un campo de estado lógico (1 = Activo)
END;
GO
```
```
-- UDT para crear la Orden de Compra
CREATE TYPE dbo.DetalleCompraUDT AS TABLE (
    IdProducto INT,
    Cantidad INT,
    PrecioCosto DECIMAL(18, 2)
);
GO

-- UDT para registrar el Ingreso a Bodega (puede ser menor a la cantidad comprada)
CREATE TYPE dbo.DetalleIngresoUDT AS TABLE (
    IdProducto INT,
    CantidadIngresada INT
);
GO

-- Compras a proveedores.
CREATE PROCEDURE dbo.sp_RealizarOrdenCompra
    @IdProveedor INT,
    @Detalles dbo.DetalleCompraUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdOrdenCompra INT;

        -- 1. Insertar el encabezado de la orden de compra
        INSERT INTO OrdenesCompra (IdProveedor, FechaEmision, Estado)
        VALUES (@IdProveedor, GETDATE(), 'Pendiente');

        SET @IdOrdenCompra = SCOPE_IDENTITY();

        -- 2. Insertar los detalles solicitados
        -- Se asume un campo "CantidadRecibida" que inicia en 0
        INSERT INTO OrdenesCompraDetalle (IdOrdenCompra, IdProducto, CantidadSolicitada, CantidadRecibida, PrecioCosto)
        SELECT @IdOrdenCompra, IdProducto, Cantidad, 0, PrecioCosto
        FROM @Detalles;

        COMMIT TRANSACTION;

        SELECT @IdOrdenCompra AS IdOrdenCompraGenerada, 'Orden de compra creada exitosamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        THROW;
    END CATCH
END;
GO

-- Procedimiento almacenado para el ingreso a bodega. 
CREATE PROCEDURE dbo.sp_IngresoBodega
    @IdOrdenCompra INT,
    @DetallesIngreso dbo.DetalleIngresoUDT READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @IdIngreso INT;

        -- 1. Registrar el documento de ingreso a bodega
        INSERT INTO IngresosBodega (IdOrdenCompra, FechaIngreso)
        VALUES (@IdOrdenCompra, GETDATE());

        SET @IdIngreso = SCOPE_IDENTITY();

        -- 2. Guardar el detalle del ingreso
        INSERT INTO IngresosBodegaDetalle (IdIngreso, IdProducto, CantidadIngresada)
        SELECT @IdIngreso, IdProducto, CantidadIngresada
        FROM @DetallesIngreso;

        -- 3. Sumar existencias al inventario (Actualizar existencias)
        UPDATE p
        SET p.Existencia = p.Existencia + d.CantidadIngresada
        FROM Productos p
        INNER JOIN @DetallesIngreso d ON p.IdProducto = d.IdProducto;

        -- 4. Actualizar lo que se ha recibido en la Orden de Compra
        UPDATE ocd
        SET ocd.CantidadRecibida = ocd.CantidadRecibida + d.CantidadIngresada
        FROM OrdenesCompraDetalle ocd
        INNER JOIN @DetallesIngreso d ON ocd.IdProducto = d.IdProducto
        WHERE ocd.IdOrdenCompra = @IdOrdenCompra;

        -- 5. Lógica para determinar si el ingreso es "Completo o Parcial"
        DECLARE @TotalSolicitado INT;
        DECLARE @TotalRecibido INT;

        -- Resumen de cuánto se pidió vs cuánto ha entrado en total para esta orden
        SELECT 
            @TotalSolicitado = SUM(CantidadSolicitada),
            @TotalRecibido = SUM(CantidadRecibida)
        FROM OrdenesCompraDetalle
        WHERE IdOrdenCompra = @IdOrdenCompra;

        -- Actualizacion el estado de la Orden de Compra según corresponda
        IF @TotalRecibido >= @TotalSolicitado
        BEGIN
            UPDATE OrdenesCompra SET Estado = 'Completa' WHERE IdOrdenCompra = @IdOrdenCompra;
        END
        ELSE IF @TotalRecibido > 0
        BEGIN
            UPDATE OrdenesCompra SET Estado = 'Parcial' WHERE IdOrdenCompra = @IdOrdenCompra;
        END

        COMMIT TRANSACTION;

        SELECT @IdIngreso AS IdIngresoGenerado, 'Ingreso a bodega procesado correctamente.' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        THROW;
    END CATCH
END;
GO
```