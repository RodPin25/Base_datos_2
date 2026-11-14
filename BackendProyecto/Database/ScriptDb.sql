CREATE DATABASE ProyectoFinal;
GO

USE ProyectoFinal;
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA [dbo]');
END;
CREATE TABLE [dbo].[Inventario] (
    [id] bigint NOT NULL,
    [Fecha] date NOT NULL,
    [idSede] bigint NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[CategoriaPresentacion] (
    [id] bigint NOT NULL,
    [idCategoria] bigint NOT NULL,
    [idPresentacion] bigint NOT NULL,
    PRIMARY KEY ([id]),
    CONSTRAINT [UQ_Categoria_Presentacion] UNIQUE ([idCategoria], [idPresentacion])
);


CREATE TABLE [dbo].[Stock] (
    [id] bigint NOT NULL,
    [idSede] bigint NOT NULL,
    [idProducto] bigint NOT NULL,
    [Cantidad] int NOT NULL,
    [FechaActualizacion] date NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[InventarioItem] (
    [id] bigint NOT NULL,
    [idInventario] bigint NOT NULL,
    [idStock] bigint NOT NULL,
    [CantidadExistente] int NOT NULL,
    [Estante] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Sedes] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    [Direccion] nvarchar(255) NOT NULL,
    [Contacto] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Proveedores] (
    [id] bigint NOT NULL,
    [Codigo] nvarchar(255) NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    [Contacto] nvarchar(255) NOT NULL,
    [Direccion] nvarchar(255),
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Productos] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    [Caracteristicas] nvarchar(255) NOT NULL,
    [Precio] float NOT NULL,
    [idMarcas] bigint NOT NULL,
    [idCategoriaPresentacion] bigint NOT NULL,
    [idProveedor] bigint NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Marcas] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Presentacion] (
    [id] bigint NOT NULL,
    [NombreTipo] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Categoria] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[CompraProveedor] (
    [id] bigint NOT NULL,
    [idProveedor] bigint NOT NULL,
    [idEmpleado] bigint NOT NULL,
    [Fecha] date NOT NULL,
    [MontoTotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[CompraProveedorItem] (
    [id] bigint NOT NULL,
    [idCompra] bigint NOT NULL,
    [Descripcion] nvarchar(255) NOT NULL,
    [Cantidad] int NOT NULL,
    [PrecioUnitario] float NOT NULL,
    [Unidades] int NOT NULL,
    [Subtotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[EntregaProveedores] (
    [id] bigint NOT NULL,
    [Fecha] date NOT NULL,
    [idEmpleado] bigint NOT NULL,
    [Notas] nvarchar(255) NOT NULL,
    [idCompraProveedor] bigint NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[EntregaProveedoresItems] (
    [id] bigint NOT NULL,
    [idCompraProveedorItem] bigint NOT NULL,
    [idEntrega] bigint NOT NULL,
    [Cantidad] int NOT NULL,
    [Notas] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Empleados] (
    [id] bigint NOT NULL,
    [Nombres] nvarchar(255) NOT NULL,
    [Apellidos] nvarchar(255) NOT NULL,
    [Correo] nvarchar(255),
    [idSede] bigint NOT NULL,
    [idRol] bigint NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Roles] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Credenciales] (
    [id] bigint NOT NULL,
    [idEmpleado] bigint NOT NULL,
    [Usuario] nvarchar(255) NOT NULL,
    [HashContra] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Cotizacion] (
    [id] bigint NOT NULL,
    [Codigo] nvarchar(255) NOT NULL,
    [Fecha] date NOT NULL,
    [FechaLimite] date NOT NULL,
    [MontoTotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[CotizacionItem] (
    [id] bigint NOT NULL,
    [idCliente] bigint NOT NULL,
    [idCotizacion] bigint NOT NULL,
    [idStock] bigint NOT NULL,
    [Cantidad] int NOT NULL,
    [PrecioUnitario] float NOT NULL,
    [Subtotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Clientes] (
    [id] bigint NOT NULL,
    [Nombres] nvarchar(255) NOT NULL,
    [Apellidos] nvarchar(255) NOT NULL,
    [NIT] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Ventas] (
    [id] bigint NOT NULL,
    [Codigo] nvarchar(255) NOT NULL,
    [Fecha] date NOT NULL,
    [idEmpleado] bigint NOT NULL,
    [idMetodoPago] bigint NOT NULL,
    [idSede] bigint NOT NULL,
    [idCotizacion] bigint,
    [MontoTotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[VentasItem] (
    [id] bigint NOT NULL,
    [idVenta] bigint NOT NULL,
    [idStock] bigint NOT NULL,
    [Cantidad] int NOT NULL,
    [PrecioAplicado] float NOT NULL,
    [Subtotal] float NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Facturas] (
    [id] bigint NOT NULL,
    [Codigo] nvarchar(255) NOT NULL,
    [idVenta] bigint NOT NULL,
    [NIT] nvarchar(255) NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[MetodoPago] (
    [id] bigint NOT NULL,
    [Nombre] nvarchar(255),
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Devoluciones] (
    [id] bigint NOT NULL,
    [idFactura] bigint NOT NULL,
    [Fecha] date NOT NULL,
    [idEmpleado] bigint NOT NULL,
    [idSede] bigint NOT NULL,
    PRIMARY KEY ([id])
);


CREATE TABLE [dbo].[Logs] (
    [id] bigint NOT NULL,
    [Descripcion] nvarchar(255) NOT NULL,
    [FechaHora] datetime NOT NULL,
    [idEmpleado] bigint NOT NULL,
    PRIMARY KEY ([id])
);


-- Foreign key constraints
-- Schema: dbo
ALTER TABLE [dbo].[CategoriaPresentacion] ADD CONSTRAINT [Categoria_id_fk] FOREIGN KEY([idCategoria]) REFERENCES [dbo].[Categoria]([id]);
ALTER TABLE [dbo].[Productos] ADD CONSTRAINT [CategoriaPresentacion_id_fk] FOREIGN KEY([idCategoriaPresentacion]) REFERENCES [dbo].[CategoriaPresentacion]([id]);
ALTER TABLE [dbo].[InventarioItem] ADD CONSTRAINT [Inventario_id_fk] FOREIGN KEY([idInventario]) REFERENCES [dbo].[Inventario]([id]);
ALTER TABLE [dbo].[Productos] ADD CONSTRAINT [Marcas_id_fk] FOREIGN KEY([idMarcas]) REFERENCES [dbo].[Marcas]([id]);
ALTER TABLE [dbo].[CategoriaPresentacion] ADD CONSTRAINT [Presentacion_id_fk] FOREIGN KEY([idPresentacion]) REFERENCES [dbo].[Presentacion]([id]);
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [Productos_id_fk] FOREIGN KEY([idProducto]) REFERENCES [dbo].[Productos]([id]);
ALTER TABLE [dbo].[Productos] ADD CONSTRAINT [Proveedores_id_fk] FOREIGN KEY([idProveedor]) REFERENCES [dbo].[Proveedores]([id]);
ALTER TABLE [dbo].[Stock] ADD CONSTRAINT [Sedes_id_fk] FOREIGN KEY([idSede]) REFERENCES [dbo].[Sedes]([id]);
ALTER TABLE [dbo].[Inventario] ADD CONSTRAINT [Sedes_id_fk2] FOREIGN KEY([idSede]) REFERENCES [dbo].[Sedes]([id]);
ALTER TABLE [dbo].[InventarioItem] ADD CONSTRAINT [Stock_id_fk] FOREIGN KEY([idStock]) REFERENCES [dbo].[Stock]([id]);
ALTER TABLE [dbo].[CompraProveedor] ADD CONSTRAINT [Proveedores_id_fk2] FOREIGN KEY([idProveedor]) REFERENCES [dbo].[Proveedores]([id]);
ALTER TABLE [dbo].[CompraProveedorItem] ADD CONSTRAINT [CompraProveedor_id_fk] FOREIGN KEY([idCompra]) REFERENCES [dbo].[CompraProveedor]([id]);
ALTER TABLE [dbo].[EntregaProveedoresItems] ADD CONSTRAINT [EntregaProveedores_id_fk] FOREIGN KEY([idEntrega]) REFERENCES [dbo].[EntregaProveedores]([id]);
ALTER TABLE [dbo].[EntregaProveedoresItems] ADD CONSTRAINT [CompraProveedorItem_id_fk] FOREIGN KEY([idCompraProveedorItem]) REFERENCES [dbo].[CompraProveedorItem]([id]);
ALTER TABLE [dbo].[Empleados] ADD CONSTRAINT [Roles_id_fk] FOREIGN KEY([idRol]) REFERENCES [dbo].[Roles]([id]);
ALTER TABLE [dbo].[Empleados] ADD CONSTRAINT [Sedes_id_fk3] FOREIGN KEY([idSede]) REFERENCES [dbo].[Sedes]([id]);
ALTER TABLE [dbo].[Credenciales] ADD CONSTRAINT [Empleados_id_fk] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);
ALTER TABLE [dbo].[CompraProveedor] ADD CONSTRAINT [Empleados_id_fk2] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);
ALTER TABLE [dbo].[EntregaProveedores] ADD CONSTRAINT [Empleados_id_fk3] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);
ALTER TABLE [dbo].[CotizacionItem] ADD CONSTRAINT [Cotizacion_id_fk] FOREIGN KEY([idCotizacion]) REFERENCES [dbo].[Cotizacion]([id]);
ALTER TABLE [dbo].[CotizacionItem] ADD CONSTRAINT [Stock_id_fk2] FOREIGN KEY([idStock]) REFERENCES [dbo].[Stock]([id]);
ALTER TABLE [dbo].[CotizacionItem] ADD CONSTRAINT [Clientes_id_fk] FOREIGN KEY([idCliente]) REFERENCES [dbo].[Clientes]([id]);
ALTER TABLE [dbo].[VentasItem] ADD CONSTRAINT [Ventas_id_fk] FOREIGN KEY([idVenta]) REFERENCES [dbo].[Ventas]([id]);
ALTER TABLE [dbo].[VentasItem] ADD CONSTRAINT [Stock_id_fk3] FOREIGN KEY([idStock]) REFERENCES [dbo].[Stock]([id]);
ALTER TABLE [dbo].[Ventas] ADD CONSTRAINT [Cotizacion_id_fk2] FOREIGN KEY([idCotizacion]) REFERENCES [dbo].[Cotizacion]([id]);
ALTER TABLE [dbo].[Facturas] ADD CONSTRAINT [Ventas_id_fk2] FOREIGN KEY([idVenta]) REFERENCES [dbo].[Ventas]([id]);
ALTER TABLE [dbo].[Ventas] ADD CONSTRAINT [Empleados_id_fk4] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);
ALTER TABLE [dbo].[Ventas] ADD CONSTRAINT [Sedes_id_fk4] FOREIGN KEY([idSede]) REFERENCES [dbo].[Sedes]([id]);
ALTER TABLE [dbo].[Ventas] ADD CONSTRAINT [MetodoPago_id_fk] FOREIGN KEY([idMetodoPago]) REFERENCES [dbo].[MetodoPago]([id]);
ALTER TABLE [dbo].[EntregaProveedores] ADD CONSTRAINT [CompraProveedor_id_fk2] FOREIGN KEY([idCompraProveedor]) REFERENCES [dbo].[CompraProveedor]([id]);
ALTER TABLE [dbo].[Devoluciones] ADD CONSTRAINT [Facturas_id_fk] FOREIGN KEY([idFactura]) REFERENCES [dbo].[Facturas]([id]);
ALTER TABLE [dbo].[Devoluciones] ADD CONSTRAINT [Sedes_id_fk5] FOREIGN KEY([idSede]) REFERENCES [dbo].[Sedes]([id]);
ALTER TABLE [dbo].[Devoluciones] ADD CONSTRAINT [Empleados_id_fk5] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);
ALTER TABLE [dbo].[Logs] ADD CONSTRAINT [Empleados_id_fk6] FOREIGN KEY([idEmpleado]) REFERENCES [dbo].[Empleados]([id]);