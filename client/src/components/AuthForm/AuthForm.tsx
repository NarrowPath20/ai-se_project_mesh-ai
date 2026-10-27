import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import useFormWithValidation from '../../hooks/useFormWithValidation';
import '../Header/Header.css';

function getNavLinkClass({ isActive }: { isActive: boolean }) {
  return `form__link${isActive ? ' form__link_active' : ''}`;
}

export default function AuthForm({ isRegister = false }: { isRegister?: boolean }) {
  const { values, errors, isValid, handleChange } = useFormWithValidation();
  const title = isRegister ? 'Create your account' : 'Welcome back';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting || !event.currentTarget.checkValidity()) return;
    setStatus('');
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const res = await registerUser(values.name, values.email, values.password);
        if (!res.success || !res.data) throw new Error(res.error?.message || 'Registration failed');
        navigate('/login');
      } else {
        const res = await loginUser(values.email, values.password);
        if (!res.success || !res.data) throw new Error(res.error?.message || 'Login failed');
        login(res.data.token, res.data.user);
        const from = location.state?.from;
        const destination = from?.pathname === '/chat' || from?.pathname === '/knowledge'
          ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
          : '/knowledge';
        navigate(destination, { replace: true });
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const fields = [
    ...(isRegister ? [{ name: 'name', label: 'Name', type: 'text', minLength: 2, maxLength: 40, autoComplete: 'name' }] : []),
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', minLength: 8, autoComplete: isRegister ? 'new-password' : 'current-password' },
  ];

  return (
    <>
      <header className="header">
        <Link className="header__logo" to="/" aria-label="MeshAI home">
          <img src={logo} alt="MeshAI logo" width="99" height="26" />
        </Link>
      </header>
      <main className="auth-page">
        <section className="auth-page__content" aria-labelledby="auth-title">
          <h1 className="form__title" id="auth-title">{title}</h1>
          <p className="form__description">{isRegister ? 'Join MeshAI to bring your documents and answers together.' : 'Log in to your MeshAI workspace.'}</p>
          <nav className="form__nav" aria-label="Account navigation">
            <NavLink to="/login" className={getNavLinkClass}>Login</NavLink>
            <NavLink to="/register" className={getNavLinkClass}>Register</NavLink>
          </nav>
          <form className="form" onSubmit={handleSubmit} noValidate>
            {fields.map(({ label, ...field }) => (
              <div className="form__field" key={field.name}>
                <label className="form__label" htmlFor={field.name}>{label}</label>
                <input
                  className="form__input"
                  id={field.name}
                  {...field}
                  required
                  value={values[field.name] ?? ''}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={`${field.name}-error`}
                />
                <span className="form__error" id={`${field.name}-error`} aria-live="polite">{errors[field.name]}</span>
              </div>
            ))}
            <p className="form__status" role="status" aria-live="polite">{status}</p>
            <button className="form__submit" type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Please wait…' : isRegister ? 'Register' : 'Login'}</button>
          </form>
        </section>
      </main>
    </>
  );
}
