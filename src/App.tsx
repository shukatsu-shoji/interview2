import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from './components/screens/HomeScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { InterviewScreen } from './components/screens/InterviewScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { SignupScreen } from './components/screens/SignupScreen';
import { ResetPasswordScreen } from './components/screens/ResetPasswordScreen';
import { UserDashboardScreen } from './components/screens/UserDashboardScreen';
import { DebugScreen } from './components/screens/DebugScreen';
import { AdminStatsScreen } from './components/screens/AdminStatsScreen';
import { TermsScreen } from './components/screens/TermsScreen';
import { PrivacyScreen } from './components/screens/PrivacyScreen';
import { AuthCallback } from './components/AuthCallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ProductionChecklist } from './components/ProductionChecklist';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Screen, InterviewSettings, InterviewQuestion, InterviewSession } from './types/interview';
import { saveInterviewSession, loadInterviewSession, clearInterviewSession, enableAutoSave } from './services/sessionManager';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [interviewSettings, setInterviewSettings] = useState<InterviewSettings | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const { user, loading } = useAuth();

  // Load session on mount with enhanced recovery
  useEffect(() => {
    if (user && !loading) {
      const savedSession = loadInterviewSession();
      if (savedSession) {
        console.log('Recovering session:', savedSession);
        setCurrentScreen('interview');
        setInterviewSettings(savedSession.settings);
        setInterviewQuestions(savedSession.questions);
        setSessionRecovered(true);
        
        // Show recovery notification
        setTimeout(() => {
          alert('前回の面接セッションを復元しました。続きから始められます。');
        }, 1000);
      }
    }
  }, [user, loading]);

  // Enhanced session saving with auto-save
  useEffect(() => {
    if (currentScreen === 'interview' && interviewSettings && user) {
      const session: InterviewSession = {
        settings: interviewSettings,
        questions: interviewQuestions,
        currentQuestionIndex: interviewQuestions.length - 1,
        isCompleted: false,
        startTime: interviewQuestions[0]?.timestamp || Date.now(),
        lastUpdated: Date.now(),
        version: '3.0' // Phase 3 version
      };
      
      saveInterviewSession(session);
      
      // Enable auto-save every 30 seconds
      const cleanup = enableAutoSave(session, 30000);
      
      return cleanup;
    }
  }, [currentScreen, interviewSettings, interviewQuestions, user]);

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentScreen === 'interview' && interviewQuestions.length > 0) {
        e.preventDefault();
        e.returnValue = '面接が進行中です。ページを離れると進行状況が失われる可能性があります。';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentScreen, interviewQuestions.length]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentScreen === 'interview' && user) {
        // Save session when tab becomes hidden
        if (interviewSettings) {
          const session: InterviewSession = {
            settings: interviewSettings,
            questions: interviewQuestions,
            currentQuestionIndex: interviewQuestions.length - 1,
            isCompleted: false,
            startTime: interviewQuestions[0]?.timestamp || Date.now(),
            lastUpdated: Date.now(),
            version: '3.0'
          };
          saveInterviewSession(session);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentScreen, interviewSettings, interviewQuestions, user]);

  const handleStartInterview = () => {
    setCurrentScreen('setup');
  };

  const handleBackToHome = () => {
    // Confirm if interview is in progress
    if (currentScreen === 'interview' && interviewQuestions.length > 0) {
      const confirmed = window.confirm(
        '面接が進行中です。ホームに戻ると進行状況が失われます。よろしいですか？'
      );
      if (!confirmed) return;
    }
    
    clearInterviewSession();
    setCurrentScreen('home');
    setInterviewSettings(null);
    setInterviewQuestions([]);
    setSessionRecovered(false);
  };

  const handleStartInterviewWithSettings = (settings: InterviewSettings) => {
    setInterviewSettings(settings);
    setInterviewQuestions([]);
    setCurrentScreen('interview');
    setSessionRecovered(false);
  };

  const handleInterviewComplete = (questions: InterviewQuestion[]) => {
    setInterviewQuestions(questions);
    clearInterviewSession();
    setCurrentScreen('result');
  };

  const handleNewInterview = () => {
    clearInterviewSession();
    setCurrentScreen('home');
    setInterviewSettings(null);
    setInterviewQuestions([]);
    setSessionRecovered(false);
  };

  return (
    <div className="App">
      {user && <Header />}
      
      {currentScreen === 'home' && (
        <HomeScreen onStartInterview={handleStartInterview} />
      )}
      
      {currentScreen === 'setup' && (
        <SetupScreen 
          onBack={handleBackToHome}
          onStartInterview={handleStartInterviewWithSettings}
        />
      )}
      
      {currentScreen === 'interview' && interviewSettings && (
        <InterviewScreen
          settings={interviewSettings}
          onBack={handleBackToHome}
          onComplete={handleInterviewComplete}
        />
      )}
      
      {currentScreen === 'result' && interviewSettings && (
        <ResultScreen
          settings={interviewSettings}
          questions={interviewQuestions}
          onNewInterview={handleNewInterview}
        />
      )}
      
      <PerformanceMonitor />
      <ProductionChecklist />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col">
          <Router>
            <main className="flex-grow">
              <Routes>
                {/* 認証不要な画面 */}
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/signup" element={<SignupScreen />} />
                <Route path="/reset-password" element={<ResetPasswordScreen />} />
                <Route path="/terms" element={<TermsScreen />} />
                <Route path="/privacy" element={<PrivacyScreen />} />
                
                {/* 認証コールバック */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* 開発環境のみ：デバッグ画面 */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Route path="/debug" element={<DebugScreen />} />
                    <Route path="/admin/stats" element={<AdminStatsScreen />} />
                  </>
                )}
                
                {/* 認証が必要な画面 */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserDashboardScreen />
                  </ProtectedRoute>
                } />
                
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppContent />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </Router>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;