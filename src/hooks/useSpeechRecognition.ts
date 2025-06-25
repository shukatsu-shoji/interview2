import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
  confidence: number;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ブラウザサポートの確認を改善
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = useCallback(() => {
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

    try {
      // SpeechRecognitionの初期化
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      // 設定の最適化
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // より積極的な音声検出
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
        let interimTranscript = '';
        
        // 結果の処理を改善
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptText;
            setConfidence(result[0].confidence || 0.8);
            console.log('確定テキスト:', transcriptText);
          } else {
            interimTranscript += transcriptText;
            console.log('暫定テキスト:', transcriptText);
          }
        }
        
        // 確定したテキストのみを追加
        if (finalTranscript.trim()) {
          setTranscript(prev => {
            const newText = prev + (prev ? ' ' : '') + finalTranscript.trim();
            console.log('更新されたテキスト:', newText);
            return newText;
          });
        }
        
        // 自動停止タイマーをリセット
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            console.log('無音により自動停止');
            recognitionRef.current.stop();
          }
        }, 5000); // 5秒間無音で自動停止
      };
      
      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        setIsListening(false);
        
        let errorMessage = '音声認識でエラーが発生しました。';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '音声が検出されませんでした。マイクに向かって話してください。';
            break;
          case 'audio-capture':
            errorMessage = 'マイクにアクセスできません。マイクが接続されているか確認してください。';
            break;
          case 'not-allowed':
            errorMessage = 'マイクの使用が許可されていません。ブラウザの設定でマイクアクセスを許可してください。';
            break;
          case 'network':
            errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
            break;
          case 'service-not-allowed':
            errorMessage = '音声認識サービスが利用できません。しばらく時間をおいてから再度お試しください。';
            break;
          case 'bad-grammar':
            errorMessage = '音声認識の設定に問題があります。ページを再読み込みしてください。';
            break;
          case 'language-not-supported':
            errorMessage = '日本語の音声認識がサポートされていません。';
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
      
      // マイクアクセス許可の確認
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('マイクアクセス許可済み');
            recognition.start();
          })
          .catch((err) => {
            console.error('マイクアクセス拒否:', err);
            setError('マイクへのアクセスが拒否されました。ブラウザの設定でマイクアクセスを許可してください。');
            setIsListening(false);
          });
      } else {
        // フォールバック: 直接開始
        recognition.start();
      }
      
    } catch (error) {
      console.error('音声認識の初期化に失敗:', error);
      setError('音声認識の初期化に失敗しました。ブラウザを再起動してお試しください。');
      setIsListening(false);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    console.log('音声認識停止要求');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    console.log('テキストクリア');
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // クリーンアップの改善
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
    };
  }, []);

  // ページの可視性変更時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        console.log('ページが非表示になったため音声認識を停止');
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
    error
  };
};

// グローバル型定義の拡張
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}