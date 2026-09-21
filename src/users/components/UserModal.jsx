import React, { useState, useEffect } from 'react';
import { getSedes } from '../../sedes/services/sedeService';
import { getRoles } from '../../roles/services/rolService';

const UserModal = ({ isOpen, onClose, onSave }) => {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [idSede, setIdSede] = useState('');
  const [idRol, setIdRol] = useState('');

  // Catálogos cargados desde la base de datos
  const [sedes, setSedes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [errorCatalogs, setErrorCatalogs] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Limpiar campos del formulario
      setNombres('');
      setApellidos('');
      setCorreo('');
      setUsuario('');
      setPassword('');
      setIdSede('');
      setIdRol('');
      setErrorCatalogs('');

      // Cargar catálogos de sedes y roles desde la base de datos
      const loadCatalogs = async () => {
        setLoadingCatalogs(true);
        try {
          const [sedesData, rolesData] = await Promise.all([
            getSedes(),
            getRoles(),
          ]);

          const sedesList = Array.isArray(sedesData) ? sedesData : [];
          const rolesList = Array.isArray(rolesData) ? rolesData : [];

          setSedes(sedesList);
          setRoles(rolesList);

          if (sedesList.length > 0) {
            setIdSede(sedesList[0].id);
          }
          if (rolesList.length > 0) {
            setIdRol(rolesList[0].id);
          }
        } catch (err) {
          setErrorCatalogs('Error al cargar catálogos desde la BD: ' + err.message);
        } finally {
          setLoadingCatalogs(false);
        }
      };

      loadCatalogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idSede || !idRol) {
      alert('Debes seleccionar una sede y un rol de la lista.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        Nombres: nombres.trim(),
        Apellidos: apellidos.trim(),
        Correo: correo.trim() || null,
        idSede: Number(idSede),
        idRol: Number(idRol),
        Usuario: usuario.trim(),
        Password: password,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Registrar Nuevo Empleado</h3>
        
        {errorCatalogs && <div className="alert-error" style={{ marginBottom: '1rem' }}>{errorCatalogs}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombres *</label>
            <input 
              type="text" 
              placeholder="Ej: Carlos Alberto"
              value={nombres} 
              onChange={(e) => setNombres(e.target.value)} 
              required 
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Apellidos *</label>
            <input 
              type="text" 
              placeholder="Ej: Pérez Gómez"
              value={apellidos} 
              onChange={(e) => setApellidos(e.target.value)} 
              required 
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="empleado@empresa.com"
              value={correo} 
              onChange={(e) => setCorreo(e.target.value)} 
              disabled={submitting}
            />
          </div>

          {/* Listbox / Select de Sede cargado de la BD */}
          <div className="form-group">
            <label>Sede Asignada *</label>
            {loadingCatalogs ? (
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Cargando sedes desde BD...</p>
            ) : (
              <select 
                value={idSede} 
                onChange={(e) => setIdSede(e.target.value)}
                required
                disabled={submitting || sedes.length === 0}
              >
                {sedes.length === 0 && <option value="">No hay sedes disponibles</option>}
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.Nombre} {s.Direccion ? `(${s.Direccion})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Listbox / Select de Rol cargado de la BD */}
          <div className="form-group">
            <label>Rol Asignado *</label>
            {loadingCatalogs ? (
              <p style={{ fontSize: '0.85rem', color: '#666' }}>Cargando roles desde BD...</p>
            ) : (
              <select 
                value={idRol} 
                onChange={(e) => setIdRol(e.target.value)}
                required
                disabled={submitting || roles.length === 0}
              >
                {roles.length === 0 && <option value="">No hay roles disponibles</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.Nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Nombre de Usuario (Login) *</label>
            <input 
              type="text" 
              placeholder="Ej: cperez"
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)} 
              required 
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Contraseña *</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={submitting}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || loadingCatalogs}>
              {submitting ? 'Guardando...' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;