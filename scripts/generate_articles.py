#!/usr/bin/env python3
"""
HOKAN STATION 記事自動生成スクリプト
Model: claude-haiku-4-5 (コスト最小化)
Features: SEO最適化, FAQ付き, E-E-A-T, 重複チェック
"""

import os
import sys
import time
import argparse
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import anthropic

# ============================================================
# カテゴリ定義
# ============================================================
CATEGORIES = {
    "basics": {
        "name": "訪問看護の基礎知識",
        "slug": "basics",
        "topics": [
            "訪問看護とは何か｜サービス内容と利用の流れをわかりやすく解説",
            "訪問看護師の1日｜スケジュールと仕事内容を紹介",
            "訪問看護と訪問介護の違い｜どちらを選ぶべきか",
            "訪問看護の利用対象者｜どんな人が使えるのか",
            "訪問看護ステーションの選び方｜比較ポイント6つ",
            "訪問看護の初回訪問｜準備と流れを解説",
            "訪問看護師に相談できること｜対応範囲と限界",
            "訪問看護の頻度と時間｜週何回が適切か",
            "訪問看護と在宅医療の連携｜チームで支える在宅療養",
            "緊急時の対応｜24時間対応の訪問看護ステーション",
            "訪問看護の記録と報告｜看護計画・訪問記録の仕組み",
            "訪問看護師と主治医の関係｜指示書と連携の流れ",
            "在宅ターミナルケア｜看取りを支える訪問看護",
            "訪問看護の終了・中断｜終わりのタイミングと手続き",
            "訪問看護サービスの拡充｜近年の制度変更ポイント",
        ],
    },
    "disease-care": {
        "name": "疾患別ケア",
        "slug": "disease-care",
        "topics": [
            "脳卒中後の在宅リハビリ｜訪問看護でできること",
            "パーキンソン病の在宅ケア｜症状管理と生活支援",
            "慢性心不全の在宅管理｜症状悪化を防ぐポイント",
            "COPD（慢性閉塞性肺疾患）の在宅ケア｜呼吸管理",
            "糖尿病の在宅看護｜血糖管理とフットケア",
            "認知症の在宅ケア｜BPSDへの対応と家族支援",
            "がん在宅療養｜疼痛管理と緩和ケアの実践",
            "ALS（筋萎縮性側索硬化症）の在宅看護",
            "脊髄損傷の在宅ケア｜自律神経障害と褥瘡管理",
            "慢性腎不全・透析患者の在宅看護",
            "精神疾患の訪問看護｜統合失調症・うつ病のケア",
            "小児在宅医療｜医療的ケア児への訪問看護",
            "誤嚥性肺炎の予防と口腔ケア｜在宅でできること",
            "骨粗鬆症・骨折後の在宅ケア｜転倒予防と疼痛管理",
            "慢性疼痛の在宅管理｜疼痛評価とケアプラン",
            "高齢者の低栄養・サルコペニア対策",
            "浮腫（むくみ）の在宅ケア｜原因別アプローチ",
            "尿路感染症の予防と管理｜カテーテル管理を含む",
        ],
    },
    "for-family": {
        "name": "家族向け",
        "slug": "for-family",
        "topics": [
            "在宅療養の始め方｜退院後の準備チェックリスト",
            "介護する家族のメンタルヘルス｜燃え尽き症候群を防ぐ",
            "レスパイトケアとは｜介護者の休息を支援する制度",
            "家族が知っておくべき緊急時の対応手順",
            "認知症の親の在宅介護｜困った場面への対処法",
            "在宅酸素療法の管理｜家族ができるサポート",
            "経管栄養の在宅管理｜家族への指導ポイント",
            "ストーマ（人工肛門）ケアの基本｜家族向け解説",
            "在宅での看取り｜家族が知っておくべきこと",
            "介護負担を軽減する住環境整備｜バリアフリー改修",
            "在宅療養中の医療費｜費用の目安と節約方法",
            "遠距離介護の実態と工夫｜離れて暮らす家族のために",
            "介護と仕事の両立｜介護離職を防ぐ制度と工夫",
            "子供への病気の説明｜小児がんや重病の親を持つ家族へ",
            "グリーフケア｜大切な人を亡くした後の心のケア",
        ],
    },
    "insurance": {
        "name": "制度・保険",
        "slug": "insurance",
        "topics": [
            "訪問看護の医療保険と介護保険｜違いと使い分け",
            "介護認定の申請方法｜要介護度の目安と手続き",
            "訪問看護の費用と自己負担｜料金の仕組みを解説",
            "高額療養費制度｜訪問看護・在宅医療への適用",
            "障害者総合支援法と訪問看護｜65歳問題を解説",
            "精神科訪問看護の制度｜算定要件と注意点",
            "小児在宅医療の制度｜医療的ケア児支援法",
            "難病指定を受けた場合の訪問看護｜特定医療費",
            "訪問看護のケアプラン｜居宅サービス計画との関係",
            "看護師特定行為｜在宅でできる医療行為の拡大",
            "地域医療構想と在宅シフト｜今後の在宅医療の方向性",
            "訪問看護の加算制度｜緊急・ターミナル・専門管理",
            "介護保険改定の動向｜最新制度変更のポイント",
            "生活保護受給者の訪問看護｜利用の仕組みと注意点",
        ],
    },
    "career": {
        "name": "キャリア",
        "slug": "career",
        "topics": [
            "訪問看護師の給与・年収｜相場と収入アップの方法",
            "訪問看護師になるには｜必要な資格と経験",
            "病院看護師から訪問看護師へ｜転職の流れと注意点",
            "訪問看護ステーションの開業｜手続きと必要な準備",
            "訪問看護師の働き方｜常勤・非常勤・パートの違い",
            "訪問看護師のやりがいと大変さ｜リアルな声を紹介",
            "管理者（所長）になるには｜訪問看護のキャリアパス",
            "訪問看護に役立つ資格｜認定看護師・専門看護師",
            "新卒・経験1年目でも訪問看護師になれるか",
            "訪問看護師のバーンアウト防止｜自己ケアの方法",
            "男性看護師の訪問看護｜活躍の場と課題",
            "訪問看護師の離職理由と対策｜定着率向上のヒント",
            "訪問看護ステーションの経営｜収益化のポイント",
            "ICT活用で変わる訪問看護業務｜電子記録・テレナーシング",
        ],
    },
    "medical-skills": {
        "name": "医療技術",
        "slug": "medical-skills",
        "topics": [
            "褥瘡（床ずれ）の予防と在宅ケア｜管理のポイント",
            "訪問看護における感染対策｜標準予防策の実践",
            "在宅での注射・点滴管理｜安全な手技と注意点",
            "気管切開の在宅ケア｜吸引・カニューレ管理",
            "在宅経管栄養｜NGチューブ・胃ろうの管理",
            "膀胱留置カテーテルの管理｜感染予防と定期交換",
            "在宅酸素療法（HOT）の管理｜機器の使い方と注意点",
            "人工呼吸器の在宅管理｜回路交換とトラブル対応",
            "フットケアの実践｜糖尿病足病変・爪切り・スキンケア",
            "口腔ケアの実践｜誤嚥性肺炎予防と嚥下評価",
            "疼痛評価ツールの使い方｜NRS・VAS・フェイススケール",
            "バイタルサインの正確な測定と解釈｜在宅でのポイント",
            "在宅での採血・血糖測定｜手技と検体の取り扱い",
            "浣腸・摘便の在宅実施｜適応と安全な手順",
            "リンパ浮腫のケア｜用手的リンパドレナージの基本",
            "嚥下評価と食形態の選択｜在宅でできるアセスメント",
            "精神科訪問看護のスキル｜服薬管理と危機介入",
            "在宅での創傷ケア｜術後創・皮膚潰瘍の処置",
        ],
    },
}

# ============================================================
# SEO最適化プロンプト
# ============================================================
SYSTEM_PROMPT = """あなたは訪問看護・在宅医療の専門知識を持つ、SEOに精通したコンテンツライターです。
E-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）を重視した、
読者にとって本当に役立つ高品質な医療情報記事を書いてください。

記事作成の原則：
- 正確な医療情報に基づく（推測・誇張は避ける）
- 現場の訪問看護師の視点と経験を反映する
- 家族や一般読者にもわかりやすい言葉を使う
- 具体的な数値・手順・チェックリストを含める
- 適切な警告・注意事項を含める（医師への相談推奨など）"""

def build_article_prompt(title: str, category_name: str) -> str:
    return f"""以下の訪問看護記事を日本語で作成してください。

タイトル: {title}
カテゴリ: {category_name}

## 記事要件

**構成（必須）:**
1. イントロダクション（150-200字）: 読者の悩み・課題に共感し、記事で解決できることを示す
2. 本文: H2見出し4-6個、各H2の下にH3を2-3個
3. まとめ（100-150字）: 重要ポイントの再確認と次のアクション
4. よくある質問（FAQ）セクション: Q&Aを3つ（H2「よくある質問」の下にH3でQ、テキストでA）

**品質基準:**
- 文字数: 5000字以上
- 具体的な手順・チェックリスト・表を含める
- 数値データ・ガイドライン・根拠を示す
- 専門用語は初出時に括弧でわかりやすく説明
- 「〇〇については主治医・訪問看護師に相談してください」などの免責事項を適切に含める

**SEO要件:**
- メタディスクリプション: 120-155文字で記事の価値を説明（description:フィールドに記載）
- タグ: 関連キーワード5個（訪問看護を含む）

**出力形式（Markdownフロントマター付き）:**

---
title: "{title}"
description: "（ここにメタディスクリプション120-155文字）"
publishDate: {{DATE}}
category: "{category_name}"
tags: [（タグ5個をカンマ区切りで）]
author: "HOKAN STATION編集部"
---

（記事本文）
"""

# ============================================================
# 重複チェック
# ============================================================
def get_existing_titles(blog_dir: Path) -> set:
    titles = set()
    for md_file in blog_dir.glob("*.md"):
        try:
            content = md_file.read_text(encoding="utf-8")
            match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
            if match:
                titles.add(match.group(1).strip())
        except Exception:
            pass
    return titles

def get_existing_slugs(blog_dir: Path) -> set:
    return {f.stem for f in blog_dir.glob("*.md")}

# ============================================================
# ファイル名生成
# ============================================================
def generate_filename(date_str: str, category_slug: str, existing_slugs: set) -> str:
    n = 1
    while True:
        slug = f"{date_str}-{category_slug}-{n:02d}"
        if slug not in existing_slugs:
            return slug
        n += 1

# ============================================================
# 記事生成
# ============================================================
def generate_article(client: anthropic.Anthropic, title: str, category: dict, date_str: str) -> str:
    prompt = build_article_prompt(title, category["name"]).replace("{DATE}", date_str)

    message = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()
    # AIがコードフェンスで囲んだ場合は除去
    if text.startswith("```markdown\n"):
        text = text[len("```markdown\n"):]
    elif text.startswith("```\n"):
        text = text[len("```\n"):]
    if text.endswith("```"):
        text = text[:-3].rstrip() + "\n"
    return text

# ============================================================
# メイン
# ============================================================
def main():
    parser = argparse.ArgumentParser(description="HOKAN STATION 記事自動生成")
    parser.add_argument("--count", type=int, default=10, help="生成する記事数")
    parser.add_argument("--date", type=str, default="", help="公開日 (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="ファイルを保存せず確認のみ")
    args = parser.parse_args()

    # 日付設定
    if args.date:
        date_str = args.date
    else:
        jst = timezone(timedelta(hours=9))
        date_str = datetime.now(jst).strftime("%Y-%m-%d")

    print(f"📅 公開日: {date_str}")
    print(f"📝 生成数: {args.count} 本")

    # APIキー確認
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY が設定されていません", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # ブログディレクトリ
    blog_dir = Path(__file__).parent.parent / "src" / "content" / "blog"
    blog_dir.mkdir(parents=True, exist_ok=True)

    # 既存記事チェック
    existing_titles = get_existing_titles(blog_dir)
    existing_slugs = get_existing_slugs(blog_dir)
    print(f"📂 既存記事: {len(existing_slugs)} 本")

    # トピックリスト作成（全カテゴリをフラット化・重複除外）
    available_topics = []
    for cat_slug, cat_data in CATEGORIES.items():
        for topic in cat_data["topics"]:
            # タイトルの重複チェック（部分一致も含む）
            topic_key = topic.split("｜")[0]
            already_used = any(topic_key in t for t in existing_titles)
            if not already_used:
                available_topics.append((cat_slug, cat_data, topic))

    if len(available_topics) < args.count:
        print(f"⚠️ 利用可能なトピック: {len(available_topics)} 本（要求: {args.count} 本）")
        count = len(available_topics)
    else:
        count = args.count

    if count == 0:
        print("✅ 生成すべきトピックがありません（全て生成済み）")
        sys.exit(0)

    # APIキー事前検証
    print("🔑 APIキーを検証中...")
    try:
        client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=10,
            messages=[{"role": "user", "content": "test"}],
        )
        print("  ✅ APIキー有効")
    except anthropic.AuthenticationError as e:
        print(f"❌ APIキーが無効です: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"⚠️ API検証エラー（続行）: {e}", file=sys.stderr)

    print(f"📋 利用可能トピック: {len(available_topics)} 件")

    # 生成実行
    generated = 0
    errors = 0
    for i in range(count):
        cat_slug, cat_data, topic = available_topics[i]
        print(f"\n[{i+1}/{count}] 生成中: {topic}")

        if args.dry_run:
            print(f"  [DRY RUN] カテゴリ: {cat_data['name']}")
            generated += 1
            continue

        try:
            content = generate_article(client, topic, cat_data, date_str)

            # ファイル名生成
            filename = generate_filename(date_str, cat_slug, existing_slugs)
            filepath = blog_dir / f"{filename}.md"
            existing_slugs.add(filename)

            # フロントマターの日付プレースホルダを置換（念のため）
            content = content.replace("{DATE}", date_str)

            # ファイル保存
            filepath.write_text(content, encoding="utf-8")
            print(f"  ✅ 保存: {filepath.name}")
            generated += 1

            # レート制限対策
            if i < count - 1:
                time.sleep(1)

        except anthropic.AuthenticationError as e:
            print(f"  ❌ 認証エラー（APIキーを確認）: {e}", file=sys.stderr)
            sys.exit(1)
        except anthropic.APIError as e:
            print(f"  ❌ API エラー: {e}", file=sys.stderr)
            if "overloaded" in str(e).lower():
                print("  ⏳ 過負荷のため30秒待機します...")
                time.sleep(30)
            errors += 1
            continue
        except Exception as e:
            print(f"  ❌ エラー: {e}", file=sys.stderr)
            errors += 1
            continue

    print(f"\n🎉 完了: {generated} 本生成 / {errors} 本エラー")
    if generated == 0 and not args.dry_run:
        print("❌ 記事が1本も生成されませんでした", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
