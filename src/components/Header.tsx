import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, Home } from 'lucide-react';
import { useAuth, authHelpers } from '../hooks/useAuth';
import { useNotification } from './NotificationSystem';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleLogout = async () => {
    try {
      const { error } = await authHelpers.signOut();
      if (error) {
        showNotification({
          type: 'error',
          title: 'ログアウトに失敗しました',
          message: error.message,
          duration: 5000
        });
      } else {
        showNotification({
          type: 'success',
          title: 'ログアウトしました',
          duration: 3000
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showNotification({
        type: 'error',
        title: 'ログアウト中にエラーが発生しました',
        duration: 5000
      });
    }
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleHome = () => {
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <button
              onClick={handleHome}
              className="text-xl font-semibold text-gray-900 hover:text-yellow-600 transition-colors"
            >
              就活商事　模擬面接
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDashboard}
              className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">ダッシュボード</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};