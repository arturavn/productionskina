import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Se não está autenticado, redireciona para login
      if (!isAuthenticated) {
        navigate('/auth', { replace: true });
        return;
      }

      // Se requer admin mas o usuário não é admin nem colaborador, redireciona para home
      if (requireAdmin && user?.role !== 'admin' && user?.role !== 'colaborador') {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, requireAdmin]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skina-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado ou não tem permissão, não renderiza nada
  // (o useEffect já fez o redirecionamento)
  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin' && user?.role !== 'colaborador')) {
    return null;
  }

  // Se passou por todas as verificações, renderiza o componente
  return <>{children}</>;
};

export default ProtectedRoute;