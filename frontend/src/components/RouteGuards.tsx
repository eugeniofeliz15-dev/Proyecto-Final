import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/api';

interface RoleGuardProps {
  allowed: UserRole[];
}

export function AuthGuard() {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate replace to="/login" />;
}

export function RoleGuard({ allowed }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate replace to="/login" />;
  return allowed.includes(user.role) ? <Outlet /> : <Navigate replace to="/" />;
}
