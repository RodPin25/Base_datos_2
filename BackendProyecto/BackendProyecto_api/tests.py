from django.test import SimpleTestCase
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from .db import execute_sp
from .security import hasher, crear_token_acceso


class BackendProyectoApiTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('BackendProyecto_api.views.execute_sp')
    def test_login_and_me(self, mock_sp):
        mock_sp.return_value = [{
            'idEmpleado': 1,
            'Usuario': 'admin',
            'HashContra': hasher('Admin123*'),
            'idRol': 1,
            'idSede': 1,
        }]
        res = self.client.post('/api/auth/login/', {'Usuario': 'admin', 'Password': 'Admin123*'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['Exito'])
        token = res.data['access_token']

        me_res = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.data['usuario']['usuario'], 'admin')

    @patch('BackendProyecto_api.views.execute_sp')
    def test_catalogs_get_and_post(self, mock_sp):
        mock_sp.return_value = [{'id': 1, 'Nombre': 'Sede Central', 'Direccion': 'Zona 10', 'Contacto': '2234-5600'}]
        res_get = self.client.get('/api/sedes/?id=1')
        self.assertEqual(res_get.status_code, 200)
        mock_sp.assert_called_with('dbo.sp_ObtenerSedes', {'@id': 1})

        res_post = self.client.post('/api/sedes/', {}, format='json')
        self.assertEqual(res_post.status_code, 200)
        mock_sp.assert_called_with('dbo.sp_ObtenerSedes', None)

    @patch('BackendProyecto_api.views.execute_sp')
    def test_generar_factura_directa(self, mock_sp):
        mock_sp.return_value = [{
            'IdFacturaGenerada': 3,
            'CodigoFactura': 'FAC-000003',
            'IdVentaGenerada': 3,
            'MontoTotal': 1300.0,
        }]
        payload = {
            'IdCliente': 1,
            'IdMedioPago': 1,
            'Detalles': [
                {'IdProducto': 1, 'Cantidad': 2, 'PrecioUnitario': '650.00'}
            ],
        }
        res = self.client.post('/api/facturas/generar/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['IdFacturaGenerada'], 3)
        self.assertEqual(res.data['CodigoFactura'], 'FAC-000003')

    @patch('BackendProyecto_api.views.execute_sp')
    def test_registrar_pago_y_medios_pago(self, mock_sp):
        mock_sp.return_value = [{
            'Exito': 1,
            'Mensaje': 'Pago registrado correctamente.',
            'EstadoFactura': 'Pagada',
            'MontoPagado': 1300.0,
            'TotalFactura': 1300.0,
        }]
        res = self.client.post('/api/pagos/registrar/', {
            'IdFactura': 1,
            'IdMedioPago': 1,
            'MontoPagado': '1300.00',
            'Referencia': 'AUT-123',
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['Exito'])

        mock_sp.return_value = [{'IdMedioPago': 1, 'id': 1, 'Nombre': 'Efectivo'}]
        res_mp = self.client.get('/api/medios-pago/')
        self.assertEqual(res_mp.status_code, 200)
        self.assertEqual(res_mp.data[0]['IdMedioPago'], 1)

    @patch('BackendProyecto_api.views.execute_sp')
    def test_orden_compra_e_ingreso_bodega(self, mock_sp):
        mock_sp.return_value = [{'IdOrdenCompraGenerada': 5, 'Mensaje': 'Orden de compra creada exitosamente.'}]
        res_oc = self.client.post('/api/ordenes-compra/crear/', {
            'IdProveedor': 1,
            'Detalles': [{'IdProducto': 1, 'Cantidad': 10, 'PrecioCosto': '450.00'}],
        }, format='json')
        self.assertEqual(res_oc.status_code, 201)
        self.assertEqual(res_oc.data['IdOrdenCompraGenerada'], 5)

        mock_sp.return_value = [{
            'IdIngresoGenerado': 4,
            'EstadoOrden': 'Completa',
            'Mensaje': 'Ingreso a bodega procesado correctamente.',
        }]
        res_ing = self.client.post('/api/bodega/ingreso/', {
            'IdOrdenCompra': 5,
            'DetallesIngreso': [{'IdProducto': 1, 'CantidadIngresada': 10}],
        }, format='json')
        self.assertEqual(res_ing.status_code, 201)
        self.assertEqual(res_ing.data['IdIngresoGenerado'], 4)
        self.assertEqual(res_ing.data['EstadoOrden'], 'Completa')

        # También debe aceptar el alias singular 'DetalleIngreso'
        res_ing_alias = self.client.post('/api/bodega/ingreso/', {
            'IdOrdenCompra': 5,
            'IdEmpleado': 1,
            'IdSede': 1,
            'DetalleIngreso': [{'IdProducto': 1, 'CantidadIngresada': 1}],
        }, format='json')
        self.assertEqual(res_ing_alias.status_code, 201)

    @patch('BackendProyecto_api.views.execute_sp')
    def test_anular_factura_y_obtener_anulaciones(self, mock_sp):
        mock_sp.return_value = [{
            'Exito': 1,
            'Mensaje': 'Factura anulada exitosamente y stock revertido.',
            'IdDevolucion': 1,
            'IdFactura': 3,
            'CodigoFactura': 'FAC-000003',
            'EstadoFactura': 'Anulada',
        }]
        res = self.client.post('/api/facturas/anular/', {
            'IdFactura': 3,
            'Motivo': 'Error en datos de facturación',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['Exito'])
        self.assertEqual(res.data['EstadoFactura'], 'Anulada')

        mock_sp.return_value = [{
            'id': 1,
            'idFactura': 3,
            'CodigoFactura': 'FAC-000003',
            'Motivo': 'Error en datos de facturación',
        }]
        res_list = self.client.get('/api/facturas/anulaciones/?id=1')
        self.assertEqual(res_list.status_code, 200)
        mock_sp.assert_called_with('dbo.sp_ObtenerAnulaciones', {'@id': 1})

    @patch('BackendProyecto_api.views.execute_sp')
    def test_reportes_endpoints(self, mock_sp):
        # Sin token debe retornar 401 Unauthorized
        res_unauth = self.client.get('/api/reportes/ventas/')
        self.assertEqual(res_unauth.status_code, 401)
        res_unauth_bitacora = self.client.get('/api/reportes/bitacora/')
        self.assertEqual(res_unauth_bitacora.status_code, 401)

        token = crear_token_acceso({'sub': '1', 'usuario': 'admin', 'idRol': 1, 'idSede': 1})
        auth_header = f'Bearer {token}'

        mock_sp.return_value = [{'IdFactura': 1, 'CodigoFactura': 'FAC-000001', 'Estado': 'Pagada'}]
        res_ventas = self.client.get('/api/reportes/ventas/?FechaInicio=2026-01-01&IncluirAnuladas=false', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_ventas.status_code, 200)
        self.assertEqual(len(res_ventas.data), 1)

        mock_sp.return_value = [{'TotalFacturas': 5, 'FacturasActivas': 4, 'FacturasAnuladas': 1, 'TotalVendido': 5000.0}]
        res_resumen = self.client.post('/api/reportes/ventas/resumen/', {'IdSede': 1}, format='json', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_resumen.status_code, 200)
        self.assertEqual(res_resumen.data['TotalFacturas'], 5)

        mock_sp.return_value = [{'IdProducto': 1, 'ProductoNombre': 'Pintura Látex', 'CantidadVendida': 20}]
        res_top = self.client.get('/api/reportes/productos-mas-vendidos/?Top=5', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_top.status_code, 200)

        mock_sp.return_value = [{'IdStock': 1, 'Cantidad': 3, 'ProductoNombre': 'Pintura Látex'}]
        res_stock = self.client.get('/api/reportes/inventario-stock/?StockMinimo=5', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_stock.status_code, 200)

        mock_sp.return_value = [{'IdOrdenCompra': 1, 'EstadoRecepcion': 'Completa'}]
        res_compras = self.client.get('/api/reportes/compras-proveedores/', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_compras.status_code, 200)

        mock_sp.return_value = [{'id': 1, 'Descripcion': 'Factura anulada'}]
        res_logs = self.client.get('/api/reportes/bitacora/', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_logs.status_code, 200)

        # Filtro inválido debe devolver 400
        res_bad = self.client.get('/api/reportes/productos-mas-vendidos/?Top=0', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(res_bad.status_code, 400)

    @patch('BackendProyecto_api.views.execute_sp')
    def test_obtener_ordenes_compra_y_detalle(self, mock_sp):
        mock_sp.return_value = [{'id': 5, 'ProveedorNombre': 'Pinturas S.A.', 'Estado': 'Pendiente'}]
        res_all = self.client.get('/api/ordenes-compra/')
        self.assertEqual(res_all.status_code, 200)
        mock_sp.assert_called_with('dbo.sp_ObtenerOrdenesCompra', None)

        res_one = self.client.post('/api/ordenes-compra/', {'id': 5}, format='json')
        self.assertEqual(res_one.status_code, 200)
        mock_sp.assert_called_with('dbo.sp_ObtenerOrdenesCompra', {'@id': 5})

        mock_sp.side_effect = [
            [{'id': 5, 'ProveedorNombre': 'Pinturas S.A.', 'Estado': 'Pendiente'}],
            [{'id': 1, 'idCompra': 5, 'idProducto': 1, 'Descripcion': 'Pintura Látex', 'Cantidad': 10, 'Unidades': 0, 'Pendientes': 10}],
        ]
        res_det = self.client.get('/api/ordenes-compra/detalle/?id=5')
        self.assertEqual(res_det.status_code, 200)
        self.assertTrue(res_det.data['Exito'])
        self.assertEqual(res_det.data['orden_compra']['id'], 5)
        self.assertEqual(len(res_det.data['detalles']), 1)

    @patch('BackendProyecto_api.db.get_connection')
    def test_execute_sp_udt_param_order(self, mock_get_conn):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.description = [('IdOrdenCompraGenerada',)]
        mock_cursor.fetchall.return_value = [(10,)]
        mock_conn.cursor.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn

        res = execute_sp(
            'dbo.sp_RealizarOrdenCompra',
            params={'@IdProveedor': 1, '@IdEmpleado': 2},
            udt_params={
                '@Detalles': {
                    'type_name': 'dbo.DetalleCompraUDT',
                    'columns': ['IdProducto', 'Cantidad', 'PrecioCosto'],
                    'rows': [
                        {'IdProducto': 7, 'Cantidad': 10, 'PrecioCosto': 450.0},
                        {'IdProducto': 8, 'Cantidad': 5, 'PrecioCosto': 120.5},
                    ],
                }
            },
        )
        self.assertEqual(res, [{'IdOrdenCompraGenerada': 10}])
        executed_sql, executed_params = mock_cursor.execute.call_args[0]
        # Los VALUES del INSERT van antes que el EXEC, así que sus valores deben ir primero
        self.assertEqual(executed_params, [7, 10, 450.0, 8, 5, 120.5, 1, 2])
        self.assertLess(executed_sql.index('INSERT INTO'), executed_sql.index('EXEC'))
