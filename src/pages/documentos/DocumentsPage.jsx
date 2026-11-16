import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../shared/components/Icon';
import { money } from '../../shared/utils/formatters';
import {
  getClientes,
  getProductos,
  getMediosPago,
  getCotizaciones,
  getDetalleCotizacion,
  crearCotizacion,
  getFacturas,
  getDetalleFactura,
  generarFactura,
  registrarPago,
  anularFactura,
} from '../../services/facturacionService';
import { downloadDocumentFile, printDocumentPdf } from '../../utils/invoiceDownload';
import DocumentSummary from './components/DocumentSummary';
import DocumentForm from './components/DocumentForm';
import {
  GenerateInvoiceModal,
  RegisterPaymentModal,
  DocumentPreviewModal,
  VoidInvoiceModal,
} from './components/DocumentModals';

export default function DocumentsPage({ kind, startCreating = false }) {
  const isQuotes = kind === 'quotes';
  const [creating, setCreating] = useState(startCreating);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [cotizacionesList, setCotizacionesList] = useState([]);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [quoteToInvoice, setQuoteToInvoice] = useState(null);
  const [invoiceMedioPago, setInvoiceMedioPago] = useState(1);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [payMedioPago, setPayMedioPago] = useState(1);
  const [payMonto, setPayMonto] = useState('');
  const [payReferencia, setPayReferencia] = useState('');
  const [registeringPay, setRegisteringPay] = useState(false);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidingInvoice, setVoidingInvoice] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [cliData, prodData, mpData, quotesData, invoicesData] = await Promise.all([
        getClientes().catch(() => []),
        getProductos().catch(() => []),
        getMediosPago().catch(() => []),
        getCotizaciones().catch(() => []),
        getFacturas().catch(() => []),
      ]);

      setClientes(Array.isArray(cliData) ? cliData : []);
      setProductos(Array.isArray(prodData) ? prodData : []);
      const mpList = Array.isArray(mpData) ? mpData : [];
      setMediosPago(mpList);
      if (mpList.length > 0) {
        const defaultMp = mpList[0].IdMedioPago || mpList[0].id || 1;
        setInvoiceMedioPago(defaultMp);
        setPayMedioPago(defaultMp);
      }

      const mappedQuotes = (Array.isArray(quotesData) ? quotesData : []).map((q) => ({
        ...q,
        id: q.id,
        number: q.Codigo || `COT-${String(q.id).padStart(6, '0')}`,
        client: q.ClienteNombre || 'Cliente',
        date: q.Fecha || '',
        total: Number(q.MontoTotal || 0),
        status: q.Estado || 'Enviada',
      }));
      setCotizacionesList(mappedQuotes);

      const mappedInvoices = (Array.isArray(invoicesData) ? invoicesData : []).map((f) => ({
        ...f,
        id: f.id,
        number: f.Codigo || `FAC-${String(f.id).padStart(6, '0')}`,
        client: f.ClienteNombre || 'Consumidor Final',
        date: f.Fecha || '',
        total: Number(f.MontoTotal || 0),
        status: f.Estado || 'Pagada',
      }));

      setItems(isQuotes ? mappedQuotes : mappedInvoices);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar documentos desde el servidor.');
    } finally {
      setLoading(false);
    }
  }, [isQuotes]);

  useEffect(() => {
    setCreating(startCreating);
    setOpenMenuId(null);
    loadData();
  }, [startCreating, kind, loadData]);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleDownloadDocument = async (item, docKind = isQuotes ? 'quote' : 'invoice', mode = 'download') => {
    try {
      setOpenMenuId(null);
      if (docKind === 'invoice') {
        const targetFacturaId = item.IdFacturaAsociada || item.id;
        const res = await getDetalleFactura(targetFacturaId);
        const header = res?.factura || item;
        const detalles = res?.detalles || [];
        if (mode === 'print') {
          printDocumentPdf(header, detalles, 'invoice');
        } else {
          downloadDocumentFile(header, detalles, 'invoice');
        }
      } else {
        const res = await getDetalleCotizacion(item.id);
        const header = res?.cotizacion || item;
        const detalles = res?.detalles || [];
        if (mode === 'print') {
          printDocumentPdf(header, detalles, 'quote');
        } else {
          downloadDocumentFile(header, detalles, 'quote');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo descargar el documento.');
    }
  };

  const handlePreviewDocument = async (item, docKind = isQuotes ? 'quote' : 'invoice') => {
    try {
      setOpenMenuId(null);
      if (docKind === 'invoice') {
        const targetId = item.IdFacturaAsociada || item.id;
        const res = await getDetalleFactura(targetId);
        setPreviewDoc({
          kind: 'invoice',
          header: res?.factura || item,
          detalles: res?.detalles || [],
        });
      } else {
        const res = await getDetalleCotizacion(item.id);
        setPreviewDoc({
          kind: 'quote',
          header: res?.cotizacion || item,
          detalles: res?.detalles || [],
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo obtener el detalle del documento.');
    }
  };

  const handleConfirmGenerateInvoice = async (e, shouldDownload = false) => {
    if (e) e.preventDefault();
    if (!quoteToInvoice) return;
    setGeneratingInvoice(true);
    setErrorMsg('');
    try {
      const resp = await generarFactura({
        IdCliente: quoteToInvoice.idCliente,
        IdMedioPago: invoiceMedioPago,
        IdCotizacion: quoteToInvoice.id,
      });

      const codigoFac = resp.CodigoFactura || `FAC-${String(resp.IdFacturaGenerada).padStart(6, '0')}`;
      setSuccess(`Factura ${codigoFac} generada exitosamente desde la cotización ${quoteToInvoice.number}.`);

      if (shouldDownload && resp.IdFacturaGenerada) {
        const detalleRes = await getDetalleFactura(resp.IdFacturaGenerada);
        downloadDocumentFile(
          detalleRes?.factura || { Codigo: codigoFac, ClienteNombre: quoteToInvoice.client, MontoTotal: resp.MontoTotal },
          detalleRes?.detalles || [],
          'invoice'
        );
      }

      setQuoteToInvoice(null);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al generar la factura desde la cotización.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleConfirmRegisterPay = async (e) => {
    e.preventDefault();
    if (!invoiceToPay) return;
    setRegisteringPay(true);
    setErrorMsg('');
    try {
      const resp = await registrarPago({
        IdFactura: invoiceToPay.id,
        IdMedioPago: payMedioPago,
        MontoPagado: payMonto || invoiceToPay.total,
        Referencia: payReferencia,
      });
      setSuccess(
        `${resp.Mensaje || 'Pago registrado.'} Estado: ${resp.EstadoFactura || 'Pagada'} (${invoiceToPay.number})`
      );
      setInvoiceToPay(null);
      setPayReferencia('');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el pago.');
    } finally {
      setRegisteringPay(false);
    }
  };

  const handleConfirmVoid = async ({ idFactura, numero, motivo }) => {
    try {
      setVoidingInvoice(true);
      setErrorMsg('');
      const resp = await anularFactura({
        IdFactura: idFactura,
        Motivo: motivo,
      });
      setSuccess(
        resp?.Mensaje ||
          `Factura ${resp?.CodigoFactura || numero} anulada exitosamente. Monto actualizado a Q0.00 y stock revertido.`
      );
      setVoidModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo anular la factura.');
      setVoidModalOpen(false);
    } finally {
      setVoidingInvoice(false);
    }
  };

  if (creating) {
    return (
      <DocumentForm
        kind={isQuotes ? 'quote' : 'invoice'}
        clientes={clientes}
        productos={productos}
        mediosPago={mediosPago}
        cotizaciones={cotizacionesList}
        onCancel={() => setCreating(false)}
        onSave={async (payload) => {
          if (isQuotes) {
            const resp = await crearCotizacion(payload);
            setSuccess(`Cotización ${resp.CodigoCotizacion || ''} creada exitosamente en SQL Server.`);
          } else {
            const resp = await generarFactura(payload);
            setSuccess(`Factura ${resp.CodigoFactura || ''} emitida exitosamente en SQL Server.`);
          }
          setCreating(false);
          await loadData();
        }}
      />
    );
  }

  const filtered = items.filter((item) => {
    const matchesQuery = `${item.number} ${item.client} ${item.NIT || ''}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Todos los estados' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="section-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTIÓN COMERCIAL</p>
          <h1>{isQuotes ? 'Cotizaciones' : 'Facturación'}</h1>
          <p>
            {isQuotes
              ? 'Crea cotizaciones, conviértelas en factura y descárgalas desde el menú de acciones.'
              : 'Emite facturas, registra pagos y descarga tus documentos tributarios.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isQuotes && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setVoidModalOpen(true)}
              style={{ color: '#d9414f', borderColor: 'rgba(217, 65, 79, 0.35)' }}
            >
              <Icon name="close" size={16} />
              Anular factura
            </button>
          )}
          <button className="primary-button" type="button" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            {isQuotes ? 'Nueva cotización' : 'Generar factura'}
          </button>
        </div>
      </div>

      {success && (
        <div className="document-success">
          <span>
            <Icon name="check" size={15} />
          </span>
          {success}
          <button type="button" onClick={() => setSuccess('')}>×</button>
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

      <DocumentSummary items={items} kind={kind} />

      <article className="panel documents-panel">
        <div className="documents-toolbar">
          <div>
            <h2>{isQuotes ? 'Todas las cotizaciones' : 'Facturas emitidas'}</h2>
            <p>{items.length} documentos registrados en SQL Server</p>
          </div>
          <div className="documents-actions">
            <label className="document-search">
              <Icon name="search" size={16} />
              <input
                aria-label="Buscar documentos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número, cliente o NIT"
              />
            </label>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos los estados</option>
              {isQuotes ? (
                <>
                  <option>Enviada</option>
                  <option>Aprobada</option>
                  <option>Vencida</option>
                </>
              ) : (
                <>
                  <option>Pagada</option>
                  <option>Pago Parcial</option>
                  <option>Pendiente</option>
                  <option>Anulada</option>
                </>
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="no-results">Cargando documentos desde SQL Server...</div>
        ) : (
          <div className="table-wrap documents-table">
            <table>
              <thead>
                <tr>
                  <th>{isQuotes ? 'COTIZACIÓN' : 'FACTURA'}</th>
                  <th>CLIENTE</th>
                  <th>NIT</th>
                  <th>FECHA</th>
                  <th>TOTAL</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const statusClass = item.status.toLowerCase().includes('parcial')
                    ? 'parcial'
                    : item.status.toLowerCase();
                  const isMenuOpen = openMenuId === item.number;

                  return (
                    <tr key={item.number}>
                      <td>
                        <strong>{item.number}</strong>
                        {isQuotes && item.CodigoFacturaAsociada && (
                          <div style={{ fontSize: '9px', color: '#159447', marginTop: 2 }}>
                            Factura: {item.CodigoFacturaAsociada}
                          </div>
                        )}
                        {!isQuotes && item.CodigoCotizacion && (
                          <div style={{ fontSize: '9px', color: '#4f46e5', marginTop: 2 }}>
                            Origen: {item.CodigoCotizacion}
                          </div>
                        )}
                      </td>
                      <td>{item.client}</td>
                      <td>{item.NIT || 'CF'}</td>
                      <td>{item.date}</td>
                      <td>
                        <strong>{money(item.total)}</strong>
                      </td>
                      <td>
                        <span className={`status document-status ${statusClass}`}>{item.status}</span>
                      </td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title={
                              isQuotes && item.IdFacturaAsociada
                                ? `Descargar factura ${item.CodigoFacturaAsociada}`
                                : `Descargar ${item.number}`
                            }
                            aria-label={`Descargar ${item.number}`}
                            onClick={() =>
                              handleDownloadDocument(
                                item,
                                isQuotes && item.IdFacturaAsociada ? 'invoice' : isQuotes ? 'quote' : 'invoice',
                                'download'
                              )
                            }
                          >
                            <Icon name="download" size={16} />
                          </button>

                          <button
                            type="button"
                            title="Más opciones"
                            aria-label={`Opciones de ${item.number}`}
                            onClick={() => setOpenMenuId(isMenuOpen ? null : item.number)}
                          >
                            <Icon name="more" size={18} />
                          </button>

                          {isMenuOpen && (
                            <div className="action-menu-dropdown" role="menu">
                              {isQuotes ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setQuoteToInvoice(item);
                                    }}
                                  >
                                    <Icon name="receipt" size={15} />
                                    <span>Generar factura</span>
                                  </button>

                                  {item.IdFacturaAsociada && (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadDocument(item, 'invoice', 'download')}
                                    >
                                      <Icon name="download" size={15} />
                                      <span>Descargar factura ({item.CodigoFacturaAsociada})</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(item, 'quote', 'download')}
                                  >
                                    <Icon name="download" size={15} />
                                    <span>Descargar cotización</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(item, 'quote', 'print')}
                                  >
                                    <Icon name="file" size={15} />
                                    <span>Imprimir / Guardar PDF</span>
                                  </button>

                                  <div className="action-menu-divider" />

                                  <button type="button" onClick={() => handlePreviewDocument(item, 'quote')}>
                                    <Icon name="search" size={15} />
                                    <span>Ver detalle de cotización</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(item, 'invoice', 'download')}
                                  >
                                    <Icon name="download" size={15} />
                                    <span>Descargar factura</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(item, 'invoice', 'print')}
                                  >
                                    <Icon name="file" size={15} />
                                    <span>Imprimir / Guardar PDF</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setInvoiceToPay(item);
                                      setPayMonto(String(item.total));
                                      setPayMedioPago(item.idMetodoPago || mediosPago[0]?.IdMedioPago || 1);
                                    }}
                                  >
                                    <Icon name="check" size={15} />
                                    <span>Registrar pago</span>
                                  </button>

                                  <div className="action-menu-divider" />

                                  <button type="button" onClick={() => handlePreviewDocument(item, 'invoice')}>
                                    <Icon name="search" size={15} />
                                    <span>Ver detalle de factura</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="no-results">No encontramos documentos con esa búsqueda.</div>
            )}
          </div>
        )}
      </article>

      <GenerateInvoiceModal
        quoteToInvoice={quoteToInvoice}
        mediosPago={mediosPago}
        invoiceMedioPago={invoiceMedioPago}
        setInvoiceMedioPago={setInvoiceMedioPago}
        generatingInvoice={generatingInvoice}
        onClose={() => setQuoteToInvoice(null)}
        onConfirm={handleConfirmGenerateInvoice}
      />

      <RegisterPaymentModal
        invoiceToPay={invoiceToPay}
        mediosPago={mediosPago}
        payMedioPago={payMedioPago}
        setPayMedioPago={setPayMedioPago}
        payMonto={payMonto}
        setPayMonto={setPayMonto}
        payReferencia={payReferencia}
        setPayReferencia={setPayReferencia}
        registeringPay={registeringPay}
        onClose={() => setInvoiceToPay(null)}
        onConfirm={handleConfirmRegisterPay}
      />

      <DocumentPreviewModal
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {!isQuotes && (
        <VoidInvoiceModal
          isOpen={voidModalOpen}
          invoices={items}
          submitting={voidingInvoice}
          onClose={() => setVoidModalOpen(false)}
          onConfirm={handleConfirmVoid}
        />
      )}
    </section>
  );
}
