export interface InterviewSettings {
  industry: string;
  duration: number;
  questionCount: number;
  interviewType: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  answer: string;
  timestamp: number;
  responseTime?: number; // 回答にかかった時間（秒）
  questionType?: 'introduction' | 'motivation' | 'experience' | 'personality' | 'challenge' | 'other';
  deepDiveLevel?: number; // 深掘りレベル（1-3）
}

export interface InterviewMetrics {
  totalResponseTime: number;
  averageResponseLength: number;
  deepDiveCount: number;
  topicCoverage?: string[];
  conversationFlow?: 'linear' | 'exploratory' | 'focused';
}

export interface InterviewSession {
  settings: InterviewSettings;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  isCompleted: boolean;
  startTime: number;
  lastUpdated?: number;
  version?: string;
  userId?: string; // ユーザー固有のセッション管理用
  conversationQuality?: 'shallow' | 'moderate' | 'deep';
  coveredTopics?: string[];
  interviewMetrics?: InterviewMetrics;
}

export interface ConversationAnalysis {
  coveredTopics: string[];
  missingTopics: string[];
  deepDiveOpportunities: string[];
  conversationQuality: 'shallow' | 'moderate' | 'deep';
  recommendedNextAction: 'deep_dive' | 'new_topic' | 'wrap_up';
}

export type Screen = 'home' | 'setup' | 'interview' | 'result';