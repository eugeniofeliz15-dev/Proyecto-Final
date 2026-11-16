import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { authService } from './authService';
import {
  credentialsSchema,
  registrationSchema,
  type CredentialsForm,
  type RegistrationForm,
} from './authSchemas';
import { useAuthStore } from '../../stores/authStore';
import type { AuthResponse } from '../../types/api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

function AuthFrame({ children, mode }: AuthPageProps & { children: ReactNode }) {
  const isRegister = mode === 'register';
  return (
    <main className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <section className="max-w-xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">
          Mercado POS
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
          {isRegister ? 'Tu próxima compra empieza aquí.' : 'Qué bueno verte de nuevo.'}
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
          {isRegister
            ? 'Crea tu cuenta de cliente y descubre productos seleccionados para ti.'
            : 'Entra a tu cuenta para continuar con tu tienda y tus operaciones.'}
        </p>
        <div className="mt-8 rounded-3xl bg-ink p-6 text-white shadow-card sm:p-8">
          <p className="text-sm uppercase tracking-widest text-orange-200">Una sola plataforma</p>
          <p className="mt-3 text-2xl font-bold">Catálogo claro. Operación simple.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
        {children}
      </section>
    </main>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { execute, error } = useApi<AuthResponse>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsForm>({ resolver: zodResolver(credentialsSchema) });

  const submit = handleSubmit(async (values) => {
    const result = await execute(() => authService.login(values));
    if (!result) return;
    setSession(result.access_token, result.user);
    navigate('/', { replace: true });
  });

  return (
    <AuthFrame mode="login">
      <h2 className="text-2xl font-bold text-ink">Iniciar sesión</h2>
      <p className="mt-2 text-sm text-slate-500">Usa el correo asociado a tu cuenta.</p>
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="field"
            id="email"
            type="email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
            Contraseña
          </label>
          <input
            autoComplete="current-password"
            className="field"
            id="password"
            type="password"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button className="button-primary w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Aún no tienes cuenta?{' '}
        <Link className="font-semibold text-ink underline decoration-coral" to="/registro">
          Regístrate
        </Link>
      </p>
    </AuthFrame>
  );
}

function RegistrationForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { execute, error } = useApi<AuthResponse>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationForm>({ resolver: zodResolver(registrationSchema) });

  const submit = handleSubmit(async (values) => {
    const result = await execute(() => authService.registerCustomer(values));
    if (!result) return;
    setSession(result.access_token, result.user);
    navigate('/', { replace: true });
  });

  return (
    <AuthFrame mode="register">
      <h2 className="text-2xl font-bold text-ink">Crear cuenta de cliente</h2>
      <p className="mt-2 text-sm text-slate-500">Tu cuenta queda activa al registrarte.</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="firstName">
              Nombre
            </label>
            <input autoComplete="given-name" className="field" id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="lastName">
              Apellido
            </label>
            <input autoComplete="family-name" className="field" id="lastName" {...register('lastName')} />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="registerEmail">
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="field"
            id="registerEmail"
            type="email"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="registerPassword">
            Contraseña
          </label>
          <input
            autoComplete="new-password"
            className="field"
            id="registerPassword"
            type="password"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="phone">
            Teléfono <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input autoComplete="tel" className="field" id="phone" type="tel" {...register('phone')} />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <button className="button-primary w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-ink underline decoration-coral" to="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthFrame>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  return mode === 'register' ? <RegistrationForm /> : <LoginForm />;
}
