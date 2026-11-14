import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { ROUTES } from '../../routes/navigation';

export default function AccesoDenegadoPage({ roleBadge = 'tu rol actual' }) {
  const navigate = useNavigate();

  return (
    <div className="empty-module panel">
      <div className="empty-icon">
        <Icon name="shield" size={28} />
      </div>
      <h2>Acceso Denegado</h2>
      <p>Tu rol ({roleBadge}) no tiene permisos para acceder a este módulo.</p>
      <button className="outline-button" type="button" onClick={() => navigate(ROUTES.INICIO)}>
        Volver al inicio
      </button>
    </div>
  );
}
