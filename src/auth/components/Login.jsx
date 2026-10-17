import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import { createUser } from '../../users/services/userService';
import { getSedes } from '../../sedes/services/sedeService';
import { getRoles } from '../../roles/services/rolService';
import './Login.css';

function AuthShell({ children, wide = false }) {
  return (
    <div className="login-root">
      <div className="login-side" aria-hidden="true">
        <div className="login-side-inner">
          <div className="login-brand-large">
            <div className="brand-mark" style={{ width: 48, height: 48 }}>
              <span style={{ width: 26, height: 26, borderRadius: 10 }} />
              <span style={{ width: 26, height: 26, borderRadius: 10 }} />
              <span style={{ width: 26, height: 26, borderRadius: 10 }} />
            </div>
            <div>
              <strong>Colora</strong>
              <small>Gestión comercial</small>
            </div>
          </div>
          <p className="login-tagline">
            El sistema que mantiene tu negocio de pinturas siempre al día.
          </p>
          <ul className="login-features">
            {[
              'Control de inventario en tiempo real',
              'Facturación ágil y sin errores',
              'Reportes para decisiones informadas',
            ].map((f) => (
              <li key={f}>
                <span className="login-check">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="login-side-deco" />
        </div>
      </div>
      <div className={`login-main ${wide ? 'login-main--wide' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function AuthBrand() {
  return (
    <div className="login-card-brand">
      <div className="brand-mark" style={{ width: 34, height: 34 }}>
        <span style={{ width: 18, height: 18, borderRadius: 7 }} />
        <span style={{ width: 18, height: 18, borderRadius: 7 }} />
        <span style={{ width: 18, height: 18, borderRadius: 7 }} />
      </div>
      <span>Colora</span>
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const FALLBACK_ROLES = [
  { id: 1, Nombre: 'Administrador' },
  { id: 2, Nombre: 'Supervisor / Consulta' },
  { id: 3, Nombre: 'Vendedor / Operativo' },
];

const FALLBACK_SEDES = [
  { id: 1, Nombre: 'Central' },
  { id: 2, Nombre: 'Norte' },
  { id: 3, Nombre: 'Sur' },
];

function RegisterForm({ onNavigate }) {
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    usuario: '',
    email: '',
    sucursal: '1',
    role: '3',
    password: '',
    confirm: '',
  });
  const [sedes, setSedes] = useState(FALLBACK_SEDES);
  const [roles, setRoles] = useState(FALLBACK_ROLES);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getSedes(), getRoles()]).then(([sRes, rRes]) => {
      if (!active) return;
      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value) && sRes.value.length > 0) {
        setSedes(sRes.value);
        setForm((f) => ({ ...f, sucursal: String(sRes.value[0].id) }));
      }
      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value) && rRes.value.length > 0) {
        setRoles(rRes.value);
        setForm((f) => ({ ...f, role: String(rRes.value[0].id) }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido.';
    if (!form.lastName.trim()) e.lastName = 'El apellido es requerido.';
    if (!form.usuario.trim()) e.usuario = 'El usuario es requerido.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Ingresa un correo válido.';
    }
    if (!form.sucursal) e.sucursal = 'Selecciona una sucursal.';
    if (!form.role) e.role = 'Selecciona un rol.';
    if (form.password.length < 4) e.password = 'Mínimo 4 caracteres.';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      await createUser({
        Nombres: form.name.trim(),
        Apellidos: form.lastName.trim(),
        Correo: form.email.trim() || null,
        idSede: Number(form.sucursal),
        idRol: Number(form.role),
        Usuario: form.usuario.trim(),
        Password: form.password,
      });
      onNavigate('register-ok');
    } catch (err) {
      setApiError(err.message || 'No se pudo registrar la cuenta en el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell wide>
      <form className="login-card login-card--wide" onSubmit={handleSubmit} noValidate>
        <AuthBrand />
        <h1 className="login-title">Crear cuenta</h1>
        <p className="login-subtitle">Completa los datos para registrarte en el sistema.</p>

        {apiError && (
          <p className="login-error" role="alert" style={{ marginBottom: 14 }}>
            {apiError}
          </p>
        )}

        <div className="reg-grid">
          <div className="reg-field">
            <label className="login-label" htmlFor="r-name">Nombre(s)</label>
            <input
              className={`login-input ${errors.name ? 'login-input--err' : ''}`}
              id="r-name"
              placeholder="Andrea"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <span className="reg-error">{errors.name}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-last">Apellido(s)</label>
            <input
              className={`login-input ${errors.lastName ? 'login-input--err' : ''}`}
              id="r-last"
              placeholder="Ruiz García"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
            />
            {errors.lastName && <span className="reg-error">{errors.lastName}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-user">Usuario (Login)</label>
            <input
              className={`login-input ${errors.usuario ? 'login-input--err' : ''}`}
              id="r-user"
              placeholder="aruiz"
              value={form.usuario}
              onChange={(e) => set('usuario', e.target.value)}
            />
            {errors.usuario && <span className="reg-error">{errors.usuario}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-email">Correo electrónico</label>
            <input
              className={`login-input ${errors.email ? 'login-input--err' : ''}`}
              id="r-email"
              type="email"
              placeholder="usuario@colora.gt"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <span className="reg-error">{errors.email}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-sucursal">Sucursal asignada</label>
            <select
              className={`login-input login-select ${errors.sucursal ? 'login-input--err' : ''}`}
              id="r-sucursal"
              value={form.sucursal}
              onChange={(e) => set('sucursal', e.target.value)}
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.Nombre}
                </option>
              ))}
            </select>
            {errors.sucursal && <span className="reg-error">{errors.sucursal}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-role">Rol en el sistema</label>
            <select
              className={`login-input login-select ${errors.role ? 'login-input--err' : ''}`}
              id="r-role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.Nombre}
                </option>
              ))}
            </select>
            {errors.role && <span className="reg-error">{errors.role}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-pass">Contraseña</label>
            <div className="login-pass-wrap">
              <input
                className={`login-input ${errors.password ? 'login-input--err' : ''}`}
                id="r-pass"
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            {errors.password && <span className="reg-error">{errors.password}</span>}
          </div>

          <div className="reg-field">
            <label className="login-label" htmlFor="r-confirm">Confirmar contraseña</label>
            <div className="login-pass-wrap">
              <input
                className={`login-input ${errors.confirm ? 'login-input--err' : ''}`}
                id="r-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
              />
              <button type="button" className="login-eye" onClick={() => setShowConfirm(!showConfirm)}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {errors.confirm && <span className="reg-error">{errors.confirm}</span>}
          </div>
        </div>

        <button className="login-submit" type="submit" disabled={loading} style={{ marginTop: 26 }}>
          {loading ? <span className="login-spinner" /> : 'Registrar cuenta'}
        </button>

        <p className="login-footer-link">
          ¿Ya tienes cuenta?{' '}
          <button type="button" className="login-link login-link--bold" onClick={() => onNavigate('login')}>
            Iniciar sesión
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function RegisterSuccess({ onNavigate }) {
  return (
    <AuthShell>
      <div className="login-card auth-result-card">
        <AuthBrand />
        <div className="auth-result-icon auth-result-icon--ok">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="login-title" style={{ marginTop: 18 }}>¡Cuenta creada!</h1>
        <p className="login-subtitle" style={{ marginBottom: 28 }}>
          Tu cuenta fue registrada exitosamente. Ya puedes iniciar sesión con tus credenciales.
        </p>
        <button className="login-submit" onClick={() => onNavigate('login')}>
          Ir a iniciar sesión
        </button>
      </div>
    </AuthShell>
  );
}

function ForgotForm({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onNavigate('forgot-sent');
    }, 600);
  }

  return (
    <AuthShell>
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <AuthBrand />
        <button type="button" className="auth-back-btn" onClick={() => onNavigate('login')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver al inicio de sesión
        </button>
        <h1 className="login-title" style={{ marginTop: 10 }}>Recuperar contraseña</h1>
        <p className="login-subtitle">
          Ingresa tu correo registrado y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <div className="forgot-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 7 10-7" />
          </svg>
        </div>

        <label className="login-label" htmlFor="f-email">Correo electrónico</label>
        <input
          className={`login-input ${error ? 'login-input--err' : ''}`}
          id="f-email"
          type="email"
          autoComplete="username"
          placeholder="usuario@colora.gt"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
        />
        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="login-submit" type="submit" disabled={loading} style={{ marginTop: 22 }}>
          {loading ? <span className="login-spinner" /> : 'Enviar enlace de recuperación'}
        </button>
      </form>
    </AuthShell>
  );
}

function ForgotSent({ onNavigate }) {
  return (
    <AuthShell>
      <div className="login-card auth-result-card">
        <AuthBrand />
        <div className="auth-result-icon auth-result-icon--mail">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 7 10-7" />
          </svg>
        </div>
        <h1 className="login-title" style={{ marginTop: 18 }}>Revisa tu correo</h1>
        <p className="login-subtitle" style={{ marginBottom: 6 }}>
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <p className="login-subtitle" style={{ marginBottom: 28 }}>
          Revisa también tu carpeta de spam o correo no deseado.
        </p>
        <button className="login-submit" onClick={() => onNavigate('login')}>
          Volver al inicio de sesión
        </button>
        <p className="login-footer-link" style={{ marginTop: 14 }}>
          ¿No llegó el correo?{' '}
          <button type="button" className="login-link login-link--bold" onClick={() => onNavigate('forgot')}>
            Intentar de nuevo
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

const Login = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login');
  const [showPass, setShowPass] = useState(false);

  const {
    usuario,
    setUsuario,
    password,
    setPassword,
    error,
    loading,
    handleLogin,
  } = useLogin(onLoginSuccess);

  if (view === 'register') return <RegisterForm onNavigate={setView} />;
  if (view === 'register-ok') return <RegisterSuccess onNavigate={setView} />;
  if (view === 'forgot') return <ForgotForm onNavigate={setView} />;
  if (view === 'forgot-sent') return <ForgotSent onNavigate={setView} />;

  return (
    <AuthShell>
      <form className="login-card" onSubmit={handleLogin} noValidate>
        <AuthBrand />
        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-subtitle">Ingresa tus credenciales para acceder al sistema.</p>

        <label className="login-label" htmlFor="l-usuario">Usuario</label>
        <input
          className="login-input"
          id="l-usuario"
          type="text"
          autoComplete="username"
          placeholder="Ingresa tu usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          disabled={loading}
          required
        />

        <div className="login-label-row">
          <label className="login-label" htmlFor="l-pass">Contraseña</label>
          <button type="button" className="login-link" onClick={() => setView('forgot')}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="login-pass-wrap">
          <input
            className="login-input"
            id="l-pass"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            className="login-eye"
            aria-label={showPass ? 'Ocultar' : 'Mostrar'}
            onClick={() => setShowPass(!showPass)}
          >
            <EyeIcon open={showPass} />
          </button>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? <span className="login-spinner" /> : 'Entrar al sistema'}
        </button>

        <p className="login-footer-link">
          ¿Aún no tienes cuenta?{' '}
          <button type="button" className="login-link login-link--bold" onClick={() => setView('register')}>
            Crear cuenta
          </button>
        </p>

        <p className="login-hint">
          Autenticación conectada con <code>JWT / SQL Server</code>
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;