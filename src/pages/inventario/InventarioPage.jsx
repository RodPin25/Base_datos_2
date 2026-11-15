import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../shared/components/Icon';
import { money } from '../../shared/utils/formatters';
import { getSessionUser } from '../../services/authService';
import {
  getProductos,
  getMarcas,
  getCategoriasPresentacion,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../../services/productosService';
import { getProveedores } from '../../services/comprasService';
import { getInventario, getInventarioFilter, getComprasProveedores } from '../../services/reporteriaService';
import { getSedes } from '../../services/sedeService';
import ProductoModal from './components/ProductoModal';

function unwrapArray(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const key of ['data', 'results', 'marcas', 'categorias', 'presentaciones', 'proveedores', 'productos']) {
      if (Array.isArray(res[key])) return res[key];
    }
    const firstArray = Object.values(res).find((val) => Array.isArray(val));
    if (firstArray) return firstArray;
  }
  return [];
}

function mergeCatalogs(
  primary = [],
  secondary = [],
  primaryIdKeys,
  secondaryIdKeys,
  nameKeys,
  fallbackPrefix
) {
  const map = new Map();

  const ingest = (items, idKeys) => {
    items.forEach((item) => {
      let idVal = null;
      for (const k of idKeys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
          idVal = item[k];
          break;
        }
      }
      if (idVal === null) return;

      let nameVal = null;
      for (const k of nameKeys) {
        if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '') {
          nameVal = String(item[k]).trim();
          break;
        }
      }

      const key = String(idVal);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: idVal,
          nombre: nameVal || `${fallbackPrefix} #${idVal}`,
          hasRealName: Boolean(nameVal),
        });
      } else if (!existing.hasRealName && nameVal) {
        map.set(key, { id: idVal, nombre: nameVal, hasRealName: true });
      }
    });
  };

  ingest(primary, primaryIdKeys);
  ingest(secondary, secondaryIdKeys);

  return Array.from(map.values());
}

function resolveCatalogName(catalog, idVal, fallbackPrefix) {
  if (idVal === undefined || idVal === null || idVal === '') return '—';
  const match = catalog.find((item) => String(item.id) === String(idVal));
  return match ? match.nombre : `${fallbackPrefix} #${idVal}`;
}

export default function InventarioPage() {
  const currentUser = getSessionUser();
  const canModify = Number(currentUser?.idRol) !== 2;
  const [activeTab, setActiveTab] = useState('productos');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [productos, setProductos] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [marcasApi, setMarcasApi] = useState([]);
  const [categoriasApi, setCategoriasApi] = useState([]);
  const [proveedoresApi, setProveedoresApi] = useState([]);
  const [comprasReport, setComprasReport] = useState([]);

  // Filtros
  const [query, setQuery] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');

  // Modal de creación / edición de producto
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [prodRes, invRes, sedesRes, marcasRes, catRes, provRes, comprasRes] = await Promise.all([
        getProductos().catch(() => []),
        getInventario().catch(() => []),
        getSedes().catch(() => []),
        getMarcas().catch(() => []),
        getCategoriasPresentacion().catch(() => []),
        getProveedores().catch(() => []),
        getComprasProveedores().catch(() => []),
      ]);

      setProductos(unwrapArray(prodRes));
      setStockList(unwrapArray(invRes));
      setSedes(unwrapArray(sedesRes));
      setMarcasApi(unwrapArray(marcasRes));
      setCategoriasApi(unwrapArray(catRes));
      setProveedoresApi(unwrapArray(provRes));
      setComprasReport(unwrapArray(comprasRes));
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar el inventario desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterStock = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res =
        selectedSede || stockMinimo !== ''
          ? await getInventarioFilter({
              IdSede: selectedSede || null,
              StockMinimo: stockMinimo !== '' ? stockMinimo : null,
            })
          : await getInventario();
      setStockList(unwrapArray(res));
    } catch (err) {
      setErrorMsg(err.message || 'Error al filtrar existencias de inventario.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProducto = async (payload) => {
    if (editingProduct) {
      const resp = await actualizarProducto(payload);
      setSuccessMsg(resp?.Mensaje || `Producto "${payload.Nombre}" actualizado correctamente.`);
    } else {
      const resp = await crearProducto(payload);
      setSuccessMsg(resp?.Mensaje || `Producto "${payload.Nombre}" creado correctamente.`);
    }
    setModalOpen(false);
    setEditingProduct(null);
    await loadData();
  };

  const handleDeleteProducto = async (prod) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el producto "${prod.Nombre}"?`)) return;
    try {
      setDeletingId(prod.id);
      setErrorMsg('');
      const resp = await eliminarProducto({ id: prod.id });
      setSuccessMsg(resp?.Mensaje || `Producto "${prod.Nombre}" eliminado correctamente.`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo eliminar el producto.');
    } finally {
      setDeletingId(null);
    }
  };

  const marcas = mergeCatalogs(
    marcasApi,
    productos,
    ['id', 'idMarcas', 'IdMarcas', 'idMarca', 'IdMarca'],
    ['idMarcas', 'IdMarcas', 'idMarca', 'IdMarca'],
    ['Nombre', 'nombre', 'MarcaNombre', 'Marca', 'marca', 'NombreMarca', 'Descripcion', 'descripcion'],
    'Marca'
  );
  const categorias = mergeCatalogs(
    categoriasApi.map((c) => ({
      ...c,
      NombreCompleto:
        c.NombreCompleto ||
        (c.CategoriaNombre && c.PresentacionNombre
          ? `${c.CategoriaNombre} - ${c.PresentacionNombre}`
          : c.CategoriaNombre || c.PresentacionNombre || c.Nombre),
    })),
    productos,
    ['id', 'idCategoriaPresentacion', 'IdCategoriaPresentacion', 'idCategoria', 'IdCategoria'],
    ['idCategoriaPresentacion', 'IdCategoriaPresentacion', 'idCategoria', 'IdCategoria'],
    [
      'NombreCompleto',
      'Nombre',
      'nombre',
      'CategoriaNombre',
      'PresentacionNombre',
      'CategoriaPresentacion',
      'Categoria',
      'categoria',
      'Presentacion',
      'presentacion',
      'Descripcion',
      'descripcion',
    ],
    'Categoría'
  );
  const proveedores = mergeCatalogs(
    proveedoresApi,
    [...comprasReport, ...productos],
    ['id', 'IdProveedor', 'idProveedor'],
    ['IdProveedor', 'idProveedor'],
    ['Nombre', 'nombre', 'RazonSocial', 'razon_social', 'ProveedorNombre', 'Proveedor', 'proveedor', 'NombreProveedor'],
    'Proveedor'
  );

  const filteredProductos = productos.filter((p) => {
    const text = `${p.id} ${p.Nombre || ''} ${p.Caracteristicas || ''} ${p.MarcaNombre || p.Marca || ''} ${
      p.CategoriaNombre || p.Presentacion || ''
    }`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const filteredStock = stockList.filter((item) => {
    const text = `${item.Producto || item.Nombre || item.ProductoNombre || ''} ${
      item.Sede || item.NombreSede || ''
    }`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const totalUnidades = stockList.reduce(
    (sum, s) => sum + Number(s.Stock ?? s.Cantidad ?? s.Existencia ?? s.StockActual ?? 0),
    0
  );
  const stockBajoCount = stockList.filter((s) => {
    const qty = Number(s.Stock ?? s.Cantidad ?? s.Existencia ?? s.StockActual ?? 0);
    const min = Number(s.StockMinimo ?? s.Minimo ?? 10);
    return qty <= min;
  }).length;

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">INVENTARIO Y CATÁLOGO</p>
          <h1>Inventario y Productos</h1>
          <p>Administra el catálogo de productos y consulta existencias por sede.</p>
        </div>
        {canModify && (
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            <Icon name="plus" size={18} />
            Nuevo producto
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <button
          type="button"
          className={activeTab === 'productos' ? 'primary-button' : 'outline-button'}
          style={{ height: 38, padding: '0 14px', fontSize: 13 }}
          onClick={() => setActiveTab('productos')}
        >
          <Icon name="box" size={15} />
          Catálogo de productos ({productos.length})
        </button>
        <button
          type="button"
          className={activeTab === 'stock' ? 'primary-button' : 'outline-button'}
          style={{ height: 38, padding: '0 14px', fontSize: 13 }}
          onClick={() => setActiveTab('stock')}
        >
          <Icon name="chart" size={15} />
          Existencias por sede ({stockList.length})
        </button>
      </div>

      {successMsg && (
        <div className="document-success">
          <span>
            <Icon name="check" size={15} />
          </span>
          {successMsg}
          <button type="button" onClick={() => setSuccessMsg('')}>×</button>
        </div>
      )}

      {errorMsg && (
        <div className="alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ border: 0, background: 'none', color: '#d9414f', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      <div className="document-stats">
        <article className="document-stat panel">
          <span className="document-stat-dot purple" />
          <div>
            <p>Productos registrados</p>
            <strong>{productos.length}</strong>
            <small>En dbo.Productos</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot green" />
          <div>
            <p>Unidades en stock</p>
            <strong>{totalUnidades.toLocaleString('es-GT')}</strong>
            <small>Suma total por sedes</small>
          </div>
        </article>
        <article className="document-stat panel">
          <span className="document-stat-dot amber" />
          <div>
            <p>Alertas de stock bajo</p>
            <strong>{stockBajoCount}</strong>
            <small>Productos por debajo del mínimo</small>
          </div>
        </article>
      </div>

      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>{activeTab === 'productos' ? 'Catálogo de productos' : 'Existencias por sede'}</h2>
            <p>
              {activeTab === 'productos'
                ? `${filteredProductos.length} productos mostrados`
                : `${filteredStock.length} registros de inventario`}
            </p>
          </div>

          <div className="documents-actions" style={{ flexWrap: 'wrap' }}>
            <label className="document-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar en inventario"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'productos' ? 'Buscar producto, marca o ID' : 'Buscar producto o sede'
                }
              />
            </label>

            {activeTab === 'stock' && (
              <>
                <select
                  aria-label="Filtrar por sede"
                  value={selectedSede}
                  onChange={(e) => setSelectedSede(e.target.value)}
                >
                  <option value="">Todas las sedes</option>
                  {sedes.map((s) => (
                    <option key={s.id || s.IdSede} value={s.id || s.IdSede}>
                      {s.Nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Stock máx."
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  style={{
                    height: 34,
                    width: 100,
                    border: '1px solid #e2e5ea',
                    borderRadius: 8,
                    padding: '0 10px',
                    fontSize: 11,
                  }}
                />
                <button type="button" className="outline-button" onClick={handleFilterStock}>
                  Filtrar
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="no-results">Cargando información desde SQL Server...</div>
        ) : activeTab === 'productos' ? (
          <div className="table-wrap documents-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PRODUCTO</th>
                  <th>CARACTERÍSTICAS</th>
                  <th>MARCA / PRESENTACIÓN</th>
                  <th>PRECIO</th>
                  {canModify && <th>ACCIONES</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <strong>#{prod.id}</strong>
                    </td>
                    <td>
                      <strong>{prod.Nombre}</strong>
                    </td>
                    <td>{prod.Caracteristicas || <span style={{ color: '#9aa2ae' }}>—</span>}</td>
                    <td>
                      {prod.MarcaNombre ||
                        prod.Marca ||
                        prod.NombreMarca ||
                        resolveCatalogName(marcas, prod.idMarcas ?? prod.IdMarcas, 'Marca')}
                      {(prod.CategoriaNombre ||
                        prod.Presentacion ||
                        prod.CategoriaPresentacion ||
                        prod.idCategoriaPresentacion ||
                        prod.IdCategoriaPresentacion) && (
                        <div style={{ fontSize: 10, color: '#8a93a2' }}>
                          {resolveCatalogName(
                            categorias,
                            prod.idCategoriaPresentacion ?? prod.IdCategoriaPresentacion,
                            'Categoría'
                          ) ||
                            prod.CategoriaNombre ||
                            prod.Presentacion ||
                            prod.CategoriaPresentacion}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{money(prod.Precio)}</strong>
                    </td>
                    {canModify && (
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            title="Editar producto"
                            aria-label={`Editar ${prod.Nombre}`}
                            onClick={() => {
                              setEditingProduct(prod);
                              setModalOpen(true);
                            }}
                          >
                            <Icon name="file" size={15} />
                          </button>
                          <button
                            type="button"
                            title="Eliminar producto"
                            aria-label={`Eliminar ${prod.Nombre}`}
                            disabled={deletingId === prod.id}
                            onClick={() => handleDeleteProducto(prod)}
                          >
                            <Icon name="close" size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProductos.length === 0 && (
              <div className="no-results">No encontramos productos con esa búsqueda.</div>
            )}
          </div>
        ) : (
          <div className="table-wrap documents-table">
            <table>
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>SEDE / BODEGA</th>
                  <th>STOCK ACTUAL</th>
                  <th>STOCK MÍNIMO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, idx) => {
                  const nombre = item.Producto || item.Nombre || item.ProductoNombre || `Producto #${idx + 1}`;
                  const sede = item.Sede || item.NombreSede || item.Bodega || 'Principal';
                  const qty = Number(item.Stock ?? item.Cantidad ?? item.Existencia ?? item.StockActual ?? 0);
                  const min = Number(item.StockMinimo ?? item.Minimo ?? 10);
                  const isLow = qty <= min;

                  return (
                    <tr key={`${nombre}-${sede}-${idx}`}>
                      <td>
                        <strong>{nombre}</strong>
                      </td>
                      <td>{sede}</td>
                      <td>
                        <strong>{qty}</strong>
                      </td>
                      <td>{min}</td>
                      <td>
                        <span className={`status document-status ${isLow ? 'pendiente' : 'pagada'}`}>
                          {isLow ? 'Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStock.length === 0 && (
              <div className="no-results">No hay registros de existencias para mostrar.</div>
            )}
          </div>
        )}
      </article>

      <ProductoModal
        isOpen={modalOpen}
        editingProduct={editingProduct}
        marcas={marcas}
        categorias={categorias}
        proveedores={proveedores}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProducto}
      />
    </section>
  );
}
