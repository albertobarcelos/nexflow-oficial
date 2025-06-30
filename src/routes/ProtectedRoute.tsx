import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; 
import CRMLayout from '@/layouts/CRMLayout';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    // Você pode renderizar um spinner/tela de carregamento aqui enquanto a autenticação é verificada
    return <div>Carregando...</div>;
  }

  if (!user) {
    // Se não houver usuário, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se o usuário estiver autenticado, renderiza o layout principal do CRM
  // que por sua vez renderizará as páginas filhas (aninhadas).
  return (
    <CRMLayout>
      <Outlet />
    </CRMLayout>
  );
} 