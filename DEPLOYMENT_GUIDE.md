# 本番環境デプロイガイド

## 🚀 デプロイ前チェックリスト

### ✅ 完了済み項目
- [x] 利用規約・プライバシーポリシーの実装
- [x] サービス名の変更（就活商事　模擬面接）
- [x] フッター・法的文書リンクの追加
- [x] 本番環境用設定の実装
- [x] エラーハンドリングの強化
- [x] セキュリティヘッダーの設定

### 🔴 あなたの対応が必要な項目

#### 1. Supabaseの本番設定
**重要度: 🔴 必須**

1. **既存プロジェクト「Shukatsu Shoji Mogimensetsu」の設定変更**
   - [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
   - 「Shukatsu Shoji Mogimensetsu」プロジェクトを選択

2. **Authentication設定の変更（ローカル開発用も含む）**
   - Settings > Authentication に移動
   - **Site URL の設定:**
     - 開発用: `http://localhost:5173`
     - 本番用: `https://your-domain.com`
   - **Redirect URLs の設定:**
     - 開発用: `http://localhost:5173/auth/callback`
     - 本番用: `https://your-domain.com/auth/callback`
   - **Email confirmation を有効化**（本番環境のみ）

3. **環境変数の確認**
   - Settings > API から以下を確認:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon public` → `VITE_SUPABASE_ANON_KEY`

#### 🚨 ローカル開発エラーの解決方法

現在発生している「Session from session_id claim in JWT does not exist」エラーを解決するには：

1. **Supabase Dashboard で以下を設定:**
   - Authentication > Settings
   - Site URL: `http://localhost:5173` を追加
   - Redirect URLs: `http://localhost:5173/auth/callback` を追加

2. **既存のセッションをクリア:**
   - ブラウザの開発者ツールを開く
   - Application > Local Storage > localhost:5173 を選択
   - すべてのキーを削除
   - Session Storage も同様にクリア

3. **ブラウザを完全に再起動**

4. **新規アカウントでテスト:**
   - 新しいメールアドレスでサインアップ
   - メール確認リンクをクリック（開発環境では確認不要の場合もあり）

#### 2. ドメイン・SSL設定
**重要度: 🔴 必須**

1. **ドメインの取得**
   - お名前.com、ムームードメイン等でドメイン取得
   - 推奨: `shukatsu-shoji.com` など

2. **DNS設定**
   - デプロイ先（Netlify/Vercel）のDNS設定に従う

#### 3. デプロイ設定
**重要度: 🔴 必須**

**Netlifyの場合:**
1. [Netlify](https://netlify.com) にログイン
2. 「New site from Git」をクリック
3. GitHubリポジトリを選択
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment variables:
   ```
   VITE_SUPABASE_URL=your_existing_supabase_url
   VITE_SUPABASE_ANON_KEY=your_existing_anon_key
   NODE_ENV=production
   ```

**Vercelの場合:**
1. [Vercel](https://vercel.com) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. Environment Variables:
   ```
   VITE_SUPABASE_URL=your_existing_supabase_url
   VITE_SUPABASE_ANON_KEY=your_existing_anon_key
   NODE_ENV=production
   ```

### 🟡 推奨対応項目（後日対応可能）

#### 4. 監視・分析ツール
1. **Google Analytics**
   - [Google Analytics](https://analytics.google.com) でプロパティ作成
   - 測定ID を `VITE_GA_TRACKING_ID` に設定

2. **エラー追跡（Sentry）**
   - [Sentry](https://sentry.io) でプロジェクト作成
   - DSN を `VITE_SENTRY_DSN` に設定

## 📋 デプロイ手順

### ステップ1: Supabase設定の確認・変更
1. **Authentication設定を本番用に変更**
2. **RLSポリシーの確認**
3. **環境変数の確認**

### ステップ2: デプロイ実行
```bash
# Netlify CLI の場合
npm install -g netlify-cli
netlify deploy --prod

# Vercel CLI の場合
npm install -g vercel
vercel --prod
```

### ステップ3: 動作確認
1. **新規登録テスト**
   - メール認証が正常に動作するか
2. **ログインテスト**
   - 認証フローが正常に動作するか
3. **面接機能テスト**
   - AI面接官が正常に動作するか
4. **レスポンシブテスト**
   - モバイル・タブレットでの表示確認

## 🔧 トラブルシューティング

### よくある問題と解決方法

1. **「Session from session_id claim in JWT does not exist」エラー**
   - Supabase Dashboard で Site URL と Redirect URLs を正しく設定
   - ブラウザのローカルストレージとセッションストレージをクリア
   - ブラウザを完全に再起動

2. **メール認証が届かない**
   - Supabaseの Authentication > Settings でメール設定確認
   - 迷惑メールフォルダを確認

3. **API接続エラー**
   - 環境変数が正しく設定されているか確認
   - Supabase URLとAnon Keyの形式確認

4. **ビルドエラー**
   - `npm install` でパッケージを再インストール
   - Node.js バージョンを18以上に更新

## 📞 サポート

問題が発生した場合は、以下の情報と共にお知らせください：
- エラーメッセージ
- ブラウザのコンソールログ
- 実行した手順

## 🎯 デプロイ後の確認項目

- [ ] 新規登録→メール認証→ログインの流れ
- [ ] 面接機能の動作確認
- [ ] 利用規約・プライバシーポリシーの表示
- [ ] モバイル・タブレットでの表示
- [ ] SSL証明書の有効性
- [ ] パフォーマンスの確認

デプロイが完了したら、本格的なサービス運用が開始できます！