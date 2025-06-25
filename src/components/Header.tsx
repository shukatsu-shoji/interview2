import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, BarChart3, Home, AlertTriangle } from 'lucide-react';
import { useAuth, authHelpers, checkInterviewState } from '../hooks/useAuth';
import { useNotification } from './NotificationSystem';

// ログアウト確認ダイアログコンポーネント
interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">面接を終了しますか？</h3>
        </div>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          ログアウトすると進行中の面接が終了し、データが失われます。<br />
          この操作は取り消すことができません。
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    // 面接状態をチェック
    const hasActiveInterview = user ? checkInterviewState(user.id) : false;
    
    if (hasActiveInterview) {
      // 面接中の場合は確認ダイアログを表示
      setShowLogoutDialog(true);
      return;
    }
    
    // 面接中でない場合は直接ログアウト
    await performLogout();
  };

  const performLogout = async () => {
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
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const handleLogoutConfirm = () => {
    performLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
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
    <>
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

      {/* ログアウト確認ダイアログ */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
};