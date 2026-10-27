import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { LayoutContext } from '../../hooks/useAppLayout';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const location = useLocation();
  if (isLoading) return null;
  return isAuthenticated ? <Outlet context={context} /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const destination = from?.pathname === '/chat' || from?.pathname === '/knowledge'
    ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    : '/knowledge';
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to={destination} replace /> : <Outlet />;
}
