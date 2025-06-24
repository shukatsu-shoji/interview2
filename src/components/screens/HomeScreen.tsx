import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Award, Clock, ArrowRight } from 'lucide-react';
import { useUsageTracking } from '../../hooks/useUsageTracking';

interface HomeScreenProps {
  onStartInterview: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartInterview }) => {
  const [usageStats, setUsageStats] = useState({ totalUsage: 0, todayUsage: 0 });
  const { getUsageStats } = useUsageTracking();

  useEffect(() => {
    const loadStats = async () => {
      const stats = await getUsageStats();
      setUsageStats(stats);
    };
    loadStats();
  }, [getUsageStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-6 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            就活商事　模擬面接
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            徹底的に面接経験を積んで<br />
            第一志望の内定を掴み取ろう！
          </p>
          
          {/* Usage Stats */}
          {(usageStats.totalUsage > 0 || usageStats.todayUsage > 0) && (
            <div className="mt-6 flex justify-center space-x-6 text-sm text-gray-600">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-yellow-100">
                総利用回数: <span className="font-semibold text-yellow-600">{usageStats.totalUsage}回</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-yellow-100">
                今日の利用: <span className="font-semibold text-orange-600">{usageStats.todayUsage}回</span>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-yellow-100">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              業界別面接対策
            </h3>
            <p className="text-gray-600">
              商社、IT、金融、コンサルなど志望業界を選択可能。各業界に特化した面接を体験しよう！
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-yellow-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              柔軟な面接時間
            </h3>
            <p className="text-gray-600">
              5分・15分・30分から選択可能。好きな時間に気軽に模擬面接を行い、選考対策を行おう！
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-yellow-100">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              実践により近い深堀り面接
            </h3>
            <p className="text-gray-600">
              あなたの回答によって深堀り質問が常に変化。繰り返し模擬面接を受け、様々な質問に対応することで思考力を鍛え面接経験を積もう！
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            サービス利用の流れ
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: '面接設定', description: '業界・時間・面接タイプを選択' },
              { step: 2, title: 'いざ、面接スタート！', description: '志望業界・面接タイプに沿った質問' },
              { step: 3, title: 'テキスト/音声入力で回答可能', description: '自然な対話形式で回答' },
              { step: 4, title: '結果確認', description: '質問と回答を振り返り' }
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4 shadow-md">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
                
                {/* 矢印を追加（最後のステップ以外） */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-full transform -translate-y-1/2 -translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-yellow-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - Moved to bottom */}
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center border border-yellow-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            面接経験の数が就活結果を左右する！
          </h2>
          <div className="text-gray-600 mb-8 max-w-2xl mx-auto">
            <p className="mb-2">
              選択した志望業界・面接フェーズに合わせてあなたのガクチカや志望動機を深堀ります。
            </p>
            <p>
              繰り返し模擬面接を受けて自分の回答を見直すことで、面接力を上げていこう！
            </p>
          </div>
          <button
            onClick={onStartInterview}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            面接を始める
          </button>
        </div>
      </div>
    </div>
  );
};