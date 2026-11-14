-- ============================================================================
-- SEEDER DE DATOS INICIALES - PROYECTO FINAL (COLORA PINTURAS)
-- Pobla las 26 tablas del esquema [ProyectoFinal].[dbo] respetando
-- todas las llaves primarias, foráneas y restricciones únicas.
-- ============================================================================
USE ProyectoFinal;
GO

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- ========================================================================
    -- 0. LIMPIEZA PREVia EN ORDEN INVERSO DE DEPENDENCIAS (IDEMPOTENTE)
    -- ========================================================================
    DELETE FROM [dbo].[Logs];
    DELETE FROM [dbo].[Devoluciones];
    DELETE FROM [dbo].[Facturas];
    DELETE FROM [dbo].[VentasItem];
    DELETE FROM [dbo].[Ventas];
    DELETE FROM [dbo].[CotizacionItem];
    DELETE FROM [dbo].[Cotizacion];
    DELETE FROM [dbo].[Clientes];
    DELETE FROM [dbo].[MetodoPago];
    DELETE FROM [dbo].[EntregaProveedoresItems];
    DELETE FROM [dbo].[EntregaProveedores];
    DELETE FROM [dbo].[CompraProveedorItem];
    DELETE FROM [dbo].[CompraProveedor];
    DELETE FROM [dbo].[InventarioItem];
    DELETE FROM [dbo].[Inventario];
    DELETE FROM [dbo].[Stock];
    DELETE FROM [dbo].[Productos];
    DELETE FROM [dbo].[CategoriaPresentacion];
    DELETE FROM [dbo].[Categoria];
    DELETE FROM [dbo].[Presentacion];
    DELETE FROM [dbo].[Marcas];
    DELETE FROM [dbo].[Proveedores];
    DELETE FROM [dbo].[Credenciales];
    DELETE FROM [dbo].[Empleados];
    DELETE FROM [dbo].[Roles];
    DELETE FROM [dbo].[Sedes];

    -- ========================================================================
    -- 1. SEDES
    -- ========================================================================
    INSERT INTO [dbo].[Sedes] ([id], [Nombre], [Direccion], [Contacto]) VALUES
    (1, N'Sede Central Zona 10', N'Boulevard Los Próceres 18-45, Zona 10, Ciudad de Guatemala', N'2234-5600'),
    (2, N'Sucursal Norte Zona 17', N'Km 6.5 Carretera al Atlántico, Zona 17, Ciudad de Guatemala', N'2256-8910'),
    (3, N'Sucursal Occidente Quetzaltenango', N'Avenida Las Américas 9-50, Zona 3, Quetzaltenango', N'7761-4420');

    -- ========================================================================
    -- 2. ROLES
    -- Rol 1: Administrador | Rol 2: Consulta | Rol 3: Operativo
    -- ========================================================================
    INSERT INTO [dbo].[Roles] ([id], [Nombre]) VALUES
    (1, N'Administrador'),
    (2, N'Consulta'),
    (3, N'Operativo');

    -- ========================================================================
    -- 3. EMPLEADOS
    -- ========================================================================
    INSERT INTO [dbo].[Empleados] ([id], [Nombres], [Apellidos], [Correo], [idSede], [idRol]) VALUES
    (1, N'Carlos Andrés', N'Méndez Soto', N'cmendez@colora.com.gt', 1, 1),
    (2, N'Ana Lucía', N'Gómez Herrera', N'agomez@colora.com.gt', 1, 2),
    (3, N'Luis Fernando', N'Reyes Castillo', N'lreyes@colora.com.gt', 1, 3),
    (4, N'María Fernanda', N'López Morales', N'mlopez@colora.com.gt', 2, 3);

    -- ========================================================================
    -- 4. CREDENCIALES (Hashes Argon2id válidos)
    -- Usuarios y contraseñas en texto plano para pruebas:
    --   Usuario: admin      | Password: Admin123*      (Rol 1 - Administrador)
    --   Usuario: consulta   | Password: Consulta123*   (Rol 2 - Consulta)
    --   Usuario: operativo  | Password: Operativo123*  (Rol 3 - Operativo)
    --   Usuario: bodega     | Password: Bodega123*     (Rol 3 - Operativo Sede 2)
    -- ========================================================================
    INSERT INTO [dbo].[Credenciales] ([id], [idEmpleado], [Usuario], [HashContra]) VALUES
    (1, 1, N'admin', N'$argon2id$v=19$m=65536,t=3,p=4$Dr0/U8kBfqiP1LkPee8aWg$mTLQM3wMKedmPpw9J12D5YgtsAtMiVHcuJW+HRgvxeM'),
    (2, 2, N'consulta', N'$argon2id$v=19$m=65536,t=3,p=4$T+eCpR3sUVohfoSpijFCog$g9aZSJwYDD9B+KdXw3LbErIzH1yLKzwNe/DdLGL3LvI'),
    (3, 3, N'operativo', N'$argon2id$v=19$m=65536,t=3,p=4$d6Y5pWb0jyLWXGST0HqCVQ$um2YmU1iabEADkFg4mv5jFBxZ1IcTDGcqyh/9zxCQfI'),
    (4, 4, N'bodega', N'$argon2id$v=19$m=65536,t=3,p=4$YngviL1JgnREUwuznl1LQg$jktyEF2f2f5oeNCoaDjV7r+uUqAh22p9lbDAd/h5lgA');

    -- ========================================================================
    -- 5. MARCAS
    -- ========================================================================
    INSERT INTO [dbo].[Marcas] ([id], [Nombre]) VALUES
    (1, N'Sherwin-Williams'),
    (2, N'Comex'),
    (3, N'Pinturas Corona'),
    (4, N'Pinturas Sur'),
    (5, N'Truper');

    -- ========================================================================
    -- 6. CATEGORIAS
    -- ========================================================================
    INSERT INTO [dbo].[Categoria] ([id], [Nombre]) VALUES
    (1, N'Pinturas de Interior'),
    (2, N'Pinturas de Exterior'),
    (3, N'Impermeabilizantes'),
    (4, N'Barnices y Selladores'),
    (5, N'Accesorios y Herramientas');

    -- ========================================================================
    -- 7. PRESENTACIONES
    -- ========================================================================
    INSERT INTO [dbo].[Presentacion] ([id], [NombreTipo]) VALUES
    (1, N'Cubeta 5 Galones'),
    (2, N'Galón'),
    (3, N'1/4 Galón'),
    (4, N'Aerosol 400ml'),
    (5, N'Unidad');

    -- ========================================================================
    -- 8. CATEGORIA - PRESENTACION (UNIQUE [idCategoria, idPresentacion])
    -- ========================================================================
    INSERT INTO [dbo].[CategoriaPresentacion] ([id], [idCategoria], [idPresentacion]) VALUES
    (1, 1, 1), -- Pinturas de Interior - Cubeta 5 Galones
    (2, 1, 2), -- Pinturas de Interior - Galón
    (3, 2, 1), -- Pinturas de Exterior - Cubeta 5 Galones
    (4, 2, 2), -- Pinturas de Exterior - Galón
    (5, 3, 1), -- Impermeabilizantes - Cubeta 5 Galones
    (6, 4, 2), -- Barnices y Selladores - Galón
    (7, 4, 3), -- Barnices y Selladores - 1/4 Galón
    (8, 5, 5); -- Accesorios y Herramientas - Unidad

    -- ========================================================================
    -- 9. PROVEEDORES
    -- ========================================================================
    INSERT INTO [dbo].[Proveedores] ([id], [Codigo], [Nombre], [Contacto], [Direccion]) VALUES
    (1, N'PROV-001', N'Distribuidora Centroamericana de Pinturas S.A.', N'2410-3300 / ventas@dicapinsa.com.gt', N'Calzada Aguilar Batres 34-20, Zona 11, Guatemala'),
    (2, N'PROV-002', N'Recubrimientos y Químicos Industriales S.A.', N'2385-1900 / pedidos@requimsa.com.gt', N'Avenida Petapa 42-15, Zona 12, Guatemala'),
    (3, N'PROV-003', N'Importadora Ferretera Nacional S.A.', N'2290-7744 / contacto@imferna.com.gt', N'Anillo Periférico 15-80, Zona 7, Guatemala');

    -- ========================================================================
    -- 10. PRODUCTOS
    -- ========================================================================
    INSERT INTO [dbo].[Productos] ([id], [Nombre], [Caracteristicas], [Precio], [idMarcas], [idCategoriaPresentacion], [idProveedor]) VALUES
    (1, N'Pintura Látex Blanca Mate', N'Acabado mate lavable de alta cobertura para interiores', 650.00, 1, 1, 1),
    (2, N'Pintura Acrílica Blanca Satinada', N'Resistente a la humedad y hongos, acabado satinado', 165.00, 2, 2, 1),
    (3, N'Pintura Clima Extremo Gris Perla', N'Protección UV e intemperie para fachadas exteriores', 780.00, 1, 3, 1),
    (4, N'Impermeabilizante Elastómero Rojo Teja', N'Fibratado 5 años de garantía para losas y techos', 720.00, 3, 5, 2),
    (5, N'Barniz Marino Transparente Brillante', N'Protección contra sol y agua para madera exterior', 95.00, 4, 7, 2),
    (6, N'Sellador Acrílico Concentrado', N'Sellador alcalino para muros nuevos y repintado', 145.00, 3, 6, 2),
    (7, N'Rodillo Profesional Antigota 9 Pulgadas', N'Felpa de microfibra de alta densidad con maneral ergonómico', 45.00, 5, 8, 3),
    (8, N'Brocha Profesional Cerda Natural 4 Pulgadas', N'Mango de madera barnizada y virola inoxidable', 35.00, 5, 8, 3);

    -- ========================================================================
    -- 11. STOCK (Existencias por Sede y Producto)
    -- ========================================================================
    INSERT INTO [dbo].[Stock] ([id], [idSede], [idProducto], [Cantidad], [FechaActualizacion]) VALUES
    (1, 1, 1, 45, '2026-10-15'),
    (2, 1, 2, 80, '2026-10-15'),
    (3, 1, 3, 30, '2026-10-15'),
    (4, 1, 4, 25, '2026-10-15'),
    (5, 1, 5, 60, '2026-10-15'),
    (6, 1, 6, 40, '2026-10-15'),
    (7, 1, 7, 120, '2026-10-15'),
    (8, 1, 8, 150, '2026-10-15'),
    (9, 2, 1, 20, '2026-10-15'),
    (10, 2, 2, 35, '2026-10-15'),
    (11, 2, 4, 15, '2026-10-15'),
    (12, 3, 1, 18, '2026-10-15');

    -- ========================================================================
    -- 12. INVENTARIO Y 13. INVENTARIO ITEM
    -- ========================================================================
    INSERT INTO [dbo].[Inventario] ([id], [Fecha], [idSede]) VALUES
    (1, '2026-10-01', 1),
    (2, '2026-10-01', 2);

    INSERT INTO [dbo].[InventarioItem] ([id], [idInventario], [idStock], [CantidadExistente], [Estante]) VALUES
    (1, 1, 1, 45, N'Pasillo A - Estante A1'),
    (2, 1, 2, 80, N'Pasillo A - Estante A2'),
    (3, 1, 3, 30, N'Pasillo A - Estante A3'),
    (4, 1, 4, 25, N'Pasillo B - Estante B1'),
    (5, 1, 5, 60, N'Pasillo B - Estante B3'),
    (6, 1, 7, 120, N'Pasillo C - Estante C1'),
    (7, 2, 9, 20, N'Bodega Norte - Estante N1'),
    (8, 2, 10, 35, N'Bodega Norte - Estante N2');

    -- ========================================================================
    -- 14. CLIENTES
    -- ========================================================================
    INSERT INTO [dbo].[Clientes] ([id], [Nombres], [Apellidos], [NIT]) VALUES
    (1, N'Constructora del Sur', N'S.A.', N'7485963-2'),
    (2, N'Decoraciones y Acabados', N'M&A', N'9182736-5'),
    (3, N'María Alejandra', N'López Figueroa', N'4561238-9'),
    (4, N'Carlos Eduardo', N'Méndez Estrada', N'3216549-K'),
    (5, N'Consumidor', N'Final', N'CF');

    -- ========================================================================
    -- 15. METODOS DE PAGO
    -- ========================================================================
    INSERT INTO [dbo].[MetodoPago] ([id], [Nombre]) VALUES
    (1, N'Efectivo'),
    (2, N'Tarjeta de Crédito / Débito'),
    (3, N'Transferencia Bancaria'),
    (4, N'Cheque Certificado');

    -- ========================================================================
    -- 16. COTIZACION Y 17. COTIZACION ITEM
    -- ========================================================================
    INSERT INTO [dbo].[Cotizacion] ([id], [Codigo], [Fecha], [FechaLimite], [MontoTotal]) VALUES
    (1, N'COT-000001', '2026-10-10', '2026-10-25', 2690.00),
    (2, N'COT-000002', '2026-10-14', '2026-10-29', 1530.00);

    INSERT INTO [dbo].[CotizacionItem] ([id], [idCliente], [idCotizacion], [idStock], [Cantidad], [PrecioUnitario], [Subtotal]) VALUES
    (1, 1, 1, 1, 4, 650.00, 2600.00),
    (2, 1, 1, 7, 2, 45.00, 90.00),
    (3, 2, 2, 4, 2, 720.00, 1440.00),
    (4, 2, 2, 7, 2, 45.00, 90.00);

    -- ========================================================================
    -- 18. VENTAS, 19. VENTAS ITEM Y 20. FACTURAS
    -- ========================================================================
    INSERT INTO [dbo].[Ventas] ([id], [Codigo], [Fecha], [idEmpleado], [idMetodoPago], [idSede], [idCotizacion], [MontoTotal]) VALUES
    (1, N'VTA-000001', '2026-10-12', 3, 3, 1, 1, 2690.00),
    (2, N'VTA-000002', '2026-10-16', 3, 1, 1, NULL, 400.00);

    INSERT INTO [dbo].[VentasItem] ([id], [idVenta], [idStock], [Cantidad], [PrecioAplicado], [Subtotal]) VALUES
    (1, 1, 1, 4, 650.00, 2600.00),
    (2, 1, 7, 2, 45.00, 90.00),
    (3, 2, 2, 2, 165.00, 330.00),
    (4, 2, 8, 2, 35.00, 70.00);

    INSERT INTO [dbo].[Facturas] ([id], [Codigo], [idVenta], [NIT]) VALUES
    (1, N'FAC-000001', 1, N'7485963-2'),
    (2, N'FAC-000002', 2, N'4561238-9');

    -- ========================================================================
    -- 21. DEVOLUCIONES
    -- ========================================================================
    INSERT INTO [dbo].[Devoluciones] ([id], [idFactura], [Fecha], [idEmpleado], [idSede]) VALUES
    (1, 2, '2026-10-17', 3, 1);

    -- ========================================================================
    -- 22. COMPRA PROVEEDOR Y 23. COMPRA PROVEEDOR ITEM
    -- ========================================================================
    INSERT INTO [dbo].[CompraProveedor] ([id], [idProveedor], [idEmpleado], [Fecha], [MontoTotal]) VALUES
    (1, 1, 1, '2026-10-05', 11500.00),
    (2, 2, 1, '2026-10-11', 5600.00);

    -- En CompraProveedorItem: [Cantidad] = solicitada, [Unidades] = recibidas en bodega
    INSERT INTO [dbo].[CompraProveedorItem] ([id], [idCompra], [Descripcion], [Cantidad], [PrecioUnitario], [Unidades], [Subtotal]) VALUES
    (1, 1, N'Pintura Látex Blanca Mate', 20, 450.00, 20, 9000.00),
    (2, 1, N'Pintura Acrílica Blanca Satinada', 25, 100.00, 25, 2500.00),
    (3, 2, N'Impermeabilizante Elastómero Rojo Teja', 10, 500.00, 5, 5000.00),
    (4, 2, N'Barniz Marino Transparente Brillante', 10, 60.00, 0, 600.00);

    -- ========================================================================
    -- 24. ENTREGA PROVEEDORES Y 25. ENTREGA PROVEEDORES ITEMS
    -- ========================================================================
    INSERT INTO [dbo].[EntregaProveedores] ([id], [Fecha], [idEmpleado], [Notas], [idCompraProveedor]) VALUES
    (1, '2026-10-07', 1, N'Entrega Completa', 1),
    (2, '2026-10-13', 4, N'Entrega Parcial', 2);

    INSERT INTO [dbo].[EntregaProveedoresItems] ([id], [idCompraProveedorItem], [idEntrega], [Cantidad], [Notas]) VALUES
    (1, 1, 1, 20, N'Ingreso a bodega de Pintura Látex Blanca Mate'),
    (2, 2, 1, 25, N'Ingreso a bodega de Pintura Acrílica Blanca Satinada'),
    (3, 3, 2, 5, N'Ingreso parcial de Impermeabilizante Elastómero Rojo Teja');

    -- ========================================================================
    -- 26. LOGS
    -- ========================================================================
    INSERT INTO [dbo].[Logs] ([id], [Descripcion], [FechaHora], [idEmpleado]) VALUES
    (1, N'Inicialización de catálogos y configuración del sistema', GETDATE(), 1),
    (2, N'Pago registrado (Pagada) - Factura FAC-000001 por Q2690.00 | Ref: TRF-998811', GETDATE(), 3),
    (3, N'Pago registrado (Pagada) - Factura FAC-000002 por Q400.00 | Ref: EFE-0001', GETDATE(), 3);

    COMMIT TRANSACTION;

    SELECT
        1 AS Exito,
        'Base de datos poblada exitosamente con datos de prueba (Seeder completado).' AS Mensaje;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
