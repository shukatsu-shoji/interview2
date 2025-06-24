import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
          <LoadingSpinner size="lg" message="認証状態を確認中..." />
        </div>
      </div>
    );
  }

  if (!user) {
    // ログイン後に元のページに戻るためのstate
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};