import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Square, Clock, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { InterviewSettings, InterviewQuestion, InterviewMetrics } from '../../types/interview';
import { generateQuestion } from '../../services/geminiAPI';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useNotification } from '../NotificationSystem';
import { LoadingSpinner } from '../LoadingSpinner';
import { VoiceInputButton } from '../VoiceInputButton';
import { usePerformanceTracking } from '../PerformanceMonitor';
import { useUsageTracking } from '../../hooks/useUsageTracking';

interface InterviewScreenProps {
  settings: InterviewSettings;
  onBack: () => void;
  onComplete: (questions: InterviewQuestion[]) => void;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({
  settings,
  onBack,
  onComplete
}) => {
  usePerformanceTracking('InterviewScreen');
  
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firstQuestionShown, setFirstQuestionShown] = useState(false);
  const [interviewMetrics, setInterviewMetrics] = useState<InterviewMetrics>({
    totalResponseTime: 0,
    averageResponseLength: 0,
    deepDiveCount: 0,
    topicCoverage: [],
    conversationFlow: 'linear'
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showNotification } = useNotification();
  const { recordUsage } = useUsageTracking();
  
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    isSupported,
    confidence,
    error: speechError,
    permissionStatus,
    checkPermission,
    requestPermission
  } = useSpeechRecognition();

  // 利用回数記録（1問目が表示された時）
  useEffect(() => {
    if (questions.length > 0 && !firstQuestionShown) {
      recordUsage(settings);
      setFirstQuestionShown(true);
    }
  }, [questions.length, firstQuestionShown, recordUsage, settings]);

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification({
        type: 'success',
        title: 'インターネット接続が復旧しました',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification({
        type: 'warning',
        title: 'インターネット接続が切断されました',
        message: '面接を続行できますが、新しい質問の生成ができません。',
        persistent: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  // 音声認識エラーの通知
  useEffect(() => {
    if (speechError) {
      showNotification({
        type: 'error',
        title: '音声認識エラー',
        message: speechError,
        duration: 5000
      });
    }
  }, [speechError, showNotification]);

  // マイク許可状態の初期チェック
  useEffect(() => {
    if (isSupported) {
      checkPermission();
    }
  }, [isSupported, checkPermission]);

  // Initialize first question
  useEffect(() => {
    loadFirstQuestion();
  }, []);

  // Update answer with speech transcript - 改善版
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setCurrentAnswer(prev => {
        const separator = prev.trim() ? ' ' : '';
        const newValue = prev + separator + transcript.trim();
        
        // 音声認識の信頼度が低い場合は通知
        if (confidence > 0 && confidence < 0.7) {
          showNotification({
            type: 'warning',
            title: '音声認識の精度が低い可能性があります',
            message: '内容を確認してから送信してください。',
            duration: 3000
          });
        }
        
        return newValue;
      });
      
      clearTranscript();
    }
  }, [transcript, clearTranscript, confidence, showNotification]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentAnswer]);

  const loadFirstQuestion = async () => {
    setIsLoadingQuestion(true);
    setQuestionStartTime(Date.now());
    
    try {
      const question = await generateQuestion(
        settings.industry,
        settings.interviewType,
        settings.questionCount,
        []
      );

      const newQuestion: InterviewQuestion = {
        id: 1,
        question,
        answer: '',
        timestamp: Date.now(),
        questionType: 'introduction',
        deepDiveLevel: 1
      };

      setQuestions([newQuestion]);
      
      showNotification({
        type: 'success',
        title: '面接を開始しました',
        message: 'リラックスして、自然にお答えください。',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to load first question:', error);
      showNotification({
        type: 'error',
        title: '質問の読み込みに失敗しました',
        message: 'ネットワーク接続を確認して、もう一度お試しください。',
        persistent: true
      });
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const analyzeQuestionType = (question: string): InterviewQuestion['questionType'] => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('自己紹介') || lowerQuestion.includes('お名前')) {
      return 'introduction';
    } else if (lowerQuestion.includes('志望') || lowerQuestion.includes('理由')) {
      return 'motivation';
    } else if (lowerQuestion.includes('学生時代') || lowerQuestion.includes('力を入れ')) {
      return 'experience';
    } else if (lowerQuestion.includes('性格') || lowerQuestion.includes('長所') || lowerQuestion.includes('短所')) {
      return 'personality';
    } else if (lowerQuestion.includes('挑戦') || lowerQuestion.includes('困難')) {
      return 'challenge';
    }
    
    return 'other';
  };

  const calculateDeepDiveLevel = (question: string, conversationHistory: Array<{question: string; answer: string}>): number => {
    const deepDiveKeywords = ['具体的', 'どのよう', 'なぜ', 'どうして', '詳しく', 'もう少し'];
    const keywordCount = deepDiveKeywords.filter(keyword => question.includes(keyword)).length;
    
    const recentQuestions = conversationHistory.slice(-3);
    const topicContinuity = recentQuestions.filter(qa => 
      qa.question.includes('先ほど') || qa.question.includes('さっき')
    ).length;
    
    return Math.min(3, Math.max(1, keywordCount + topicContinuity));
  };

  const updateMetrics = (responseTime: number, answerLength: number, questionType: InterviewQuestion['questionType']) => {
    setInterviewMetrics(prev => {
      const newTotalTime = prev.totalResponseTime + responseTime;
      const newQuestionCount = questions.length + 1;
      const newAverageLength = ((prev.averageResponseLength * questions.length) + answerLength) / newQuestionCount;
      const newDeepDiveCount = prev.deepDiveCount + (questionType !== 'introduction' ? 1 : 0);
      
      const topicCoverage = [...(prev.topicCoverage || [])];
      if (questionType && !topicCoverage.includes(questionType)) {
        topicCoverage.push(questionType);
      }
      
      return {
        totalResponseTime: newTotalTime,
        averageResponseLength: newAverageLength,
        deepDiveCount: newDeepDiveCount,
        topicCoverage,
        conversationFlow: newDeepDiveCount > newQuestionCount * 0.6 ? 'exploratory' : 'linear'
      };
    });
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      showNotification({
        type: 'warning',
        title: '回答を入力してください',
        message: '空の回答は送信できません。',
        duration: 3000
      });
      return;
    }

    if (!isOnline) {
      showNotification({
        type: 'error',
        title: 'オフラインです',
        message: 'インターネット接続を確認してください。',
        duration: 5000
      });
      return;
    }

    // 音声認識中の場合は停止
    if (isListening) {
      stopListening();
    }

    setIsSubmittingAnswer(true);
    
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentQuestion = questions[questions.length - 1];
    
    const updatedQuestion: InterviewQuestion = {
      ...currentQuestion,
      answer: currentAnswer.trim(),
      responseTime,
      questionType: analyzeQuestionType(currentQuestion.question)
    };
    
    const updatedQuestions = [...questions.slice(0, -1), updatedQuestion];
    setQuestions(updatedQuestions);
    
    updateMetrics(responseTime, currentAnswer.trim().length, updatedQuestion.questionType || 'other');

    // Check if interview is complete
    if (updatedQuestions.length >= settings.questionCount) {
      showNotification({
        type: 'success',
        title: '面接が完了しました',
        message: '結果画面で振り返りを行いましょう。',
        duration: 3000
      });
      onComplete(updatedQuestions);
      return;
    }

    // Generate next question
    try {
      const conversationHistory = updatedQuestions.map(q => ({
        question: q.question,
        answer: q.answer
      }));

      const nextQuestion = await generateQuestion(
        settings.industry,
        settings.interviewType,
        settings.questionCount,
        conversationHistory
      );

      const newQuestion: InterviewQuestion = {
        id: updatedQuestions.length + 1,
        question: nextQuestion,
        answer: '',
        timestamp: Date.now(),
        questionType: analyzeQuestionType(nextQuestion),
        deepDiveLevel: calculateDeepDiveLevel(nextQuestion, conversationHistory)
      };

      setQuestions([...updatedQuestions, newQuestion]);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
      
      // 質問タイプに応じた通知
      if (newQuestion.deepDiveLevel && newQuestion.deepDiveLevel > 2) {
        showNotification({
          type: 'info',
          title: '深掘り質問です',
          message: 'より具体的で詳細な回答を心がけましょう。',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to generate next question:', error);
      showNotification({
        type: 'error',
        title: '次の質問の生成に失敗しました',
        message: 'ネットワーク接続を確認して、もう一度お試しください。',
        persistent: true
      });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleEndInterview = () => {
    // 音声認識中の場合は停止
    if (isListening) {
      stopListening();
    }

    const confirmMessage = questions.length > 0 
      ? '面接を終了しますか？現在の回答も結果に含まれます。'
      : '面接を終了してホームに戻りますか？';
      
    if (window.confirm(confirmMessage)) {
      if (questions.length > 0) {
        const finalQuestions = questions.map(q => 
          q.id === questions.length && currentAnswer.trim()
            ? { ...q, answer: currentAnswer.trim() }
            : q
        ).filter(q => q.answer.trim());
        
        onComplete(finalQuestions);
      } else {
        onBack();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const currentQuestion = questions[questions.length - 1];
  const progress = (questions.filter(q => q.answer).length / settings.questionCount) * 100;
  const elapsedTime = Math.floor((Date.now() - (questions[0]?.timestamp || Date.now())) / 1000 / 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Connection Status */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="text-sm text-gray-600">
                {settings.industry} - {settings.interviewType}
              </span>
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="text-sm font-medium text-gray-900">
              質問 {questions.filter(q => q.answer).length + 1} / {settings.questionCount}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {elapsedTime}分経過
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                深掘り: {interviewMetrics.deepDiveCount}回
              </div>
            </div>
          </div>

          <button
            onClick={handleEndInterview}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors"
          >
            <Square className="w-5 h-5 mr-2" />
            終了
          </button>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>開始</span>
            <span>{Math.round(progress)}% 完了</span>
            <span>終了</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Enhanced Question Display */}
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-yellow-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4 shadow-sm">
                <span className="text-white font-semibold text-sm">AI</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">面接官</h3>
                  {currentQuestion && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        {currentQuestion.questionType === 'introduction' ? '自己紹介' :
                         currentQuestion.questionType === 'motivation' ? '志望動機' :
                         currentQuestion.questionType === 'experience' ? '経験' :
                         currentQuestion.questionType === 'personality' ? '人柄' :
                         currentQuestion.questionType === 'challenge' ? '挑戦' : 'その他'}
                      </span>
                      {currentQuestion.deepDiveLevel && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          深掘りLv.{currentQuestion.deepDiveLevel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isLoadingQuestion ? (
                  <LoadingSpinner size="sm" message="質問を準備中..." />
                ) : currentQuestion ? (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.question}
                  </p>
                ) : (
                  <p className="text-gray-500">質問の読み込みに失敗しました。</p>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Answer Input */}
          {!isLoadingQuestion && currentQuestion && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの回答</h3>
              
              {/* Text Input */}
              <div className="mb-4">
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="こちらに回答を入力してください..."
                  className="w-full min-h-32 max-h-48 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  disabled={isSubmittingAnswer}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{currentAnswer.length} 文字</span>
                  <span>Enter で送信 (Shift+Enter で改行)</span>
                </div>
              </div>

              {/* Enhanced Voice Input & Submit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <VoiceInputButton
                    isListening={isListening}
                    isSupported={isSupported}
                    error={speechError}
                    permissionStatus={permissionStatus}
                    confidence={confidence}
                    onStartListening={startListening}
                    onStopListening={stopListening}
                    onRequestPermission={requestPermission}
                    disabled={isSubmittingAnswer}
                  />
                  
                  {isListening && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <span className="text-sm">録音中...</span>
                      {confidence > 0 && (
                        <span className="text-xs text-gray-500">
                          信頼度: {Math.round(confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isSubmittingAnswer || !isOnline}
                  className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmittingAnswer ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>送信中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>回答する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};