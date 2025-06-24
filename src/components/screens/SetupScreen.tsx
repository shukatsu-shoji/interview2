import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { InterviewSettings } from '../../types/interview';

interface SetupScreenProps {
  onBack: () => void;
  onStartInterview: (settings: InterviewSettings) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onBack, onStartInterview }) => {
  const [industry, setIndustry] = useState('IT');
  const [duration, setDuration] = useState(15);
  const [interviewType, setInterviewType] = useState('一次面接');

  const industries = [
    { value: 'IT', label: 'IT・技術' },
    { value: '金融', label: '金融・保険' },
    { value: '商社', label: '商社・貿易' },
    { value: 'コンサル', label: 'コンサルティング' },
    { value: 'メーカー', label: 'メーカー・製造業' },
    { value: 'その他', label: 'その他' }
  ];

  const durations = [
    { value: 5, label: '5分 (5問程度)', description: 'スキマ時間にササっと面接練習' },
    { value: 15, label: '15分 (10問程度)', description: '実際の面接を想定した網羅的な面接対策' },
    { value: 30, label: '30分 (25問程度)', description: '様々な角度からの深堀りに耐える応用編' }
  ];

  const interviewTypes = [
    { value: '一次面接', label: '一次面接', description: '基本的なガクチカ中心' },
    { value: '二次面接', label: '二次面接', description: 'ガクチカと志望動機の深堀り' },
    { value: '最終面接', label: '最終面接', description: '熱量を確認する志望動機中心' }
  ];

  const handleStart = () => {
    const questionCount = duration === 5 ? 5 : duration === 15 ? 10 : 25;
    const settings: InterviewSettings = {
      industry,
      duration,
      questionCount,
      interviewType
    };
    onStartInterview(settings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">面接設定</h1>
            <p className="text-gray-600">
              志望業界、面接タイプによって質問レベルや深堀り方が変わります。<br />
              本番を想定した面接を受けて、面接力を上げよう！
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-yellow-100">
            {/* Industry Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">志望業界</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => setIndustry(ind.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      industry === ind.value
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 hover:border-yellow-300 text-gray-700'
                    }`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">面接時間</h3>
              <div className="space-y-3">
                {durations.map((dur) => (
                  <label
                    key={dur.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      duration === dur.value
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={dur.value}
                      checked={duration === dur.value}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="mr-3 text-yellow-500 focus:ring-yellow-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{dur.label}</div>
                      <div className="text-sm text-gray-600">{dur.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Interview Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">面接タイプ</h3>
              <div className="space-y-3">
                {interviewTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      interviewType === type.value
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interviewType"
                      value={type.value}
                      checked={interviewType === type.value}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="mr-3 text-yellow-500 focus:ring-yellow-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              面接を開始する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};