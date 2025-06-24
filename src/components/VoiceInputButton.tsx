import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, Settings, Volume2 } from 'lucide-react';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  confidence: number;
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  onRequestPermission: () => Promise<boolean>;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  isSupported,
  error,
  permissionStatus,
  confidence,
  onStartListening,
  onStopListening,
  onRequestPermission,
  disabled = false
}) => {
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // エラー時に自動でガイドを表示
  useEffect(() => {
    if (error && permissionStatus === 'denied') {
      setShowPermissionGuide(true);
    }
  }, [error, permissionStatus]);

  const handleVoiceInput = async () => {
    if (!isSupported) {
      setShowPermissionGuide(true);
      return;
    }

    if (permissionStatus === 'denied') {
      setShowPermissionGuide(true);
      return;
    }

    if (isListening) {
      onStopListening();
    } else {
      await onStartListening();
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setShowPermissionGuide(false);
    
    try {
      const success = await onRequestPermission();
      if (success) {
        await onStartListening();
      } else {
        setShowPermissionGuide(true);
      }
    } catch (error) {
      setShowPermissionGuide(true);
    } finally {
      setIsRetrying(false);
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return {
        browser: 'Chrome',
        steps: [
          'アドレスバー左側の🔒または🛡️アイコンをクリック',
          '「マイク」を「許可」に変更',
          'ページを再読み込み'
        ]
      };
    } else if (userAgent.includes('Firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'アドレスバー左側の🔒アイコンをクリック',
          '「マイクロフォン」の権限を「許可」に変更',
          'ページを再読み込み'
        ]
      };
    } else if (userAgent.includes('Safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Safari > 設定 > Webサイト > マイクロフォン',
          'このサイトを「許可」に設定',
          'ページを再読み込み'
        ]
      };
    } else if (userAgent.includes('Edge')) {
      return {
        browser: 'Edge',
        steps: [
          'アドレスバー左側の🔒アイコンをクリック',
          '「マイク」を「許可」に変更',
          'ページを再読み込み'
        ]
      };
    }
    
    return {
      browser: 'ブラウザ',
      steps: [
        'ブラウザの設定でマイクアクセスを許可',
        'ページを再読み込み'
      ]
    };
  };

  const getButtonStyle = () => {
    if (disabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    if (!isSupported) {
      return 'bg-gray-300 text-gray-600 cursor-not-allowed';
    }
    
    if (permissionStatus === 'denied') {
      return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300';
    }
    
    if (isListening) {
      return 'bg-red-100 text-red-700 hover:bg-red-200 shadow-lg animate-pulse';
    }
    
    return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
  };

  const instructions = getBrowserInstructions();

  return (
    <div className="relative">
      {/* メインボタン */}
      <button
        onClick={handleVoiceInput}
        disabled={disabled || (!isSupported && permissionStatus !== 'granted')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all border-2 ${getButtonStyle()}`}
        title={
          !isSupported 
            ? '音声入力はサポートされていません' 
            : permissionStatus === 'denied'
            ? 'マイクアクセスが拒否されています'
            : isListening 
            ? '録音を停止' 
            : '音声入力を開始'
        }
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span>録音停止</span>
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-red-500 animate-pulse"></div>
              <div className="w-1 h-3 bg-red-400 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2 bg-red-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </>
        ) : (
          <>
            {permissionStatus === 'denied' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span>
              {permissionStatus === 'denied' ? '許可が必要' : '音声入力'}
            </span>
          </>
        )}
      </button>

      {/* 録音中の視覚的フィードバック */}
      {isListening && (
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full"></div>
        </div>
      )}

      {/* 信頼度表示 */}
      {isListening && confidence > 0 && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <div className="text-xs text-gray-500">
            認識精度: {Math.round(confidence * 100)}%
          </div>
        </div>
      )}

      {/* 許可ガイドモーダル */}
      {showPermissionGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  マイクアクセスの許可
                </h3>
                <p className="text-sm text-gray-600">
                  音声入力を使用するには許可が必要です
                </p>
              </div>
            </div>

            {!isSupported ? (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">
                        ブラウザが対応していません
                      </h4>
                      <p className="text-sm text-yellow-700">
                        音声入力機能を使用するには、以下のブラウザをお使いください：
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Google Chrome（推奨）</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Microsoft Edge</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Safari（Mac）</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  {instructions.browser}での設定手順：
                </h4>
                <ol className="space-y-2">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>

                {permissionStatus === 'denied' && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
                      <p className="text-sm text-red-700">
                        現在マイクアクセスが拒否されています。上記の手順で許可に変更してください。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              {isSupported && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex-1"
                >
                  {isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>確認中...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>再試行</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 音声入力を使わずに、キーボードでの入力も可能です
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};