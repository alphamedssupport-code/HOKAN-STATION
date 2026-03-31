/**
 * HOKAN STATION - Vercel Cron Job
 * 毎日AM9:00(JST)に訪問看護記事を10本自動生成してGitHubにコミット
 *
 * 必要な環境変数（Vercelダッシュボードで設定）:
 *   ANTHROPIC_API_KEY  - Anthropic APIキー
 *   GITHUB_TOKEN       - GitHubのPersonal Access Token（repo権限）
 *   GITHUB_OWNER       - GitHubユーザー名 or 組織名（例: alphamedssupport-code）
 *   GITHUB_REPO        - リポジトリ名（例: HOKAN-STATION）
 *   CRON_SECRET        - 不正アクセス防止用の任意の文字列
 */

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';

const TOPICS = [
  { category: '基礎知識',   title: '訪問看護とは？サービスの仕組みと利用方法を徹底解説', keywords: ['訪問看護', '在宅医療', '看護師', '利用方法', '介護保険'], audience: '訪問看護に興味がある一般の方・患者家族' },
  { category: '基礎知識',   title: '訪問看護ステーションの選び方｜失敗しない5つのチェックポイント', keywords: ['訪問看護ステーション', '選び方', '在宅ケア', '看護師'], audience: '訪問看護の利用を検討している方' },
  { category: '基礎知識',   title: '訪問看護の頻度と時間｜週何回・何時間まで利用できるか', keywords: ['訪問看護', '利用回数', '利用時間', '介護保険', '医療保険'], audience: '訪問看護の利用を検討している方' },
  { category: '基礎知識',   title: '訪問看護指示書とは？発行の流れと記載内容を解説', keywords: ['訪問看護指示書', '医師', '在宅医療', '指示書'], audience: '訪問看護師・ケアマネジャー' },
  { category: '疾患別ケア', title: '在宅がん患者の緩和ケア｜訪問看護師が行う疼痛管理のポイント', keywords: ['在宅がん', '緩和ケア', '疼痛管理', '訪問看護', 'モルヒネ'], audience: '訪問看護師・がん患者家族' },
  { category: '疾患別ケア', title: 'ALS（筋萎縮性側索硬化症）の在宅ケア｜人工呼吸器管理の基本', keywords: ['ALS', '筋萎縮性側索硬化症', '人工呼吸器', '在宅ケア', '訪問看護'], audience: '訪問看護師・ALS患者家族' },
  { category: '疾患別ケア', title: '認知症の在宅ケア｜BPSDへの対応と家族支援の方法', keywords: ['認知症', 'BPSD', '在宅ケア', '家族支援', '訪問看護'], audience: '訪問看護師・認知症患者家族' },
  { category: '疾患別ケア', title: '脳卒中後遺症の在宅リハビリ｜訪問看護師ができるアプローチ', keywords: ['脳卒中', '後遺症', 'リハビリ', '在宅', '麻痺', '訪問看護'], audience: '訪問看護師・脳卒中後遺症患者家族' },
  { category: '疾患別ケア', title: '糖尿病の在宅管理｜血糖コントロールとフットケアの実践', keywords: ['糖尿病', '血糖管理', 'フットケア', '在宅', '訪問看護', 'インスリン'], audience: '訪問看護師・糖尿病患者・家族' },
  { category: '疾患別ケア', title: '心不全の在宅管理｜早期再入院を防ぐ訪問看護のポイント', keywords: ['心不全', '在宅管理', '再入院予防', '体重測定', '訪問看護'], audience: '訪問看護師・心不全患者家族' },
  { category: '家族向け',   title: '介護疲れを感じたら｜家族が知っておきたいレスパイトケアの活用法', keywords: ['介護疲れ', 'レスパイトケア', '家族介護', '訪問看護', '介護負担'], audience: '在宅介護を行う家族' },
  { category: '家族向け',   title: '在宅看取りとは？家族が知っておくべき準備と心構え', keywords: ['在宅看取り', '看取り', '終末期', '訪問看護', '家族'], audience: '在宅療養中の患者家族' },
  { category: '家族向け',   title: 'おむつ交換・体位変換の正しい方法｜家族介護の基本技術', keywords: ['おむつ交換', '体位変換', '家族介護', '床ずれ予防', '訪問看護'], audience: '在宅介護を行う家族' },
  { category: '家族向け',   title: '訪問看護の費用はいくら？自己負担額と公費助成制度を解説', keywords: ['訪問看護', '費用', '自己負担', '公費', '医療保険', '介護保険'], audience: '訪問看護の費用が気になる患者家族' },
  { category: '制度・保険', title: '医療保険と介護保険の違い｜訪問看護はどちらで利用できる？', keywords: ['医療保険', '介護保険', '訪問看護', '費用', '適用条件'], audience: '制度を理解したい患者家族・ケアマネジャー' },
  { category: '制度・保険', title: '特別訪問看護指示書とは？通常の指示書との違いと発行条件', keywords: ['特別訪問看護指示書', '指示書', '医師', '頻回訪問', '訪問看護'], audience: '訪問看護師・ケアマネジャー' },
  { category: '制度・保険', title: '精神科訪問看護の基本｜対象疾患・利用方法・加算の解説', keywords: ['精神科訪問看護', '精神疾患', '統合失調症', '加算', '医療保険'], audience: '精神科訪問看護師・ケアマネジャー' },
  { category: '制度・保険', title: '小児訪問看護の制度と実践｜医療的ケア児への支援', keywords: ['小児訪問看護', '医療的ケア児', '小児', '在宅ケア', '訪問看護'], audience: '訪問看護師・医療的ケア児の家族' },
  { category: 'キャリア',   title: '訪問看護師の給与・年収は？病院との比較と収入アップの方法', keywords: ['訪問看護師', '給与', '年収', '転職', '病院との比較'], audience: '訪問看護師・看護師転職希望者' },
  { category: 'キャリア',   title: '訪問看護師に向いている人の特徴｜やりがいと大変さを正直に解説', keywords: ['訪問看護師', '向いている人', 'やりがい', '転職', '適性'], audience: '訪問看護師への転職を検討している看護師' },
  { category: 'キャリア',   title: '訪問看護ステーション管理者になるには？要件と役割を解説', keywords: ['訪問看護ステーション', '管理者', '要件', '責任者', 'キャリア'], audience: 'キャリアアップを目指す訪問看護師' },
  { category: 'キャリア',   title: '病院から訪問看護へ転職｜よくある不安と解消法', keywords: ['訪問看護', '転職', '病院', '不安', 'キャリアチェンジ'], audience: '病院から訪問看護への転職を検討している看護師' },
  { category: '医療技術',   title: '胃ろう（PEG）の在宅管理｜日常ケアと合併症の観察ポイント', keywords: ['胃ろう', 'PEG', '在宅管理', '経管栄養', '訪問看護'], audience: '訪問看護師・胃ろう患者家族' },
  { category: '医療技術',   title: 'ストーマケアの基本｜装具交換の手順と皮膚トラブルの予防', keywords: ['ストーマ', 'ストーマケア', '装具交換', '皮膚トラブル', '訪問看護'], audience: '訪問看護師・ストーマ保有者・家族' },
  { category: '医療技術',   title: '在宅での褥瘡（床ずれ）管理｜予防から治療まで', keywords: ['褥瘡', '床ずれ', '予防', '治療', 'ドレッシング', '訪問看護'], audience: '訪問看護師・介護家族' },
  { category: '医療技術',   title: '導尿・膀胱留置カテーテルの在宅管理｜感染予防のポイント', keywords: ['導尿', '膀胱留置カテーテル', '感染予防', '尿路感染', '訪問看護'], audience: '訪問看護師・患者家族' },
  { category: '医療技術',   title: '在宅での静脈栄養（IVH・TPN）管理｜訪問看護師の役割', keywords: ['静脈栄養', 'IVH', 'TPN', '中心静脈', '在宅', '訪問看護'], audience: '訪問看護師・患者家族' },
  { category: '医療技術',   title: '吸引・排痰ケアの技術｜在宅での効果的な実施方法', keywords: ['吸引', '排痰', '口腔ケア', '気管切開', '在宅', '訪問看護'], audience: '訪問看護師・介護家族' },
];

function createSlug(category, index, date) {
  const map = { '基礎知識': 'basics', '疾患別ケア': 'disease-care', '家族向け': 'for-family', '制度・保険': 'insurance', 'キャリア': 'career', '医療技術': 'medical-skills' };
  return `${date}-${map[category] || 'article'}-${String(index + 1).padStart(2, '0')}`;
}

async function generateArticle(client, topic, date) {
  const prompt = `あなたは訪問看護の専門ライターです。以下の条件でSEOに最適化された日本語の記事を書いてください。

## 記事情報
- タイトル: ${topic.title}
- カテゴリ: ${topic.category}
- 対象読者: ${topic.audience}
- SEOキーワード: ${topic.keywords.join('、')}

## 執筆条件
- 文字数: 約5000文字（本文のみ）
- 構成: H2セクション4〜5個、各H2にH3を2〜3個
- 文体: 読みやすく専門的すぎない日本語（「です・ます」調）
- キーワードを自然に文中に散りばめる
- 箇条書き・表・太字を効果的に使う
- 根拠のある情報のみ記載
- 最後に「まとめ」セクションを入れる

## 出力形式（frontmatterから始めてそのまま本文を続けてください）

---
title: "${topic.title}"
description: "（120〜140文字のメタディスクリプション）"
publishDate: ${date}
category: "${topic.category}"
tags: ${JSON.stringify(topic.keywords)}
author: "HOKAN STATION編集部"
---

（ここから記事本文をMarkdownで）`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}

export default async function handler(req, res) {
  // cronジョブ or 手動実行の認証
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = parseInt(req.query.count || '10', 10);
  const date = req.query.date || new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const results = [];
  const selected = TOPICS.sort(() => Math.random() - 0.5).slice(0, count);

  for (let i = 0; i < selected.length; i++) {
    const topic = selected[i];
    const slug = createSlug(topic.category, i, date);
    const path = `src/content/blog/${slug}.md`;

    try {
      const content = await generateArticle(anthropic, topic, date);
      const encoded = Buffer.from(content).toString('base64');

      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `📝 [${date}] ${topic.title}`,
        content: encoded,
        branch: 'main',
      });

      results.push({ slug, status: 'ok' });
      if (i < selected.length - 1) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      results.push({ slug, status: 'error', message: err.message });
    }
  }

  return res.status(200).json({ date, count: results.length, results });
}
