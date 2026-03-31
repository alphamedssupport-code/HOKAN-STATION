#!/usr/bin/env node
/**
 * HOKAN STATION - 訪問看護記事自動生成スクリプト
 *
 * 使い方:
 *   node scripts/generate-articles.js
 *
 * 環境変数:
 *   ANTHROPIC_API_KEY - Anthropic APIキー（必須）
 *
 * オプション:
 *   --count=N    生成する記事数（デフォルト: 10）
 *   --date=YYYY-MM-DD  公開日（デフォルト: 今日）
 *   --dry-run    APIを呼ばずにトピック一覧だけ表示
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// dotenvがインストールされていれば読み込む
try {
  const { config } = await import('dotenv');
  config();
} catch {
  // dotenvなしでもOK
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// ============================================================
// トピックデータベース
// ============================================================
const TOPICS = [
  // 基礎知識
  {
    category: '基礎知識',
    title: '訪問看護とは？サービスの仕組みと利用方法を徹底解説',
    keywords: ['訪問看護', '在宅医療', '看護師', '利用方法', '介護保険'],
    audience: '訪問看護に興味がある一般の方・患者家族',
  },
  {
    category: '基礎知識',
    title: '訪問看護ステーションの選び方｜失敗しない5つのチェックポイント',
    keywords: ['訪問看護ステーション', '選び方', '在宅ケア', '看護師'],
    audience: '訪問看護の利用を検討している方',
  },
  {
    category: '基礎知識',
    title: '訪問看護の頻度と時間｜週何回・何時間まで利用できるか',
    keywords: ['訪問看護', '利用回数', '利用時間', '介護保険', '医療保険'],
    audience: '訪問看護の利用を検討している方・ケアマネジャー',
  },
  {
    category: '基礎知識',
    title: '医療保険と介護保険の違い｜訪問看護はどちらで利用できる？',
    keywords: ['医療保険', '介護保険', '訪問看護', '費用', '適用条件'],
    audience: '制度を理解したい患者家族・ケアマネジャー',
  },
  {
    category: '基礎知識',
    title: '訪問看護指示書とは？発行の流れと記載内容を解説',
    keywords: ['訪問看護指示書', '医師', '在宅医療', '指示書'],
    audience: '訪問看護師・ケアマネジャー',
  },

  // 疾患別ケア
  {
    category: '疾患別ケア',
    title: '在宅がん患者の緩和ケア｜訪問看護師が行う疼痛管理のポイント',
    keywords: ['在宅がん', '緩和ケア', '疼痛管理', '訪問看護', 'モルヒネ'],
    audience: '訪問看護師・がん患者家族',
  },
  {
    category: '疾患別ケア',
    title: 'ALS（筋萎縮性側索硬化症）の在宅ケア｜人工呼吸器管理の基本',
    keywords: ['ALS', '筋萎縮性側索硬化症', '人工呼吸器', '在宅ケア', '訪問看護'],
    audience: '訪問看護師・ALS患者家族',
  },
  {
    category: '疾患別ケア',
    title: '認知症の在宅ケア｜BPSDへの対応と家族支援の方法',
    keywords: ['認知症', 'BPSD', '在宅ケア', '家族支援', '訪問看護'],
    audience: '訪問看護師・認知症患者家族',
  },
  {
    category: '疾患別ケア',
    title: '脳卒中後遺症の在宅リハビリ｜訪問看護師ができるアプローチ',
    keywords: ['脳卒中', '後遺症', 'リハビリ', '在宅', '麻痺', '訪問看護'],
    audience: '訪問看護師・脳卒中後遺症患者家族',
  },
  {
    category: '疾患別ケア',
    title: '糖尿病の在宅管理｜血糖コントロールとフットケアの実践',
    keywords: ['糖尿病', '血糖管理', 'フットケア', '在宅', '訪問看護', 'インスリン'],
    audience: '訪問看護師・糖尿病患者・家族',
  },
  {
    category: '疾患別ケア',
    title: '心不全の在宅管理｜早期再入院を防ぐ訪問看護のポイント',
    keywords: ['心不全', '在宅管理', '再入院予防', '体重測定', '訪問看護'],
    audience: '訪問看護師・心不全患者家族',
  },
  {
    category: '疾患別ケア',
    title: 'COPD（慢性閉塞性肺疾患）の在宅酸素療法と訪問看護',
    keywords: ['COPD', '在宅酸素療法', '呼吸リハビリ', '訪問看護'],
    audience: '訪問看護師・COPD患者家族',
  },

  // 家族向け
  {
    category: '家族向け',
    title: '介護疲れを感じたら｜家族が知っておきたいレスパイトケアの活用法',
    keywords: ['介護疲れ', 'レスパイトケア', '家族介護', '訪問看護', '介護負担'],
    audience: '在宅介護を行う家族',
  },
  {
    category: '家族向け',
    title: '在宅看取りとは？家族が知っておくべき準備と心構え',
    keywords: ['在宅看取り', '看取り', '終末期', '訪問看護', '家族'],
    audience: '在宅療養中の患者家族',
  },
  {
    category: '家族向け',
    title: 'おむつ交換・体位変換の正しい方法｜家族介護の基本技術',
    keywords: ['おむつ交換', '体位変換', '家族介護', '床ずれ予防', '訪問看護'],
    audience: '在宅介護を行う家族',
  },
  {
    category: '家族向け',
    title: '介護保険申請の手順｜要介護認定から訪問看護利用開始まで',
    keywords: ['介護保険申請', '要介護認定', '介護保険', '訪問看護', '手順'],
    audience: '介護保険申請を検討している家族',
  },
  {
    category: '家族向け',
    title: '訪問看護の費用はいくら？自己負担額と公費助成制度を解説',
    keywords: ['訪問看護', '費用', '自己負担', '公費', '医療保険', '介護保険'],
    audience: '訪問看護の費用が気になる患者家族',
  },

  // 制度・保険
  {
    category: '制度・保険',
    title: '特別訪問看護指示書とは？通常の指示書との違いと発行条件',
    keywords: ['特別訪問看護指示書', '指示書', '医師', '頻回訪問', '訪問看護'],
    audience: '訪問看護師・ケアマネジャー',
  },
  {
    category: '制度・保険',
    title: '精神科訪問看護の基本｜対象疾患・利用方法・加算の解説',
    keywords: ['精神科訪問看護', '精神疾患', '統合失調症', '加算', '医療保険'],
    audience: '精神科訪問看護師・ケアマネジャー',
  },
  {
    category: '制度・保険',
    title: '2024年度介護報酬改定｜訪問看護への影響と対応ポイント',
    keywords: ['介護報酬改定', '訪問看護', '加算', '算定要件', '2024年'],
    audience: '訪問看護ステーション管理者・経営者',
  },
  {
    category: '制度・保険',
    title: '小児訪問看護の制度と実践｜医療的ケア児への支援',
    keywords: ['小児訪問看護', '医療的ケア児', '小児', '在宅ケア', '訪問看護'],
    audience: '訪問看護師・医療的ケア児の家族',
  },

  // キャリア
  {
    category: 'キャリア',
    title: '訪問看護師の給与・年収は？病院との比較と収入アップの方法',
    keywords: ['訪問看護師', '給与', '年収', '転職', '病院との比較'],
    audience: '訪問看護師・看護師転職希望者',
  },
  {
    category: 'キャリア',
    title: '訪問看護師に向いている人の特徴｜やりがいと大変さを正直に解説',
    keywords: ['訪問看護師', '向いている人', 'やりがい', '転職', '適性'],
    audience: '訪問看護師への転職を検討している看護師',
  },
  {
    category: 'キャリア',
    title: '訪問看護ステーション管理者になるには？要件と役割を解説',
    keywords: ['訪問看護ステーション', '管理者', '要件', '責任者', 'キャリア'],
    audience: 'キャリアアップを目指す訪問看護師',
  },
  {
    category: 'キャリア',
    title: '認定看護師・専門看護師の資格を訪問看護で活かす方法',
    keywords: ['認定看護師', '専門看護師', '資格', '訪問看護', 'キャリア'],
    audience: '資格取得を目指す訪問看護師',
  },
  {
    category: 'キャリア',
    title: '病院から訪問看護へ転職｜よくある不安と解消法',
    keywords: ['訪問看護', '転職', '病院', '不安', 'キャリアチェンジ'],
    audience: '病院から訪問看護への転職を検討している看護師',
  },

  // 医療技術
  {
    category: '医療技術',
    title: '胃ろう（PEG）の在宅管理｜日常ケアと合併症の観察ポイント',
    keywords: ['胃ろう', 'PEG', '在宅管理', '経管栄養', '訪問看護'],
    audience: '訪問看護師・胃ろう患者家族',
  },
  {
    category: '医療技術',
    title: 'ストーマケアの基本｜装具交換の手順と皮膚トラブルの予防',
    keywords: ['ストーマ', 'ストーマケア', '装具交換', '皮膚トラブル', '訪問看護'],
    audience: '訪問看護師・ストーマ保有者・家族',
  },
  {
    category: '医療技術',
    title: '在宅での褥瘡（床ずれ）管理｜予防から治療まで',
    keywords: ['褥瘡', '床ずれ', '予防', '治療', 'ドレッシング', '訪問看護'],
    audience: '訪問看護師・介護家族',
  },
  {
    category: '医療技術',
    title: '導尿・膀胱留置カテーテルの在宅管理｜感染予防のポイント',
    keywords: ['導尿', '膀胱留置カテーテル', '感染予防', '尿路感染', '訪問看護'],
    audience: '訪問看護師・患者家族',
  },
  {
    category: '医療技術',
    title: '在宅での静脈栄養（IVH・TPN）管理｜訪問看護師の役割',
    keywords: ['静脈栄養', 'IVH', 'TPN', '中心静脈', '在宅', '訪問看護'],
    audience: '訪問看護師・患者家族',
  },
  {
    category: '医療技術',
    title: '吸引・排痰ケアの技術｜在宅での効果的な実施方法',
    keywords: ['吸引', '排痰', '口腔ケア', '気管切開', '在宅', '訪問看護'],
    audience: '訪問看護師・介護家族',
  },
];

// ============================================================
// コマンドライン引数の解析
// ============================================================
const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith('--count='));
const dateArg = args.find((a) => a.startsWith('--date='));
const isDryRun = args.includes('--dry-run');

const COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : 10;
const TARGET_DATE = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

// ============================================================
// スラッグ生成（英数字ベース）
// ============================================================
function createSlug(category, index, date) {
  const categorySlugMap = {
    '基礎知識': 'basics',
    '疾患別ケア': 'disease-care',
    '家族向け': 'for-family',
    '制度・保険': 'insurance',
    'キャリア': 'career',
    '医療技術': 'medical-skills',
  };
  const catSlug = categorySlugMap[category] || 'article';
  return `${date}-${catSlug}-${String(index + 1).padStart(2, '0')}`;
}

// ============================================================
// 既存スラッグの確認（重複防止）
// ============================================================
async function getExistingSlugs() {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    return new Set(files.map((f) => f.replace(/\.md$/, '')));
  } catch {
    return new Set();
  }
}

// ============================================================
// Claude APIで記事生成
// ============================================================
async function generateArticle(client, topic, slug, date) {
  const prompt = `あなたは訪問看護の専門ライターです。以下の条件でSEOに最適化された日本語の記事を書いてください。

## 記事情報
- タイトル: ${topic.title}
- カテゴリ: ${topic.category}
- 対象読者: ${topic.audience}
- SEOキーワード: ${topic.keywords.join('、')}

## 執筆条件
- 文字数: 約5000文字（本文のみ、frontmatterを除く）
- 構成: H2セクション4〜5個、各H2にH3を2〜3個
- 文体: 読みやすく、専門的すぎない日本語（「です・ます」調）
- キーワードを自然に文中に散りばめる
- 箇条書き・表・太字を効果的に使う
- 具体的な数値・事例を含める
- 根拠のある情報のみ記載（誤情報を含めない）
- 最後に「まとめ」セクションを入れる

## 出力形式
以下のMarkdown frontmatterから始めて、そのまま記事本文に続けてください。

\`\`\`
---
title: "${topic.title}"
description: "（SEOメタディスクリプション：120〜140文字で記事の要約。検索結果に表示される文章）"
publishDate: ${date}
category: "${topic.category}"
tags: ${JSON.stringify(topic.keywords)}
author: "HOKAN STATION編集部"
---
\`\`\`

frontmatterの後、すぐに記事本文（H2から始まるMarkdown）を書いてください。
コードブロックの \`\`\` は出力に含めないでください。frontmatterは --- で囲むだけで出力してください。`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content[0].text;
}

// ============================================================
// ファイル保存
// ============================================================
async function saveArticle(slug, content) {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

// ============================================================
// メイン処理
// ============================================================
async function main() {
  console.log(`\n🏥 HOKAN STATION 記事生成スクリプト`);
  console.log(`📅 公開日: ${TARGET_DATE}`);
  console.log(`📝 生成数: ${COUNT}本\n`);

  if (isDryRun) {
    console.log('--- ドライランモード（APIは呼びません） ---');
    const selected = TOPICS.slice(0, COUNT);
    selected.forEach((t, i) => {
      const slug = createSlug(t.category, i, TARGET_DATE);
      console.log(`[${i + 1}] ${slug}\n    ${t.title}`);
    });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ 環境変数 ANTHROPIC_API_KEY が設定されていません。');
    console.error('   .env ファイルを作成するか、環境変数を設定してください。');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const existingSlugs = await getExistingSlugs();

  // 未使用トピックを優先、それでも足りなければランダムで補充
  const unusedTopics = TOPICS.filter((_, i) => {
    const slug = createSlug(TOPICS[i].category, i, TARGET_DATE);
    return !existingSlugs.has(slug);
  });

  const selected = unusedTopics.slice(0, COUNT);
  if (selected.length < COUNT) {
    // 足りない場合はランダム選択
    const extra = TOPICS.sort(() => Math.random() - 0.5).slice(0, COUNT - selected.length);
    selected.push(...extra);
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < selected.length; i++) {
    const topic = selected[i];
    const slug = createSlug(topic.category, i, TARGET_DATE);

    console.log(`[${i + 1}/${selected.length}] 生成中: ${topic.title}`);

    try {
      const content = await generateArticle(client, topic, slug, TARGET_DATE);
      const filePath = await saveArticle(slug, content);
      console.log(`    ✅ 保存: ${path.relative(process.cwd(), filePath)}`);
      successCount++;

      // レート制限対策（1秒待機）
      if (i < selected.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error(`    ❌ エラー: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 結果: 成功 ${successCount}本 / 失敗 ${errorCount}本`);
  if (successCount > 0) {
    console.log(`\n次のステップ:`);
    console.log(`  npm run build   → サイトをビルド`);
    console.log(`  npm run dev     → ローカルで確認\n`);
  }
}

main().catch((err) => {
  console.error('予期しないエラーが発生しました:', err);
  process.exit(1);
});
