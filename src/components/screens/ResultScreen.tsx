import React from 'react';
import { Home, FileText, Clock, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { InterviewQuestion, InterviewSettings } from '../../types/interview';

interface ResultScreenProps {
  settings: InterviewSettings;
  questions: InterviewQuestion[];
  onNewInterview: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  settings,
  questions,
  onNewInterview
}) => {
  // 面接統計の計算
  const calculateStats = () => {
    if (questions.length === 0) {
      return {
        totalDuration: '0分',
        averageResponseTime: '0秒',
        averageResponseLength: 0,
        deepDiveCount: 0,
        topicCoverage: [],
        conversationQuality: 'shallow' as const
      };
    }

    const startTime = questions[0].timestamp;
    const endTime = questions[questions.length - 1].timestamp;
    const totalDuration = Math.floor((endTime - startTime) / 1000 / 60);
    
    const responseTimes = questions.filter(q => q.responseTime).map(q => q.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? Math.floor(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;
    
    const averageResponseLength = Math.floor(
      questions.reduce((sum, q) => sum + q.answer.length, 0) / questions.length
    );
    
    const deepDiveCount = questions.filter(q => 
      q.deepDiveLevel && q.deepDiveLevel > 1
    ).length;
    
    const topicCoverage = [...new Set(questions.map(q => q.questionType).filter(Boolean))];
    
    // 会話の質を評価
    let conversationQuality: 'shallow' | 'moderate' | 'deep' = 'shallow';
    if (averageResponseLength > 80 && deepDiveCount > questions.length * 0.3) {
      conversationQuality = 'deep';
    } else if (averageResponseLength > 50 || deepDiveCount > 0) {
      conversationQuality = 'moderate';
    }

    return {
      totalDuration: `${totalDuration}分`,
      averageResponseTime: `${averageResponseTime}秒`,
      averageResponseLength,
      deepDiveCount,
      topicCoverage,
      conversationQuality
    };
  };

  const stats = calculateStats();

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'deep': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'deep': return '深い対話';
      case 'moderate': return '標準的';
      default: return '基本的';
    }
  };

  const getTopicName = (topic: string) => {
    const topicNames: { [key: string]: string } = {
      'introduction': '自己紹介',
      'motivation': '志望動機',
      'experience': '学生時代の経験',
      'personality': '人柄・性格',
      'challenge': '挑戦・困難克服',
      'other': 'その他'
    };
    return topicNames[topic] || topic;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">面接結果</h1>
          <p className="text-gray-600">お疲れさまでした。面接の振り返りをしましょう。</p>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{questions.length}</div>
              <div className="text-sm text-gray-600">質問数</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-yellow-100">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalDuration}</div>
              <div className="text-sm text-gray-600">面接時間</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-yellow-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.averageResponseTime}</div>
              <div className="text-sm text-gray-600">平均回答時間</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-yellow-100">
              <div className="text-2xl font-bold text-amber-600 mb-1">{stats.deepDiveCount}</div>
              <div className="text-sm text-gray-600">深掘り質問数</div>
            </div>
          </div>

          {/* Advanced Analytics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="font-semibold text-gray-900">会話の質</h3>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(stats.conversationQuality)}`}>
                {getQualityText(stats.conversationQuality)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                平均回答長: {stats.averageResponseLength}文字
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-900">カバーしたトピック</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.topicCoverage.map((topic, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    {getTopicName(topic)}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
              <div className="flex items-center mb-4">
                <Award className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="font-semibold text-gray-900">面接設定</h3>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>{settings.industry}</div>
                <div>{settings.interviewType}</div>
                <div>{settings.duration}分設定</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Questions and Answers */}
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">質問と回答の振り返り</h2>
          
          <div className="space-y-6">
            {questions.map((qa, index) => (
              <div key={qa.id} className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-yellow-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">質問</h3>
                      <div className="flex items-center space-x-2">
                        {qa.questionType && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                            {getTopicName(qa.questionType)}
                          </span>
                        )}
                        {qa.deepDiveLevel && qa.deepDiveLevel > 1 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                            深掘りLv.{qa.deepDiveLevel}
                          </span>
                        )}
                        {qa.responseTime && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {qa.responseTime}秒
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
                      {qa.question}
                    </p>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">あなたの回答</h3>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {qa.answer || '回答なし'}
                      </p>
                      {qa.answer && (
                        <div className="mt-2 text-xs text-gray-500">
                          {qa.answer.length}文字
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              次のステップ
            </h3>
            <p className="text-gray-600 mb-6">
              今回の面接を参考に、さらなる練習を積み重ねましょう
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onNewInterview}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Home className="w-5 h-5" />
                <span>新しい面接を始める</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};