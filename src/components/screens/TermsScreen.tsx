import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              制定日：2025年6月23日<br />
              運営者：就活商事くん
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第1条（適用）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本規約は、就活商事くん（以下「当社」）が提供する就活商事　模擬面接（以下「本サービス」）の利用条件を定めるものです。</li>
              <li>利用者は、本サービスを利用することで、本規約に同意したものとみなします。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第2条（利用資格）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスは、15歳以上の方にご利用いただけます。</li>
              <li>15歳以上18歳未満の方は、保護者の同意を得てからご利用ください（自己申告）。</li>
              <li>反社会的勢力に該当する方、または該当するおそれのある方は利用できません。</li>
              <li>日本国外からもご利用いただけます。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第3条（アカウント登録）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスの利用には、メールアドレスとパスワードによるアカウント登録が必要です。</li>
              <li>登録情報は正確かつ最新の情報を提供してください。</li>
              <li>パスワードの管理は利用者の責任で行い、第三者に開示してはいけません。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第4条（サービス内容）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスは、AIが面接官となって模擬面接を行うサービスです。</li>
              <li>現在は無料でご利用いただけますが、2025年秋頃から有料プランを導入予定です。</li>
              <li>有料化後も、1アカウントにつき通算3回まで無料でご利用いただけます。</li>
              <li>有料化の際は、事前に利用者にメール等で通知いたします。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第5条（利用記録の収集）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>当社は、サービス改善と将来の有料化に向けて、以下の情報を記録します：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>面接実施回数</li>
                  <li>面接実施日時</li>
                  <li>ユーザーID</li>
                </ul>
              </li>
              <li>面接での質問内容や回答内容は保存いたしません。</li>
              <li>収集した利用記録は、2年間保持した後に削除いたします。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第6条（禁止事項）</h2>
            <p className="text-gray-700 mb-2">利用者は以下の行為を禁止します：</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>法令に違反する行為</li>
              <li>本サービスを商用目的で利用する行為</li>
              <li>他の利用者や第三者に迷惑をかける行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>AIが生成した内容を無断で商用利用する行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>複数のアカウントを作成する行為</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第7条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスは「現状有姿」で提供され、当社は以下について一切保証いたしません：
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>サービスの正確性、完全性、有用性</li>
                  <li>AIが生成する質問や応答の内容</li>
                  <li>本サービス利用による就職活動の結果</li>
                </ul>
              </li>
              <li>システム障害やメンテナンスにより、サービスが一時的に利用できない場合があります。</li>
              <li>AIの応答内容は参考情報であり、実際の面接結果を保証するものではありません。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第8条（知的財産権）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスの著作権、商標権等の知的財産権は当社に帰属します。</li>
              <li>AIが生成した質問内容の著作権は当社に帰属します。</li>
              <li>利用者の回答内容の著作権は利用者に帰属しますが、サービス改善のため匿名で分析に使用する場合があります。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第9条（個人情報の取扱い）</h2>
            <p className="text-gray-700">
              個人情報の取扱いについては、別途定める
              <a href="/privacy" className="text-blue-600 underline hover:text-blue-800 mx-1">
                プライバシーポリシー
              </a>
              に従います。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第10条（サービスの変更・終了）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>当社は、利用者への事前通知により、本サービスの内容を変更または終了することができます。</li>
              <li>サービス終了の場合は、30日前までにメール等で通知いたします。</li>
              <li>計画メンテナンスの場合は、24時間前までにメールで通知いたします。</li>
              <li>緊急メンテナンスの場合は、可能な限り速やかにメールで通知いたします。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第11条（アカウントの削除）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>アカウントの削除をご希望の場合は、
                <a href="mailto:shukatsushoji@gmail.com" className="text-blue-600 underline hover:text-blue-800 mx-1">
                  shukatsushoji@gmail.com
                </a>
                までご連絡ください。
              </li>
              <li>アカウント削除後も、統計分析のため利用記録を匿名化して保持する場合があります。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第12条（規約の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>当社は、利用者への事前通知により、本規約を変更することができます。</li>
              <li>変更後の規約は、本サービス上での掲示により効力を生じます。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第13条（準拠法・管轄裁判所）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本規約は日本法に準拠します。</li>
              <li>本サービスに関する紛争は、東京地方裁判所を専属的合意管轄裁判所とします。</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第14条（返金について）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>有料プランの料金は、原則として返金いたしません。</li>
              <li>ただし、重大なシステム障害により30日間以上継続してサービスを利用できない場合は、利用不可期間に相当する料金を返金いたします。</li>
              <li>返金に関するお問い合わせは、
                <a href="mailto:shukatsushoji@gmail.com" className="text-blue-600 underline hover:text-blue-800 mx-1">
                  shukatsushoji@gmail.com
                </a>
                までご連絡ください。
              </li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">第15条（お問い合わせ）</h2>
            <p className="text-gray-700">
              本規約に関するお問い合わせは、
              <a href="mailto:shukatsushoji@gmail.com" className="text-blue-600 underline hover:text-blue-800 mx-1">
                shukatsushoji@gmail.com
              </a>
              までご連絡ください。原則として48時間以内に回答いたします。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};