import { InterviewSession } from '../types/interview';

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間

// ユーザー固有のストレージキーを生成
const getSessionKey = (userId: string) => `interview_${userId}_session`;
const getBackupKey = (userId: string) => `interview_${userId}_backup`;

// セッション保存の拡張版（ユーザー固有）
export const saveInterviewSession = (session: InterviewSession, userId: string): void => {
  if (!userId) {
    console.error('Cannot save session: userId is required');
    return;
  }

  try {
    const sessionWithTimestamp = {
      ...session,
      userId,
      lastUpdated: Date.now(),
      version: '3.0' // Phase 3のバージョン識別
    };
    
    const sessionKey = getSessionKey(userId);
    const backupKey = getBackupKey(userId);
    
    // メインセッションを保存
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionWithTimestamp));
    
    // バックアップも作成（データ損失防止）
    localStorage.setItem(backupKey, JSON.stringify(sessionWithTimestamp));
    
    console.log('Session saved successfully for user:', userId, sessionWithTimestamp);
  } catch (error) {
    console.error('Failed to save session:', error);
    // ストレージ容量不足の場合の処理
    if (error instanceof DOMException && error.code === 22) {
      alert('ストレージ容量が不足しています。ブラウザのキャッシュをクリアしてください。');
    }
  }
};

// セッション読み込みの拡張版（ユーザー固有）
export const loadInterviewSession = (userId: string): InterviewSession | null => {
  if (!userId) {
    console.log('Cannot load session: userId is required');
    return null;
  }

  try {
    const sessionKey = getSessionKey(userId);
    const backupKey = getBackupKey(userId);
    
    // まずセッションストレージから試行
    let saved = sessionStorage.getItem(sessionKey);
    let session = saved ? JSON.parse(saved) : null;
    
    // セッションストレージにない場合はバックアップから復元
    if (!session) {
      const backup = localStorage.getItem(backupKey);
      session = backup ? JSON.parse(backup) : null;
      
      if (session) {
        console.log('Session restored from backup for user:', userId);
        // バックアップから復元した場合はセッションストレージにも保存
        sessionStorage.setItem(sessionKey, JSON.stringify(session));
      }
    }
    
    if (session) {
      // ユーザーIDの検証
      if (session.userId && session.userId !== userId) {
        console.log('Session user mismatch, clearing session');
        clearInterviewSession(userId);
        return null;
      }
      
      // セッションの有効期限チェック
      const now = Date.now();
      const lastUpdated = session.lastUpdated || session.startTime;
      
      if (now - lastUpdated > SESSION_TIMEOUT) {
        console.log('Session expired, clearing data for user:', userId);
        clearInterviewSession(userId);
        return null;
      }
      
      // バージョン互換性チェック
      if (!session.version || session.version < '3.0') {
        console.log('Upgrading session to version 3.0 for user:', userId);
        session = upgradeSessionFormat(session, userId);
        saveInterviewSession(session, userId);
      }
      
      console.log('Session loaded successfully for user:', userId, session);
      return session;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load session for user:', userId, error);
    // 破損したセッションデータをクリア
    clearInterviewSession(userId);
    return null;
  }
};

// セッションクリアの拡張版（ユーザー固有）
export const clearInterviewSession = (userId: string): void => {
  if (!userId) {
    console.log('Cannot clear session: userId is required');
    return;
  }

  try {
    const sessionKey = getSessionKey(userId);
    const backupKey = getBackupKey(userId);
    
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(backupKey);
    
    // 旧形式のキーも削除（互換性のため）
    sessionStorage.removeItem('interviewSession');
    localStorage.removeItem('interviewSessionBackup');
    
    console.log('Session cleared successfully for user:', userId);
  } catch (error) {
    console.error('Failed to clear session for user:', userId, error);
  }
};

// 全ユーザーのセッションをクリア（緊急時用）
export const clearAllInterviewSessions = (): void => {
  try {
    // localStorage と sessionStorage の全キーをチェック
    const storages = [localStorage, sessionStorage];
    
    storages.forEach(storage => {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.includes('interview')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        storage.removeItem(key);
      });
    });
    
    console.log('All interview sessions cleared');
  } catch (error) {
    console.error('Failed to clear all sessions:', error);
  }
};

// セッション形式のアップグレード
const upgradeSessionFormat = (oldSession: any, userId: string): InterviewSession => {
  return {
    ...oldSession,
    userId,
    version: '3.0',
    lastUpdated: Date.now(),
    // 新しいフィールドのデフォルト値
    conversationQuality: 'moderate',
    coveredTopics: [],
    interviewMetrics: {
      totalResponseTime: 0,
      averageResponseLength: 0,
      deepDiveCount: 0
    }
  };
};

// セッション統計の取得（ユーザー固有）
export const getSessionStats = (userId: string): {
  hasActiveSession: boolean;
  sessionAge: number;
  questionCount: number;
  completionRate: number;
} => {
  const session = loadInterviewSession(userId);
  
  if (!session) {
    return {
      hasActiveSession: false,
      sessionAge: 0,
      questionCount: 0,
      completionRate: 0
    };
  }
  
  const now = Date.now();
  const sessionAge = now - session.startTime;
  const questionCount = session.questions.length;
  const completionRate = (questionCount / session.settings.questionCount) * 100;
  
  return {
    hasActiveSession: true,
    sessionAge,
    questionCount,
    completionRate
  };
};

// 自動保存機能（ユーザー固有）
export const enableAutoSave = (session: InterviewSession, userId: string, interval: number = 30000): () => void => {
  const autoSaveInterval = setInterval(() => {
    saveInterviewSession(session, userId);
  }, interval);
  
  // クリーンアップ関数を返す
  return () => {
    clearInterval(autoSaveInterval);
  };
};

// セッション復旧機能（ユーザー固有）
export const recoverSession = (userId: string): InterviewSession | null => {
  if (!userId) return null;
  
  try {
    const backupKey = getBackupKey(userId);
    const backup = localStorage.getItem(backupKey);
    
    if (backup) {
      const session = JSON.parse(backup);
      console.log('Attempting session recovery for user:', userId, session);
      
      // ユーザーIDの検証
      if (session.userId && session.userId !== userId) {
        console.log('Recovery failed: user mismatch');
        return null;
      }
      
      // セッションストレージに復元
      const sessionKey = getSessionKey(userId);
      sessionStorage.setItem(sessionKey, backup);
      return session;
    }
    return null;
  } catch (error) {
    console.error('Failed to recover session for user:', userId, error);
    return null;
  }
};

// ブラウザ閉じ時のクリーンアップ
export const setupBrowserCloseCleanup = (userId: string): () => void => {
  const handleBeforeUnload = () => {
    if (userId) {
      // 面接データを即座に削除
      clearInterviewSession(userId);
      console.log('Browser close detected, cleared session for user:', userId);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden && userId) {
      // ページが非表示になった時にセッションを保存
      const session = loadInterviewSession(userId);
      if (session) {
        saveInterviewSession(session, userId);
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};