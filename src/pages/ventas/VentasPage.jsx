import React from 'react';
import DocumentsPage from '../documentos/DocumentsPage';

export default function VentasPage() {
  return <DocumentsPage kind="invoices" startCreating={true} />;
}
