const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// セキュリティチェック
if (!API_KEY) {
  throw new Error('Google API Key is not configured. Please set VITE_GOOGLE_API_KEY environment variable.');
}

// 本番環境でのAPIキー検証
if (process.env.NODE_ENV === 'production') {
  if (API_KEY.length < 30) {
    console.error('🚨 Invalid Google API Key format detected!');
  }
  if (API_KEY.includes('demo') || API_KEY.includes('test')) {
    console.error('🚨 Demo/Test API Key detected in production!');
  }
}

// リトライ設定
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

// レート制限管理
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 60; // 1分間に60リクエスト
  private readonly windowMs = 60 * 1000;

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

const rateLimiter = new RateLimiter();

// 業界別詳細ペルソナ定義（拡張版）
const getIndustryPersona = (industry: string): string => {
  const personas = {
    'IT': {
      characteristics: '技術的好奇心、論理的思考、イノベーション、問題解決力、継続学習意欲、アジャイル思考',
      values: 'スピード感、効率性、創造性、データドリブン思考、ユーザー中心設計',
      keyQuestions: [
        'プログラミング経験や技術への興味・学習方法',
        '論理的思考力を示すエピソード・問題解決アプローチ',
        '新しい技術への学習姿勢・キャッチアップ方法',
        'チーム開発やアジャイル開発への理解・経験',
        'ユーザー視点での思考・UX/UI への関心'
      ],
      tone: '親しみやすく、技術的な話題にも踏み込む現代的で革新的な面接官'
    },
    '金融': {
      characteristics: 'リスク管理意識、数値分析力、信頼性、コンプライアンス意識、責任感、長期的視点',
      values: '安定性、正確性、信頼関係、長期的視点、社会的責任',
      keyQuestions: [
        '数字やデータに対する関心・分析経験',
        '責任感や信頼性を示すエピソード',
        '金融業界への理解度・社会的意義の認識',
        'リスク管理や慎重な判断力の経験',
        '長期的な視点での計画・目標設定'
      ],
      tone: '丁寧で落ち着いた、信頼感があり社会的責任を重視する面接官'
    },
    '商社': {
      characteristics: 'グローバル視点、交渉力、関係構築力、チャレンジ精神、適応力、文化理解力',
      values: '多様性、スピード感、関係性、挑戦、グローバル思考',
      keyQuestions: [
        '海外経験や語学力、国際的な関心・異文化理解',
        'コミュニケーション能力や交渉経験・説得力',
        'チャレンジ精神を示すエピソード・困難克服',
        '多様な人との関係構築経験・チームワーク',
        'グローバルな視点での思考・世界情勢への関心'
      ],
      tone: 'エネルギッシュで国際的な視野を持つ、挑戦を重視する面接官'
    },
    'コンサル': {
      characteristics: '論理的分析力、問題解決力、提案力、クライアント志向、構造化思考、仮説思考',
      values: '論理性、効率性、価値創造、クライアントファースト、結果重視',
      keyQuestions: [
        '論理的思考力や分析力を示すエピソード・フレームワーク活用',
        '問題解決の具体的なプロセス・アプローチ方法',
        'チームでの提案や改善経験・リーダーシップ',
        'クライアント視点での思考・相手の立場理解',
        '仮説立案と検証の経験・PDCA サイクル'
      ],
      tone: '論理的で鋭い質問をする、知的で結果重視の面接官'
    },
    'メーカー': {
      characteristics: '品質意識、継続改善、チームワーク、ものづくり精神、安全意識、技術への敬意',
      values: '品質、安全性、チームワーク、継続改善、技術革新',
      keyQuestions: [
        'ものづくりや品質への関心・こだわり',
        'チームワークや協調性のエピソード・役割分担',
        '継続的な改善や工夫の経験・カイゼン思考',
        '安全や品質に対する意識・責任感',
        '技術や製造プロセスへの興味・理解'
      ],
      tone: '温かみがあり、チームワークと品質を重視する堅実な面接官'
    },
    'その他': {
      characteristics: '基本的なビジネススキル、コミュニケーション能力、学習意欲、適応力、誠実性',
      values: 'コミュニケーション、学習意欲、適応力、基本的なビジネスマナー、誠実性',
      keyQuestions: [
        '基本的なコミュニケーション能力・対人関係',
        '学習意欲や成長への姿勢・自己啓発',
        '適応力や柔軟性のエピソード・変化対応',
        'ビジネスマナーや社会人としての基礎・責任感',
        '誠実性や信頼関係構築の経験'
      ],
      tone: 'バランスの取れた、基本を重視する親しみやすい面接官'
    }
  };
  
  const persona = personas[industry as keyof typeof personas] || personas['その他'];
  return `
【業界特性】${persona.characteristics}
【重視する価値観】${persona.values}
【重要な質問領域】${persona.keyQuestions.join('、')}
【面接官の特徴】${persona.tone}
  `;
};

// 深掘り質問パターンの詳細定義（拡張版）
const getDeepDivePatterns = (questionType: string, previousAnswer: string): string[] => {
  const patterns = {
    'experience': [
      '具体的にはどのような役割を担っていましたか？',
      'その経験で最も困難だったことは何でしたか？どう乗り越えましたか？',
      'どのような工夫や改善を行いましたか？結果はいかがでしたか？',
      'チームメンバーとはどのように連携しましたか？あなたの役割は？',
      'その経験から何を学び、どう成長しましたか？',
      'もし同じ状況になったら、今度はどうしますか？',
      'その活動を通じて、周囲からどのような評価を受けましたか？',
      '最も印象に残っている出来事やエピソードはありますか？'
    ],
    'motivation': [
      'なぜその業界に興味を持ったのですか？きっかけは？',
      '他の業界や企業と比較してどう思いますか？',
      '将来的にはどのような仕事をしたいですか？',
      'その目標に向けて今何をしていますか？',
      '弊社でどのような価値を提供できると思いますか？',
      '入社後の具体的なキャリアプランはありますか？',
      '業界の課題や将来性についてどう考えますか？',
      '弊社の事業内容についてどの程度ご存知ですか？'
    ],
    'personality': [
      'その性格はいつ頃から自覚していましたか？',
      '具体的にどのような場面で発揮されますか？',
      'それが原因で困ったことはありますか？どう対処しましたか？',
      'チームワークにどう影響しますか？',
      'その特徴を仕事でどう活かせると思いますか？',
      '改善したい点はありますか？どんな努力をしていますか？',
      '周囲の人からはどのように見られていると思いますか？',
      'ストレスを感じる場面とその対処法を教えてください。'
    ],
    'challenge': [
      'なぜその挑戦をしようと思ったのですか？',
      '準備段階でどんなことをしましたか？',
      '途中で諦めたくなったことはありますか？なぜ続けられましたか？',
      'どのように困難を乗り越えましたか？',
      '周囲の人からはどんな反応でしたか？サポートはありましたか？',
      'その挑戦があなたをどう変えましたか？',
      '失敗や挫折から学んだことはありますか？',
      '今振り返って、違うアプローチがあったと思いますか？'
    ]
  };
  
  return patterns[questionType as keyof typeof patterns] || patterns['experience'];
};

// 質問タイプの自動判定（改良版）
const classifyQuestionType = (question: string, answer: string): string => {
  const motivationKeywords = ['志望', '理由', 'なぜ', '目標', 'やりたい', '興味', '将来', 'キャリア'];
  const experienceKeywords = ['経験', '取り組', '活動', '頑張', '力を入れ', 'エピソード', '学生時代', 'サークル', 'アルバイト'];
  const personalityKeywords = ['性格', '特徴', '長所', '短所', '強み', '弱み', '人柄', '価値観'];
  const challengeKeywords = ['挑戦', 'チャレンジ', '困難', '乗り越え', '努力', '工夫', '失敗', '挫折'];
  
  const text = (question + ' ' + answer).toLowerCase();
  
  if (motivationKeywords.some(keyword => text.includes(keyword))) return 'motivation';
  if (challengeKeywords.some(keyword => text.includes(keyword))) return 'challenge';
  if (personalityKeywords.some(keyword => text.includes(keyword))) return 'personality';
  if (experienceKeywords.some(keyword => text.includes(keyword))) return 'experience';
  
  return 'experience'; // デフォルト
};

// 会話の流れを分析する関数（15分面接用に最適化）
const analyzeConversationFlow = (conversationHistory: Array<{question: string; answer: string}>): {
  coveredTopics: string[];
  missingTopics: string[];
  deepDiveOpportunities: string[];
  conversationQuality: 'shallow' | 'moderate' | 'deep';
  recommendedNextAction: 'deep_dive' | 'new_topic' | 'wrap_up';
} => {
  const essentialTopics = ['自己紹介', '志望動機', '学生時代の経験'];
  const coveredTopics: string[] = [];
  const deepDiveOpportunities: string[] = [];
  
  // 必須トピックのカバー状況をチェック
  conversationHistory.forEach(({ question, answer }) => {
    if (question.includes('自己紹介') || question.includes('お名前')) {
      coveredTopics.push('自己紹介');
    }
    if (question.includes('志望') || question.includes('理由')) {
      coveredTopics.push('志望動機');
    }
    if (question.includes('学生時代') || question.includes('力を入れ') || question.includes('頑張')) {
      coveredTopics.push('学生時代の経験');
    }
    
    // 深掘りの機会を特定
    if (answer.length > 100 && !question.includes('具体的') && !question.includes('詳しく')) {
      deepDiveOpportunities.push('詳細な深掘りが可能');
    }
  });
  
  const missingTopics = essentialTopics.filter(topic => !coveredTopics.includes(topic));
  
  // 会話の質を評価
  const avgAnswerLength = conversationHistory.reduce((sum, { answer }) => sum + answer.length, 0) / conversationHistory.length;
  const deepQuestionCount = conversationHistory.filter(({ question }) => 
    question.includes('具体的') || question.includes('どのよう') || question.includes('なぜ')
  ).length;
  
  let conversationQuality: 'shallow' | 'moderate' | 'deep' = 'shallow';
  if (avgAnswerLength > 80 && deepQuestionCount > conversationHistory.length * 0.3) {
    conversationQuality = 'deep';
  } else if (avgAnswerLength > 50 || deepQuestionCount > 0) {
    conversationQuality = 'moderate';
  }
  
  // 15分面接（10問）用の次のアクション推奨
  let recommendedNextAction: 'deep_dive' | 'new_topic' | 'wrap_up' = 'new_topic';
  if (missingTopics.length > 0) {
    recommendedNextAction = 'new_topic';
  } else if (deepDiveOpportunities.length > 0 && conversationQuality !== 'deep') {
    recommendedNextAction = 'deep_dive';
  } else if (conversationHistory.length >= 8) { // 10問中8問目以降は終了準備
    recommendedNextAction = 'wrap_up';
  }
  
  return {
    coveredTopics,
    missingTopics,
    deepDiveOpportunities,
    conversationQuality,
    recommendedNextAction
  };
};

// 指数バックオフでのリトライ機能
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, RETRY_CONFIG.maxRetries - retries),
      RETRY_CONFIG.maxDelay
    );
    
    console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
    await sleep(delay);
    return retryWithBackoff(fn, retries - 1);
  }
};

const createInterviewerPrompt = (
  industry: string, 
  interviewType: string, 
  questionCount: number,
  conversationHistory: Array<{question: string; answer: string}>
): string => {
  const isFirstQuestion = conversationHistory.length === 0;
  
  if (isFirstQuestion) {
    return `あなたは${industry}業界の人事部で${interviewType}を担当する経験豊富な面接官です。

${getIndustryPersona(industry)}

【面接の進行方針】
- 合計${questionCount}問で構成される本格的な面接
- 必須3項目（自己紹介→志望動機→学生時代の経験）を軸に展開
- 各回答に対して2-3回の深掘り質問で本質を探る
- 業界特性に合わせた専門的な視点での評価
${questionCount === 10 ? '- 15分面接（10問）：必須3問 + 深掘り7問の効率的な構成' : ''}

【最初の質問】
まずは簡単に自己紹介をお願いします。お名前、大学・学部、そして簡単に人柄について教えてください。

【重要ルール】
- 質問は一度に一つだけ
- 親しみやすく自然な口調
- 質問番号は表示しない
- 面接官らしい適度な緊張感を保つ`;
  }

  const lastQA = conversationHistory[conversationHistory.length - 1];
  const questionNumber = conversationHistory.length + 1;
  const flowAnalysis = analyzeConversationFlow(conversationHistory);
  const questionType = classifyQuestionType(lastQA.question, lastQA.answer);

  return `あなたは${industry}業界の人事部で${interviewType}を担当する経験豊富な面接官です。

${getIndustryPersona(industry)}

【現在の面接状況】
- 進行状況: ${questionNumber}/${questionCount}問目
- 前回の質問: "${lastQA.question}"
- 前回の回答: "${lastQA.answer}"
- 回答の質: ${flowAnalysis.conversationQuality}
- カバー済みトピック: ${flowAnalysis.coveredTopics.join('、') || 'なし'}
- 未カバートピック: ${flowAnalysis.missingTopics.join('、') || 'なし'}
- 推奨アクション: ${flowAnalysis.recommendedNextAction}

【次の質問戦略】
${flowAnalysis.missingTopics.length > 0 
  ? `優先事項: 未カバーの重要トピック「${flowAnalysis.missingTopics[0]}」について質問する`
  : flowAnalysis.recommendedNextAction === 'deep_dive'
  ? `前回の回答「${lastQA.answer.substring(0, 50)}...」について深掘り質問を行う`
  : '面接の総括に向けた質問を行う'
}

【深掘りパターン（前回回答タイプ: ${questionType}）】
${getDeepDivePatterns(questionType, lastQA.answer).slice(0, 3).map(pattern => `- ${pattern}`).join('\n')}

【面接タイプ別重点配分】
${interviewType === '一次面接' ? 
  '- 学生時代の経験: 70%（具体的なエピソード、役割、成果を詳しく）\n- 志望動機: 30%（基本的な動機確認）' :
  interviewType === '二次面接' ? 
  '- 学生時代の経験: 50%（リーダーシップ、困難克服を重点的に）\n- 志望動機: 50%（業界理解、キャリアビジョン）' :
  '- 志望動機: 70%（将来ビジョン、企業理解を詳しく）\n- 学生時代の経験: 30%（仕事への活かし方）'
}

${questionCount === 10 ? `
【15分面接（10問）特別配分】
- 必須3問（自己紹介・志望動機・ガクチカ）: 問1-3
- 深掘り質問: 問4-9（各トピックを2-3回深掘り）
- 最終質問: 問10（逆質問または総括）
` : ''}

【質問生成ルール】
1. 前回の回答に必ず言及（「先ほどの○○について...」「○○とおっしゃいましたが...」）
2. 会話の自然な流れを重視
3. ${questionNumber >= questionCount ? '最終質問として「最後に何か質問はありますか？」' : '深掘りまたは新トピックへの移行'}
4. 業界特性を反映した専門的な視点
5. 質問番号は表示しない

【重要】前回の回答内容を踏まえ、面接官として自然で意味のある次の質問を一つだけ生成してください。`;
};

export const generateQuestion = async (
  industry: string,
  interviewType: string,
  questionCount: number,
  conversationHistory: Array<{question: string; answer: string}>
): Promise<string> => {
  // APIキーの存在確認
  if (!API_KEY) {
    throw new Error('Google API Key is not configured. Please contact the administrator.');
  }

  // レート制限チェック
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new Error(`レート制限に達しました。${Math.ceil(waitTime / 1000)}秒後に再試行してください。`);
  }

  const makeRequest = async (): Promise<string> => {
    const prompt = createInterviewerPrompt(industry, interviewType, questionCount, conversationHistory);
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      rateLimiter.recordRequest();
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  try {
    return await retryWithBackoff(makeRequest);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return handleAPIError(error);
  }
};

const handleAPIError = (error: any): string => {
  console.error('API Error:', error);
  
  // エラータイプに応じた適切なメッセージ
  if (error.message?.includes('429')) {
    return 'APIの利用制限に達しました。少し時間をおいて再度お試しください。';
  } else if (error.message?.includes('401')) {
    return 'API認証に問題があります。管理者にお問い合わせください。';
  } else if (error.message?.includes('403')) {
    return 'APIアクセスが制限されています。管理者にお問い合わせください。';
  } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
  } else if (error.message?.includes('レート制限')) {
    return error.message;
  } else if (error.message?.includes('not configured')) {
    return 'サービスの設定に問題があります。管理者にお問い合わせください。';
  } else {
    return '申し訳ございません。一時的な問題が発生しました。少し時間をおいて再度お試しください。';
  }
};

// パフォーマンス監視用の関数
export const getAPIMetrics = () => {
  return {
    canMakeRequest: rateLimiter.canMakeRequest(),
    waitTime: rateLimiter.getWaitTime(),
    requestsInWindow: rateLimiter['requests'].length,
    apiKeyConfigured: !!API_KEY
  };
};