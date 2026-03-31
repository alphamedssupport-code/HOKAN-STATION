# HOKAN STATION

訪問看護の専門情報メディア。毎日10本・約5000文字のSEO対応記事をClaude APIで自動生成します。

## 技術スタック

- **フレームワーク**: Astro v4（静的サイト生成）
- **スタイリング**: Tailwind CSS
- **記事生成**: Claude API（claude-sonnet-4-6）
- **デプロイ**: Vercel
- **自動化**: GitHub Actions（毎日 AM 9:00 JST）

---

## セットアップ

### 1. ローカル開発

```bash
git clone <このリポジトリのURL>
cd HOKAN-STATION
npm install

# .envファイルを作成
cp .env.example .env
# ANTHROPIC_API_KEY=sk-ant-... を記入

# 開発サーバー起動
npm run dev
```

### 2. 記事を手動生成

```bash
# 今日の日付で10本生成
npm run generate

# オプション指定
node scripts/generate-articles.js --count=5 --date=2026-04-01

# トピックだけ確認（APIを呼ばない）
node scripts/generate-articles.js --dry-run
```

---

## GitHub Actions の設定（自動化）

### 必要なシークレット

GitHubリポジトリの **Settings → Secrets and variables → Actions** で以下を設定してください。

| シークレット名 | 説明 | 取得方法 |
|-------------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API キー | [console.anthropic.com](https://console.anthropic.com/) |
| `VERCEL_TOKEN` | Vercel API トークン | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel組織ID | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | VercelプロジェクトID | Vercel → Project → Settings → General |

### 自動実行スケジュール

- **毎日 AM 9:00（JST）** に自動で記事10本を生成・コミット・デプロイ
- Vercel は `main` ブランチへのpushを検知して自動ビルド

### 手動実行

GitHub → Actions → 「毎日記事自動生成」→ 「Run workflow」から手動実行可能。  
記事数・日付の指定もできます。

---

## Vercel デプロイ手順

1. [vercel.com](https://vercel.com) にログイン
2. 「New Project」→ このリポジトリを接続
3. Framework Preset: **Astro** を選択
4. Environment Variables に `ANTHROPIC_API_KEY` を追加（任意・ビルド時不要）
5. Deploy

---

## 記事カテゴリ

| カテゴリ | 内容 |
|---------|------|
| 基礎知識 | 訪問看護の仕組み・利用方法・ステーション選び方 |
| 疾患別ケア | がん・ALS・認知症・脳卒中・糖尿病・心不全 |
| 家族向け | 介護負担・レスパイト・看取り・費用 |
| 制度・保険 | 医療保険・介護保険・特別指示書・報酬改定 |
| キャリア | 給与・転職・管理者・資格 |
| 医療技術 | 胃ろう・ストーマ・褥瘡・導尿・吸引 |

---

## ファイル構成

```
HOKAN-STATION/
├── .github/workflows/
│   ├── generate-articles.yml  # 毎日記事自動生成
│   └── deploy.yml             # Vercel自動デプロイ
├── src/
│   ├── content/blog/          # 記事Markdownファイル
│   ├── layouts/               # BaseLayout・BlogPost
│   ├── components/            # Header・Footer等
│   └── pages/                 # ルーティング
├── scripts/
│   └── generate-articles.js   # Claude API記事生成スクリプト
└── public/
```
