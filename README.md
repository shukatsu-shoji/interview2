# 就活商事　模擬面接

AIが面接官となり、志望業界に応じた本格的な模擬面接を体験できるサービスです。

## 🎯 サービス概要

**就活商事　模擬面接**は、就職活動中の学生が効果的な面接練習を行えるWebアプリケーションです。

### ✨ 主な機能

- **業界別面接対策**: IT、金融、商社、コンサル、メーカーなど
- **面接タイプ選択**: 一次面接、二次面接、最終面接
- **柔軟な面接時間**: 5分、15分、30分から選択
- **音声入力対応**: テキスト入力と音声入力の両方に対応
- **詳細な振り返り**: 質問と回答の履歴を確認可能

## 🚀 技術スタック

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** (ビルドツール)
- **Tailwind CSS** (スタイリング)
- **React Router** (ルーティング)
- **Lucide React** (アイコン)

### バックエンド・インフラ
- **Supabase** (データベース・認証)
- **Google Gemini API** (AI面接官)
- **Web Speech API** (音声認識)

### デプロイ・ホスティング
- **Netlify** / **Vercel** 対応
- **SSL/HTTPS** 対応
- **PWA** 対応

## 🛠️ 開発環境のセットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/あなたのユーザー名/ai-interview-service.git
cd ai-interview-service
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集して以下を設定：
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_API_KEY=your_google_gemini_api_key
```

4. **開発サーバーの起動**
```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

## 📦 ビルド・デプロイ

### 本番ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

### デプロイ
詳細な手順は [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) を参照してください。

## 🗄️ データベース設計

### 主要テーブル
- `interview_usage_logs`: 面接利用履歴
- `user_feedback`: ユーザーフィードバック
- `data_retention_notifications`: データ削除通知

### セキュリティ
- Row Level Security (RLS) 有効
- 適切なポリシー設定
- 個人情報の適切な管理

## 🔒 プライバシー・セキュリティ

### データ保護
- **面接内容は保存されません**
- 利用統計のみ記録（2年間保持）
- SSL/TLS暗号化通信
- 適切なセキュリティヘッダー設定

### 法的対応
- [利用規約](./src/components/screens/TermsScreen.tsx)
- [プライバシーポリシー](./src/components/screens/PrivacyScreen.tsx)
- 15歳以上利用可能（18歳未満は保護者同意必要）

## 🎨 UI/UX設計

### デザインシステム
- **カラーパレット**: イエロー・オレンジ系のグラデーション
- **フォント**: Inter (Google Fonts)
- **レスポンシブ**: モバイルファースト設計
- **アクセシビリティ**: WCAG 2.1 AA準拠

### ユーザーエクスペリエンス
- 直感的なナビゲーション
- 適切なローディング状態
- エラーハンドリング
- 進捗表示

## 📊 監視・分析

### パフォーマンス監視
- Core Web Vitals 対応
- バンドルサイズ最適化
- 画像最適化

### エラー追跡
- 本番環境でのエラーログ収集
- ユーザーフィードバック機能

## 🤝 コントリビューション

### 開発ガイドライン
1. **コードスタイル**: ESLint + Prettier
2. **コミットメッセージ**: Conventional Commits
3. **ブランチ戦略**: Git Flow

### 課題・要望
- GitHub Issues でバグ報告・機能要望を受付
- Pull Request 歓迎

## 📞 サポート・お問い合わせ

### 技術的な問題
- GitHub Issues で報告
- 詳細なエラーログを添付

### サービスに関するお問い合わせ
- **メール**: shukatsushoji@gmail.com
- **回答時間**: 原則48時間以内

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🎯 ロードマップ

### 2025年春
- [x] 基本的な面接機能
- [x] 業界別対応
- [x] 音声入力対応

### 2025年夏
- [ ] 面接結果の詳細分析
- [ ] 改善提案機能
- [ ] モバイルアプリ版

### 2025年秋
- [ ] 有料プラン導入
- [ ] 企業向け機能
- [ ] API提供

## 🏆 実績・統計

- **利用者数**: 開発中
- **面接実施回数**: 開発中
- **ユーザー満足度**: 開発中

---

## 🔧 開発者向け情報

### プロジェクト構成
```
src/
├── components/          # Reactコンポーネント
│   ├── screens/        # 画面コンポーネント
│   └── ...
├── hooks/              # カスタムフック
├── services/           # API・外部サービス
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

### 主要な設定ファイル
- `vite.config.ts`: Vite設定
- `tailwind.config.js`: Tailwind CSS設定
- `netlify.toml`: Netlify設定
- `vercel.json`: Vercel設定

### 環境変数
| 変数名 | 説明 | 必須 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase プロジェクトURL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名キー | ✅ |
| `VITE_GOOGLE_API_KEY` | Google Gemini API キー | ✅ |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | ❌ |
| `VITE_SENTRY_DSN` | Sentry DSN | ❌ |

---

**© 2025 就活商事くん. All rights reserved.**

就職活動を頑張る全ての学生を応援しています！ 🎓✨