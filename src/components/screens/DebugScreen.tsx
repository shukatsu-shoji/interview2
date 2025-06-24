import React, { useState } from 'react';
import { debugSupabaseConnection } from '../../utils/supabaseDebug';
import { supabase } from '../../lib/supabase';

export const DebugScreen: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    
    // コンソールログをキャプチャ
    const originalLog = console.log;
    const originalError = console.error;
    let logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(`LOG: ${args.join(' ')}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };
    
    try {
      await debugSupabaseConnection();
      
      // 追加のテスト
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        logs.push(`Current User ID: ${user.id}`);
        logs.push(`Current User Email: ${user.email}`);
        logs.push(`Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        logs.push(`Created At: ${user.created_at}`);
      }
      
    } catch (error) {
      logs.push(`Debug Error: ${error}`);
    }
    
    // コンソールログを復元
    console.log = originalLog;
    console.error = originalError;
    
    setDebugInfo(logs.join('\n'));
    setLoading(false);
  };

  const testSignup = async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      console.log('Test Signup Result:', { data, error });
      setDebugInfo(prev => prev + `\n\nTest Signup: ${testEmail}\nResult: ${JSON.stringify({ data, error }, null, 2)}`);
    } catch (error) {
      console.error('Test Signup Error:', error);
      setDebugInfo(prev => prev + `\n\nTest Signup Error: ${error}`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-4">
        <p>Debug screen is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supabase Debug Screen</h1>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={runDebug}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running Debug...' : 'Run Debug'}
            </button>
            
            <button
              onClick={testSignup}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Signup
            </button>
          </div>
          
          {debugInfo && (
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {debugInfo}
            </div>
          )}
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">チェックポイント</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Supabase URL と Anon Key が正しく設定されているか</li>
              <li>Supabaseプロジェクトの Authentication が有効になっているか</li>
              <li>Email confirmation が無効になっているか（開発時）</li>
              <li>RLS (Row Level Security) が正しく設定されているか</li>
              <li>ユーザーが実際に作成されているか（Authentication &gt; Users）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};