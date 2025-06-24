import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
  confidence: number;
  error: string | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ブラウザサポートの確認
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  // Permissions APIでマイク許可状態を監視
  useEffect(() => {
    if (!isSupported) return;

    const checkPermissionStatus = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(permission.state as any);
          
          // 許可状態の変更を監視
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state as any);
          });
        }
      } catch (error) {
        console.log('Permissions API not supported');
      }
    };

    checkPermissionStatus();
  }, [isSupported]);

  // マイク許可状態をチェック
  const checkPermission = useCallback(async () => {
    if (!isSupported) return;

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permission.state as any);
      } else {
        // Permissions APIが利用できない場合はgetUserMediaで確認
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionStatus('granted');
        } catch (error) {
          setPermissionStatus('denied');
        }
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionStatus('unknown');
    }
  }, [isSupported]);

  // マイク許可を明示的に要求
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('お使いのブラウザは音声認識をサポートしていません。');
      return false;
    }

    try {
      // 既存のストリームがあれば停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setPermissionStatus('granted');
      setError(null);
      
      // テスト用にすぐにストリームを停止
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }, 100);
      
      return true;
    } catch (error: any) {
      console.error('Microphone permission denied:', error);
      setPermissionStatus('denied');
      
      let errorMessage = 'マイクへのアクセスが拒否されました。';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'マイクの使用が許可されていません。ブラウザの設定でマイクアクセスを許可してください。';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'マイクが見つかりません。マイクが接続されているか確認してください。';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'マイクが他のアプリケーションで使用中です。他のアプリを閉じてから再度お試しください。';
      }
      
      setError(errorMessage);
      return false;
    }
  }, [isSupported]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('お使いのブラウザは音声認識をサポートしていません。Chrome、Edge、Safariをお試しください。');
      return;
    }

    // 既に録音中の場合は停止
    if (isListening) {
      stopListening();
      return;
    }

    setError(null);

    // マイク許可を確認・要求
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      // 最適化された設定
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // Chrome固有の設定
      if ('webkitSpeechRecognition' in window) {
        recognition.webkitServiceType = 'search';
      }
      
      recognition.onstart = () => {
        console.log('音声認識開始');
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptText;
            setConfidence(result[0].confidence || 0.8);
          }
        }
        
        if (finalTranscript.trim()) {
          setTranscript(prev => {
            const newText = prev + (prev ? ' ' : '') + finalTranscript.trim();
            return newText;
          });
        }
        
        // 自動停止タイマーをリセット
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 5000);
      };
      
      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        setIsListening(false);
        
        let errorMessage = '音声認識でエラーが発生しました。';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '音声が検出されませんでした。マイクに向かってはっきりと話してください。';
            break;
          case 'audio-capture':
            errorMessage = 'マイクにアクセスできません。マイクが正しく接続されているか確認してください。';
            break;
          case 'not-allowed':
            errorMessage = 'マイクの使用が許可されていません。';
            setPermissionStatus('denied');
            break;
          case 'network':
            errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
            break;
          case 'service-not-allowed':
            errorMessage = '音声認識サービスが利用できません。しばらく時間をおいてから再度お試しください。';
            break;
          default:
            errorMessage = `音声認識エラー: ${event.error}`;
        }
        
        setError(errorMessage);
      };
      
      recognition.onend = () => {
        console.log('音声認識終了');
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('音声認識の初期化に失敗:', error);
      setError('音声認識の初期化に失敗しました。ブラウザを再起動してお試しください。');
      setIsListening(false);
    }
  }, [isSupported, isListening, requestPermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
    }
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('音声認識停止エラー:', error);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ページの可視性変更時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        stopListening();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isListening, stopListening]);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
    confidence,
    error,
    permissionStatus,
    checkPermission,
    requestPermission
  };
};

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}