import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyScreen: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              制定日：2025年6月23日<br />
              運営者：就活商事くん
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. 基本方針</h2>
            <p className="text-gray-700 mb-4">
              就活商事くん（以下「当社」）は、利用者の個人情報を適切に保護することを重要な責務と考え、以下の方針に基づいて個人情報を取り扱います。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. 収集する個人情報</h2>
            
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">2.1 登録時に収集する情報</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>メールアドレス</li>
              <li>パスワード（暗号化して保存）</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">2.2 サービス利用時に収集する情報</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>面接実施回数</li>
              <li>面接実施日時</li>
              <li>選択した業界・面接タイプ・面接時間</li>
              <li>ログイン日時</li>
              <li>IPアドレス（セキュリティ目的）</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">2.3 収集しない情報</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
              <li>面接での質問内容</li>
              <li>利用者の回答内容</li>
              <li>氏名、住所、電話番号等の個人を特定する情報</li>
              <li>音声データ（音声入力機能を使用した場合も保存されません）</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. 個人情報の利用目的</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスの提供・運営</li>
              <li>利用者への連絡・通知</li>
              <li>サービス改善のための統計分析</li>
              <li>不正利用の防止・セキュリティ確保</li>
              <li>将来の有料化に向けた利用状況の把握</li>
              <li>カスタマーサポートの提供</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. 個人情報の第三者提供</h2>
            <p className="text-gray-700 mb-4">
              当社は、以下の場合を除き、利用者の個人情報を第三者に提供いたしません：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>利用者の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. 個人情報の保存期間</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>アカウント情報：</strong> アカウント削除まで</li>
              <li><strong>利用記録：</strong> 2年間（その後自動削除）</li>
              <li><strong>統計データ：</strong> 匿名化処理後、無期限（個人特定不可）</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. 個人情報の安全管理</h2>
            <p className="text-gray-700 mb-4">
              当社は、個人情報の漏洩、滅失、毀損等を防止するため、以下の安全管理措置を講じています：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>SSL/TLS暗号化通信の使用</li>
              <li>パスワードのハッシュ化保存</li>
              <li>アクセス制御・認証システムの導入</li>
              <li>定期的なセキュリティ監査</li>
              <li>従業員への個人情報保護教育</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Cookie・類似技術の使用</h2>
            <p className="text-gray-700 mb-4">
              本サービスでは、サービス向上のため以下の技術を使用します：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>セッションCookie：</strong> ログイン状態の維持</li>
              <li><strong>ローカルストレージ：</strong> 面接進行状況の一時保存</li>
              <li><strong>アクセス解析：</strong> サービス利用状況の分析（匿名）</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. 利用者の権利</h2>
            <p className="text-gray-700 mb-4">
              利用者は、自身の個人情報について以下の権利を有します：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>開示請求：</strong> 保存されている個人情報の開示</li>
              <li><strong>訂正・削除：</strong> 個人情報の訂正・削除</li>
              <li><strong>利用停止：</strong> 個人情報の利用停止</li>
              <li><strong>アカウント削除：</strong> アカウントの完全削除</li>
            </ul>
            <p className="text-gray-700 mt-4">
              これらの権利行使については、
              <a href="mailto:shukatsushoji@gmail.com" className="text-blue-600 underline hover:text-blue-800 mx-1">
                shukatsushoji@gmail.com
              </a>
              までご連絡ください。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. 外部サービスの利用</h2>
            <p className="text-gray-700 mb-4">
              本サービスでは、以下の外部サービスを利用しています：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Supabase：</strong> データベース・認証サービス</li>
              <li><strong>Google Gemini API：</strong> AI面接官機能</li>
              <li><strong>Web Speech API：</strong> 音声認識機能（ブラウザ内処理）</li>
            </ul>
            <p className="text-gray-700 mt-4">
              各サービスのプライバシーポリシーについては、それぞれの提供者のウェブサイトをご確認ください。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. 未成年者の個人情報</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>15歳以上18歳未満の方は、保護者の同意を得てからご利用ください</li>
              <li>未成年者の個人情報については、特に慎重に取り扱います</li>
              <li>保護者からの開示・削除請求にも対応いたします</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. 国際的なデータ移転</h2>
            <p className="text-gray-700">
              本サービスで利用する外部サービスの一部は、日本国外のサーバーでデータを処理する場合があります。
              これらのサービスは適切なセキュリティ基準を満たしており、個人情報は適切に保護されます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. プライバシーポリシーの変更</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>当社は、法令の変更やサービス内容の変更に伴い、本ポリシーを変更する場合があります</li>
              <li>重要な変更については、事前にメール等で通知いたします</li>
              <li>変更後のポリシーは、本サービス上での掲示により効力を生じます</li>
            </ol>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. お問い合わせ</h2>
            <p className="text-gray-700">
              個人情報の取扱いに関するお問い合わせは、以下までご連絡ください：
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-gray-700">
                <strong>就活商事くん</strong><br />
                メール：
                <a href="mailto:shukatsushoji@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                  shukatsushoji@gmail.com
                </a><br />
                回答時間：原則として48時間以内
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
              <p className="text-sm text-blue-800">
                <strong>重要：</strong> 
                本サービスは面接練習を目的としており、面接での質問・回答内容は一切保存されません。
                安心してご利用ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};