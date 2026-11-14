USE ProyectoFinal;
GO

-- ============================================================================
-- Script-UDP5.sql: Reportería (Ventas, Resumen, Productos, Stock, Compras, Bitácora)
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_ReporteVentas
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @IdSede BIGINT = NULL,
    @IdEmpleado BIGINT = NULL,
    @IncluirAnuladas BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        f.[id] AS IdFactura,
        f.[Codigo] AS CodigoFactura,
        v.[id] AS IdVenta,
        v.[Codigo] AS CodigoVenta,
        CONVERT(VARCHAR(10), v.[Fecha], 23) AS Fecha,
        f.[NIT],
        ISNULL(cl.[Nombres] + ' ' + cl.[Apellidos], 'Consumidor Final') AS ClienteNombre,
        v.[idEmpleado],
        ISNULL(e.[Nombres] + ' ' + e.[Apellidos], 'Empleado') AS EmpleadoNombre,
        v.[idSede],
        ISNULL(s.[Nombre], 'Sede') AS SedeNombre,
        v.[idMetodoPago],
        ISNULL(mp.[Nombre], 'N/A') AS MetodoPagoNombre,
        v.[MontoTotal],
        ISNULL(items.[CantidadItems], 0) AS CantidadItems,
        CASE
            WHEN EXISTS (SELECT 1 FROM [dbo].[Devoluciones] d WHERE d.[idFactura] = f.[id])
                THEN 'Anulada'
            WHEN EXISTS (
                SELECT 1 FROM [dbo].[Logs] l
                WHERE l.[Descripcion] LIKE '%Factura ' + f.[Codigo] + '%'
                  AND l.[Descripcion] LIKE '%(Pago Parcial)%'
            ) THEN 'Pago Parcial'
            ELSE 'Pagada'
        END AS Estado
    FROM [dbo].[Facturas] f
    INNER JOIN [dbo].[Ventas] v ON v.[id] = f.[idVenta]
    LEFT JOIN [dbo].[Empleados] e ON e.[id] = v.[idEmpleado]
    LEFT JOIN [dbo].[Sedes] s ON s.[id] = v.[idSede]
    LEFT JOIN [dbo].[MetodoPago] mp ON mp.[id] = v.[idMetodoPago]
    OUTER APPLY (
        SELECT TOP 1 c.[Nombres], c.[Apellidos]
        FROM [dbo].[Clientes] c
        WHERE c.[NIT] = f.[NIT]
        ORDER BY c.[id]
    ) cl
    OUTER APPLY (
        SELECT ISNULL(SUM(vi.[Cantidad]), 0) AS CantidadItems
        FROM [dbo].[VentasItem] vi
        WHERE vi.[idVenta] = v.[id]
    ) items
    WHERE (@FechaInicio IS NULL OR v.[Fecha] >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.[Fecha] <= @FechaFin)
      AND (@IdSede IS NULL OR v.[idSede] = @IdSede)
      AND (@IdEmpleado IS NULL OR v.[idEmpleado] = @IdEmpleado)
      AND (
          @IncluirAnuladas = 1
          OR NOT EXISTS (SELECT 1 FROM [dbo].[Devoluciones] d WHERE d.[idFactura] = f.[id])
      )
    ORDER BY v.[Fecha] DESC, f.[id] DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReporteResumenVentas
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @IdSede BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS TotalFacturas,
        ISNULL(SUM(CASE WHEN d.[id] IS NULL THEN 1 ELSE 0 END), 0) AS FacturasActivas,
        ISNULL(SUM(CASE WHEN d.[id] IS NOT NULL THEN 1 ELSE 0 END), 0) AS FacturasAnuladas,
        ISNULL(SUM(CASE WHEN d.[id] IS NULL THEN v.[MontoTotal] ELSE 0 END), 0) AS TotalVendido,
        ISNULL(SUM(CASE WHEN d.[id] IS NOT NULL THEN v.[MontoTotal] ELSE 0 END), 0) AS TotalAnulado,
        ISNULL(AVG(CASE WHEN d.[id] IS NULL THEN v.[MontoTotal] ELSE NULL END), 0) AS TicketPromedio
    FROM [dbo].[Facturas] f
    INNER JOIN [dbo].[Ventas] v ON v.[id] = f.[idVenta]
    LEFT JOIN [dbo].[Devoluciones] d ON d.[idFactura] = f.[id]
    WHERE (@FechaInicio IS NULL OR v.[Fecha] >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.[Fecha] <= @FechaFin)
      AND (@IdSede IS NULL OR v.[idSede] = @IdSede);
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReporteProductosMasVendidos
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @IdSede BIGINT = NULL,
    @Top INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Top IS NULL OR @Top <= 0
        SET @Top = 10;

    SELECT TOP (@Top)
        p.[id] AS IdProducto,
        p.[Nombre] AS ProductoNombre,
        ISNULL(m.[Nombre], '') AS MarcaNombre,
        ISNULL(cat.[Nombre], '') AS CategoriaNombre,
        ISNULL(pres.[NombreTipo], '') AS PresentacionNombre,
        SUM(vi.[Cantidad]) AS CantidadVendida,
        SUM(vi.[Subtotal]) AS TotalIngresos
    FROM [dbo].[VentasItem] vi
    INNER JOIN [dbo].[Ventas] v ON v.[id] = vi.[idVenta]
    INNER JOIN [dbo].[Facturas] f ON f.[idVenta] = v.[id]
    INNER JOIN [dbo].[Stock] s ON s.[id] = vi.[idStock]
    INNER JOIN [dbo].[Productos] p ON p.[id] = s.[idProducto]
    LEFT JOIN [dbo].[Marcas] m ON m.[id] = p.[idMarcas]
    LEFT JOIN [dbo].[CategoriaPresentacion] cp ON cp.[id] = p.[idCategoriaPresentacion]
    LEFT JOIN [dbo].[Categoria] cat ON cat.[id] = cp.[idCategoria]
    LEFT JOIN [dbo].[Presentacion] pres ON pres.[id] = cp.[idPresentacion]
    WHERE NOT EXISTS (SELECT 1 FROM [dbo].[Devoluciones] d WHERE d.[idFactura] = f.[id])
      AND (@FechaInicio IS NULL OR v.[Fecha] >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.[Fecha] <= @FechaFin)
      AND (@IdSede IS NULL OR v.[idSede] = @IdSede)
    GROUP BY
        p.[id],
        p.[Nombre],
        m.[Nombre],
        cat.[Nombre],
        pres.[NombreTipo]
    ORDER BY CantidadVendida DESC, TotalIngresos DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReporteInventarioStock
    @IdSede BIGINT = NULL,
    @StockMinimo INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.[id] AS IdStock,
        s.[idSede],
        se.[Nombre] AS SedeNombre,
        s.[idProducto],
        p.[Nombre] AS ProductoNombre,
        ISNULL(m.[Nombre], '') AS MarcaNombre,
        ISNULL(cat.[Nombre], '') AS CategoriaNombre,
        ISNULL(pres.[NombreTipo], '') AS PresentacionNombre,
        ISNULL(prov.[Nombre], '') AS ProveedorNombre,
        s.[Cantidad],
        p.[Precio],
        CAST(s.[Cantidad] AS FLOAT) * p.[Precio] AS ValorInventario,
        CONVERT(VARCHAR(10), s.[FechaActualizacion], 23) AS FechaActualizacion
    FROM [dbo].[Stock] s
    INNER JOIN [dbo].[Sedes] se ON se.[id] = s.[idSede]
    INNER JOIN [dbo].[Productos] p ON p.[id] = s.[idProducto]
    LEFT JOIN [dbo].[Marcas] m ON m.[id] = p.[idMarcas]
    LEFT JOIN [dbo].[CategoriaPresentacion] cp ON cp.[id] = p.[idCategoriaPresentacion]
    LEFT JOIN [dbo].[Categoria] cat ON cat.[id] = cp.[idCategoria]
    LEFT JOIN [dbo].[Presentacion] pres ON pres.[id] = cp.[idPresentacion]
    LEFT JOIN [dbo].[Proveedores] prov ON prov.[id] = p.[idProveedor]
    WHERE (@IdSede IS NULL OR s.[idSede] = @IdSede)
      AND (@StockMinimo IS NULL OR s.[Cantidad] <= @StockMinimo)
    ORDER BY s.[Cantidad] ASC, p.[Nombre] ASC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReporteComprasProveedores
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @IdProveedor BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cp.[id] AS IdOrdenCompra,
        CONVERT(VARCHAR(10), cp.[Fecha], 23) AS Fecha,
        cp.[idProveedor],
        prov.[Nombre] AS ProveedorNombre,
        cp.[idEmpleado],
        ISNULL(e.[Nombres] + ' ' + e.[Apellidos], 'Empleado') AS EmpleadoNombre,
        cp.[MontoTotal],
        ISNULL(sol.[TotalSolicitado], 0) AS TotalSolicitado,
        ISNULL(rec.[TotalRecibido], 0) AS TotalRecibido,
        CASE
            WHEN ISNULL(rec.[TotalRecibido], 0) <= 0 THEN 'Pendiente'
            WHEN ISNULL(rec.[TotalRecibido], 0) >= ISNULL(sol.[TotalSolicitado], 0) THEN 'Completa'
            ELSE 'Parcial'
        END AS EstadoRecepcion
    FROM [dbo].[CompraProveedor] cp
    INNER JOIN [dbo].[Proveedores] prov ON prov.[id] = cp.[idProveedor]
    LEFT JOIN [dbo].[Empleados] e ON e.[id] = cp.[idEmpleado]
    OUTER APPLY (
        SELECT ISNULL(SUM(cpi.[Cantidad]), 0) AS TotalSolicitado
        FROM [dbo].[CompraProveedorItem] cpi
        WHERE cpi.[idCompra] = cp.[id]
    ) sol
    OUTER APPLY (
        SELECT ISNULL(SUM(epi.[Cantidad]), 0) AS TotalRecibido
        FROM [dbo].[EntregaProveedores] ep
        INNER JOIN [dbo].[EntregaProveedoresItems] epi ON epi.[idEntrega] = ep.[id]
        WHERE ep.[idCompraProveedor] = cp.[id]
    ) rec
    WHERE (@FechaInicio IS NULL OR cp.[Fecha] >= @FechaInicio)
      AND (@FechaFin IS NULL OR cp.[Fecha] <= @FechaFin)
      AND (@IdProveedor IS NULL OR cp.[idProveedor] = @IdProveedor)
    ORDER BY cp.[Fecha] DESC, cp.[id] DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ReporteBitacora
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @IdEmpleado BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.[id],
        l.[Descripcion],
        CONVERT(VARCHAR(19), l.[FechaHora], 120) AS FechaHora,
        l.[idEmpleado],
        ISNULL(e.[Nombres] + ' ' + e.[Apellidos], 'Empleado') AS EmpleadoNombre,
        ISNULL(r.[Nombre], '') AS RolNombre
    FROM [dbo].[Logs] l
    LEFT JOIN [dbo].[Empleados] e ON e.[id] = l.[idEmpleado]
    LEFT JOIN [dbo].[Roles] r ON r.[id] = e.[idRol]
    WHERE (@FechaInicio IS NULL OR CAST(l.[FechaHora] AS DATE) >= @FechaInicio)
      AND (@FechaFin IS NULL OR CAST(l.[FechaHora] AS DATE) <= @FechaFin)
      AND (@IdEmpleado IS NULL OR l.[idEmpleado] = @IdEmpleado)
    ORDER BY l.[FechaHora] DESC, l.[id] DESC;
END;
GO
