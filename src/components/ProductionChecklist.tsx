import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, ExternalLink } from 'lucide-react';

interface CheckItem {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  action?: string;
  link?: string;
}

export const ProductionChecklist: React.FC = () => {
  const [checks, setChecks] = useState<CheckItem[]>([]);

  useEffect(() => {
    performChecks();
  }, []);

  const performChecks = () => {
    const checkResults: CheckItem[] = [
      // 環境変数チェック
      {
        id: 'env-vars',
        title: 'Supabase環境変数',
        description: 'VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY が設定されているか',
        status: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
        action: '環境変数を設定してください'
      },
      
      // URL形式チェック
      {
        id: 'supabase-url',
        title: 'Supabase URL形式',
        description: 'Supabase URLが正しい形式かチェック',
        status: import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co') ? 'success' : 'warning',
        action: 'Supabase URLを確認してください'
      },
      
      // 開発環境URL検出
      {
        id: 'dev-url-check',
        title: '開発環境URL検出',
        description: '本番環境で開発用URLが使用されていないかチェック',
        status: process.env.NODE_ENV === 'production' && 
                (import.meta.env.VITE_SUPABASE_URL?.includes('localhost') || 
                 import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1')) ? 'error' : 'success',
        action: '本番用Supabase URLに変更してください'
      },
      
      // SSL/HTTPS チェック
      {
        id: 'https-check',
        title: 'HTTPS接続',
        description: '本番環境でHTTPS接続が使用されているか',
        status: process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:' ? 'error' : 'success',
        action: 'HTTPS接続を設定してください'
      },
      
      // メール認証設定
      {
        id: 'email-confirmation',
        title: 'メール認証設定',
        description: 'Supabaseでメール認証が有効になっているか（手動確認必要）',
        status: 'pending',
        action: 'Supabaseダッシュボードで確認してください',
        link: 'https://supabase.com/dashboard'
      },
      
      // RLS設定
      {
        id: 'rls-policies',
        title: 'RLSポリシー',
        description: 'Row Level Securityが適切に設定されているか（手動確認必要）',
        status: 'pending',
        action: 'データベースのRLSポリシーを確認してください',
        link: 'https://supabase.com/dashboard'
      },
      
      // ドメイン設定
      {
        id: 'domain-setup',
        title: '独自ドメイン',
        description: '独自ドメインが設定されているか',
        status: window.location.hostname.includes('localhost') || 
                window.location.hostname.includes('127.0.0.1') ||
                window.location.hostname.includes('webcontainer') ? 'warning' : 'success',
        action: '独自ドメインを設定してください'
      }
    ];

    setChecks(checkResults);
  };

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: CheckItem['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const pendingCount = checks.filter(c => c.status === 'pending').length;

  // 本番環境チェックリストを無効化
  return null;

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-md">
        <h3 className="font-semibold text-gray-900 mb-3">本番環境チェックリスト</h3>
        
        <div className="mb-4 text-sm">
          <span className="text-red-600">エラー: {errorCount}</span>
          <span className="text-yellow-600 ml-3">警告: {warningCount}</span>
          <span className="text-blue-600 ml-3">要確認: {pendingCount}</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start space-x-2">
                {getStatusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{check.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{check.description}</p>
                  {(check.status === 'error' || check.status === 'warning' || check.status === 'pending') && check.action && (
                    <div className="mt-2 flex items-center space-x-2">
                      <p className="text-xs text-gray-700">{check.action}</p>
                      {check.link && (
                        <a
                          href={check.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            このチェックリストは開発環境でのみ表示されます
          </p>
        </div>
      </div>
    </div>
  );
};