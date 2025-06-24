import { InterviewSession } from '../types/interview';

const SESSION_KEY = 'interviewSession';
const BACKUP_KEY = 'interviewSessionBackup';
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間

// セッション保存の拡張版
export const saveInterviewSession = (session: InterviewSession): void => {
  try {
    const sessionWithTimestamp = {
      ...session,
      lastUpdated: Date.now(),
      version: '2.0' // Phase 2のバージョン識別
    };
    
    // メインセッションを保存
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionWithTimestamp));
    
    // バックアップも作成（データ損失防止）
    localStorage.setItem(BACKUP_KEY, JSON.stringify(sessionWithTimestamp));
    
    console.log('Session saved successfully:', sessionWithTimestamp);
  } catch (error) {
    console.error('Failed to save session:', error);
    // ストレージ容量不足の場合の処理
    if (error instanceof DOMException && error.code === 22) {
      alert('ストレージ容量が不足しています。ブラウザのキャッシュをクリアしてください。');
    }
  }
};

// セッション読み込みの拡張版
export const loadInterviewSession = (): InterviewSession | null => {
  try {
    // まずセッションストレージから試行
    let saved = sessionStorage.getItem(SESSION_KEY);
    let session = saved ? JSON.parse(saved) : null;
    
    // セッションストレージにない場合はバックアップから復元
    if (!session) {
      const backup = localStorage.getItem(BACKUP_KEY);
      session = backup ? JSON.parse(backup) : null;
      
      if (session) {
        console.log('Session restored from backup');
        // バックアップから復元した場合はセッションストレージにも保存
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }
    
    if (session) {
      // セッションの有効期限チェック
      const now = Date.now();
      const lastUpdated = session.lastUpdated || session.startTime;
      
      if (now - lastUpdated > SESSION_TIMEOUT) {
        console.log('Session expired, clearing data');
        clearInterviewSession();
        return null;
      }
      
      // バージョン互換性チェック
      if (!session.version || session.version < '2.0') {
        console.log('Upgrading session to version 2.0');
        session = upgradeSessionFormat(session);
        saveInterviewSession(session);
      }
      
      console.log('Session loaded successfully:', session);
      return session;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load session:', error);
    // 破損したセッションデータをクリア
    clearInterviewSession();
    return null;
  }
};

// セッションクリアの拡張版
export const clearInterviewSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(BACKUP_KEY);
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

// セッション形式のアップグレード
const upgradeSessionFormat = (oldSession: any): InterviewSession => {
  return {
    ...oldSession,
    version: '2.0',
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

// セッション統計の取得
export const getSessionStats = (): {
  hasActiveSession: boolean;
  sessionAge: number;
  questionCount: number;
  completionRate: number;
} => {
  const session = loadInterviewSession();
  
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

// 自動保存機能
export const enableAutoSave = (session: InterviewSession, interval: number = 30000): () => void => {
  const autoSaveInterval = setInterval(() => {
    saveInterviewSession(session);
  }, interval);
  
  // クリーンアップ関数を返す
  return () => {
    clearInterval(autoSaveInterval);
  };
};

// セッション復旧機能
export const recoverSession = (): InterviewSession | null => {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const session = JSON.parse(backup);
      console.log('Attempting session recovery:', session);
      
      // セッションストレージに復元
      sessionStorage.setItem(SESSION_KEY, backup);
      return session;
    }
    return null;
  } catch (error) {
    console.error('Failed to recover session:', error);
    return null;
  }
};