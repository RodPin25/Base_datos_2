import React from 'react';
import { useLocation } from 'react-router-dom';
import DocumentsPage from '../documentos/DocumentsPage';

export default function CotizacionesPage() {
  const location = useLocation();
  const startCreating = Boolean(location.state?.startCreating);

  return <DocumentsPage kind="quotes" startCreating={startCreating} />;
}
