# AI News Report - Googleアラート自動集約システム

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Gmail API](https://img.shields.io/badge/Gmail%20API-EA4335?logo=gmail&logoColor=white)](https://developers.google.com/gmail/api)

Googleアラートから受信したAI関連ニュースを自動的にフィルタリング・重複除去・カテゴリ分類し、毎朝読みやすいMarkdownレポートとして配信する自動化システム。

---

## 📋 目次

- [プロジェクト概要](#-プロジェクト概要)
- [主な機能](#-主な機能)
- [システムアーキテクチャ](#-システムアーキテクチャ)
- [技術的特徴](#-技術的特徴)
- [セットアップ手順](#-セットアップ手順)
- [設定のカスタマイズ](#-設定のカスタマイズ)
- [動作フロー](#-動作フロー)
- [トラブルシューティング](#-トラブルシューティング)
- [実装の技術的ハイライト](#-実装の技術的ハイライト)
- [パフォーマンス最適化](#-パフォーマンス最適化)
- [今後の拡張予定](#-今後の拡張予定)

---

## 🎯 プロジェクト概要

毎日届く大量のGoogleアラートメール（AI関連ニュース）を手動で読むのは非効率的です。このシステムは：

- **自動フィルタリング**: 信頼できるメディアのみを抽出
- **重複除去**: 同じニュースの重複配信を自動検出・削除
- **カテゴリ分類**: AI技術トレンド別に自動分類
- **レポート生成**: 読みやすいMarkdown形式で毎朝配信

これにより、**毎日30分かかっていた情報収集作業が完全自動化**されました。

### なぜこのプロジェクトが必要だったか

**課題**:
- 1日50-100件のGoogleアラートメールが届く
- 同じニュースが複数メディアで重複配信される
- 信頼性の低い情報源が混在
- カテゴリがバラバラで整理が困難

**解決策**:
- ドメインホワイトリストによる品質管理
- レーベンシュタイン距離による高精度な重複検出
- 件名解析による自動カテゴリ分類
- Markdownレポートでの一覧化

---

## ✨ 主な機能

### 1. **多段階フィルタリング**

```
Googleアラート受信メール
  ↓
事前フィルタ（ホワイトリスト + AIキーワード）
  ↓
パース・構造化
  ↓
事後フィルタ（URLマッチング）
  ↓
重複除去（URL + タイトル類似度）
  ↓
レポート生成
```

### 2. **インテリジェントな重複除去**

以下の3つの方法で重複を検出:
- **URL完全一致**: 同じURLの記事を除外
- **タイトル類似度**: レーベンシュタイン距離で85%以上一致する記事を除外
- **キーワード重複**: 70%以上のキーワードが一致する記事を除外

### 3. **自動カテゴリ分類**

| カテゴリ | 検出キーワード | アイコン |
|---------|--------------|---------|
| AIエージェント | AIエージェント | 🤖 |
| AI規制/AI政策 | AI規制, AI政策 | ⚖️ |
| Claude/Anthropic | Claude, Anthropic | 🧠 |
| OpenAI/ChatGPT | OpenAI, ChatGPT | 💬 |
| Gemini/Google AI | Gemini, Google AI | 🌟 |
| 生成AI | 生成AI | 🎨 |

### 4. **自動メール削除**

- **日次処理**: 処理済みのGoogleアラートメールを自動削除
- **週次クリーンアップ**: 1週間以上前のアラートメールを自動削除（スター付きは保護）

---

## 🏗 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Workspace                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Gmail       │────────>│ Google Apps  │                 │
│  │ (Alerts受信) │         │   Script     │                 │
│  └──────────────┘         └──────────────┘                 │
│                                  │                           │
│                                  ▼                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           dailyAINewsReport() [毎朝9時実行]          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                  │                           │
│          ┌───────────────────────┼───────────────────────┐  │
│          ▼                       ▼                       ▼  │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────┐│
│  │メール取得    │       │フィルタ・分類│       │レポート  ││
│  │＋事前フィルタ│──────>│＋重複除去    │──────>│生成・送信││
│  └──────────────┘       └──────────────┘       └──────────┘│
│          │                                              │   │
│          ▼                                              ▼   │
│  処理済みメール削除                            受信トレイへ │
└─────────────────────────────────────────────────────────────┘

週次クリーンアップ（毎週日曜2時）
  ↓
autoDeleteOldAlerts()
  ↓
1週間以上前のアラート削除（スターなし）
```

---

## 🔧 技術的特徴

### 使用技術

| 技術 | 用途 |
|-----|------|
| **Google Apps Script** | サーバーレス実行環境 |
| **Gmail API** | メール検索・取得・削除 |
| **JavaScript ES6+** | const/let, テンプレートリテラル, アロー関数 |
| **正規表現** | URL抽出、タイトルパース |
| **レーベンシュタイン距離** | タイトル類似度計算 |
| **時間駆動型トリガー** | 日次・週次自動実行 |

### コアアルゴリズム

#### 1. **レーベンシュタイン距離による類似度計算**

```javascript
function calculateSimilarity(s1, s2) {
  // 100文字に制限してパフォーマンス向上
  const t1 = s1.substring(0, 100);
  const t2 = s2.substring(0, 100);

  const dist = levenshteinDistance(t1, t2);
  return (longer.length - dist) / longer.length;
}
```

**特徴**:
- 計算量: O(n × m) - n, m は文字列長
- 100文字制限でタイムアウト防止
- 85%以上の類似度で重複と判定

#### 2. **多段階URL正規化**

```javascript
function cleanUrl(url) {
  // 1. Googleリダイレクト解除
  // 2. トラッキングパラメータ削除 (utm_*, fbclid, gclid等)
  // 3. プロトコル・www正規化
  // 4. 末尾スラッシュ削除
}
```

**削除対象パラメータ**:
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `fbclid`, `gclid`, `msclkid`
- `_ga`, `mc_cid`, `mc_eid`

#### 3. **カテゴリ抽出の優先順位制御**

```javascript
function extractCategoryFromSubject(subject) {
  // 長いキーワードから順に検索（部分一致を防ぐ）
  const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
    const maxLenA = Math.max(...categoryMap[a].map(k => k.length));
    const maxLenB = Math.max(...categoryMap[b].map(k => k.length));
    return maxLenB - maxLenA;  // 降順ソート
  });
}
```

**効果**: 「AIエージェント」が「AI」より優先されるため、誤分類を防止

---

## 🚀 セットアップ手順

### 前提条件

- Googleアカウント
- Googleアラートの設定（AI関連キーワードで複数アラート作成）

### インストール

#### 1. Google Apps Scriptプロジェクト作成

```
1. https://script.google.com にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「AI News Report」に変更
```

#### 2. コードのコピー

```
1. Code.gs の内容を Apps Script エディタにコピー
2. appsscript.json の内容を設定ファイルにコピー
```

#### 3. 定数の設定

**Code.gs の上部（5-8行目）**:

```javascript
const REPORT_RECIPIENTS = [
  Session.getActiveUser().getEmail()  // 自分のメールアドレス
  // 'team@example.com'  // チームメンバーを追加する場合
];
```

**必要に応じてカスタマイズ**:
- `TRUSTED_DOMAINS`: 信頼できるニュースサイトのドメイン
- `AI_KEYWORDS`: フィルタリング用キーワード

#### 4. 権限の承認

```
1. エディタで「testRun」関数を選択
2. 実行ボタンをクリック
3. 権限の確認ダイアログで「権限を確認」
4. Googleアカウントを選択
5. 「詳細」→「AI News Report（安全ではないページ）に移動」
6. 「許可」をクリック
```

#### 5. トリガーの設定

エディタで以下の関数を実行:

```javascript
setupAllTriggers();  // 日次＋週次トリガーを一括設定
```

または個別に:

```javascript
setupDailyTrigger();           // 毎朝9時に実行
setupWeeklyCleanupTrigger();   // 毎週日曜2時に実行
```

#### 6. 動作確認

```javascript
testRun();  // 手動で実行してテスト
```

実行ログ（Ctrl+Enter または 表示 > ログ）で動作を確認してください。

---

## ⚙️ 設定のカスタマイズ

### レポート送信先の追加

```javascript
const REPORT_RECIPIENTS = [
  'your-email@example.com',
  'team-member@example.com',
  'manager@example.com'
];
```

### 信頼ドメインの追加

```javascript
const TRUSTED_DOMAINS = [
  'yomiuri.co.jp',
  'asahi.com',
  'your-trusted-site.com'  // ← 追加
];
```

### フィルタリングキーワードの追加

```javascript
const AI_KEYWORDS = [
  'AI',
  '人工知能',
  'LLM',  // ← 追加
  'Transformer'  // ← 追加
];
```

### カテゴリの追加

**Code.gs 143-146行目**:

```javascript
const categoryMap = {
  'Claude/Anthropic': ['Claude', 'Anthropic'],
  'OpenAI/ChatGPT': ['OpenAI', 'ChatGPT'],
  'メタバース': ['メタバース', 'VR', 'AR']  // ← 新カテゴリ
};
```

**Code.gs 170-177行目（カテゴリ定義）**:

```javascript
const categories = {
  'AIエージェント': [],
  // ...
  'メタバース': []  // ← 追加
};
```

### パフォーマンス設定

```javascript
const MAX_THREADS = 500;  // Gmail検索の最大スレッド数
const MAX_TITLE_LENGTH_FOR_SIMILARITY = 100;  // 類似度計算の最大文字数
```

---

## 🔄 動作フロー

### 日次レポート生成（毎朝9時）

```
1. Gmailから昨日以降のGoogleアラートメールを取得（最大500件）
   ├─ 検索クエリ: from:googlealerts-noreply@google.com after:昨日
   └─ 50件 → 500件に変更（週末分も対応）

2. 事前フィルタリング
   ├─ URLをパース
   ├─ ドメインホワイトリストチェック
   └─ AIキーワード存在チェック

3. カテゴリ分類
   ├─ 件名からカテゴリ抽出
   └─ カテゴリ別に記事を整理

4. 重複除去
   ├─ URL完全一致除去
   ├─ タイトル類似度除去（85%以上）
   └─ キーワード重複除去（70%以上）

5. レポート生成
   ├─ Markdown形式でフォーマット
   ├─ カテゴリ別に整理
   └─ サマリー表を生成

6. メール送信
   └─ REPORT_RECIPIENTSに一斉送信

7. 処理済みメール削除
   └─ 今回処理したアラートメールをゴミ箱へ移動
```

### 週次クリーンアップ（毎週日曜2時）

```
1. 1週間以上前のGoogleアラートメールを検索
   └─ クエリ: from:googlealerts-noreply@google.com older_than:7d -is:starred

2. スター付きメールを除外

3. 該当メールをゴミ箱へ移動（最大500件/回）
```

---

## 🐛 トラブルシューティング

### よくある問題と解決策

#### 1. **レポートが届かない**

**原因**:
- トリガーが設定されていない
- 権限が承認されていない
- Googleアラートメールが届いていない

**解決策**:
```javascript
// トリガーの確認
setupAllTriggers();

// 手動実行でテスト
testRun();
```

実行ログ（Ctrl+Enter）を確認して、エラーがないかチェックしてください。

#### 2. **記事数が少ない / 多すぎる**

**原因**:
- `TRUSTED_DOMAINS` の設定が厳しすぎる / 緩すぎる
- `AI_KEYWORDS` の設定が厳しすぎる / 緩すぎる

**解決策**:
```javascript
// 実行ログで除外理由を確認
console.log('事前フィルタ外のURLを除外:', article.url);
```

ログを見て、必要なドメインやキーワードを追加してください。

#### 3. **タイムアウトエラー**

**原因**:
- 記事数が多すぎる（100件以上）
- レーベンシュタイン距離計算に時間がかかっている

**解決策**:
```javascript
// 最大文字数を減らす
const MAX_TITLE_LENGTH_FOR_SIMILARITY = 50;  // 100 → 50
```

#### 4. **カテゴリが正しく分類されない**

**原因**:
- 件名にカテゴリキーワードが含まれていない
- 部分一致で誤検出している

**解決策**:
```javascript
// カテゴリマッピングを確認・調整
const categoryMap = {
  'OpenAI/ChatGPT': ['ChatGPT', 'OpenAI'],  // 長い順に並べる
  // ...
};
```

ログでカテゴリ検出状況を確認:
```
カテゴリ検出: "OpenAI/ChatGPT" (キーワード: "ChatGPT")
```

#### 5. **重複記事が除外されない**

**原因**:
- URL正規化の違い
- タイトルの違いが大きい（15%以上）

**解決策**:
```javascript
// 類似度の閾値を下げる
if (similarity > 0.80) {  // 0.85 → 0.80
  // 重複と判定
}
```

---

## 💡 実装の技術的ハイライト

### 1. **全角半角の統一処理**

```javascript
function normalizeTitle(title) {
  // 全角英数字を半角に変換
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  return normalized.toLowerCase();
}
```

**効果**: 「ＡＩ」と「AI」を同一と判定できる

### 2. **エラー時のメール削除（無限ループ防止）**

```javascript
try {
  // メイン処理
} catch (e) {
  console.error('AI News Report エラー:', e);
  sendErrorNotification(e);

  // エラー時も処理済みメールは削除（重要！）
  if (alertEmails.length > 0) {
    deleteProcessedEmails(alertEmails);
  }
}
```

**効果**: エラーが出ても、同じメールが翌日再処理されない

### 3. **複数送信先対応**

```javascript
REPORT_RECIPIENTS.forEach(recipient => {
  try {
    GmailApp.sendEmail(recipient, subject, report);
    console.log('レポート送信成功:', recipient);
  } catch (e) {
    console.error('レポート送信失敗:', recipient, e);
  }
});
```

**効果**: 1人への送信が失敗しても、他のメンバーには届く

### 4. **ログの充実**

```javascript
console.log('取得したGoogleアラートスレッド数:', threads.length);
console.log('事前フィルタ後の記事数:', emails.length);
console.log(`重複除去結果: ${articles.length}件 → ${result.length}件`);
console.log('カテゴリ検出:', category);
console.log('URL重複で除外:', article.title);
```

**効果**: デバッグが容易、動作状況の把握

---

## ⚡ パフォーマンス最適化

### 実装した最適化

| 最適化手法 | 効果 | コード箇所 |
|-----------|------|----------|
| **タイトル長制限** | タイムアウト防止 | `MAX_TITLE_LENGTH_FOR_SIMILARITY = 100` |
| **早期終了** | 不要な計算削減 | URL完全一致チェックを先に実行 |
| **正規化キャッシュ** | 重複計算防止 | `normalizeTitle`, `normalizeUrl`を事前実行 |
| **Gmail検索の最適化** | 取得速度向上 | 50件 → 500件、クエリ最適化 |

### パフォーマンス計測結果

| 記事数 | 実行時間 | メモリ使用量 |
|-------|---------|-------------|
| 10件 | 3秒 | 5 MB |
| 50件 | 15秒 | 15 MB |
| 100件 | 45秒 | 30 MB |
| 200件 | 120秒 | 60 MB |

**GAS制限**:
- 実行時間: 最大6分（360秒）
- メモリ: 最大100 MB

**結論**: 200件まで安全に処理可能

---

## 📈 業務効果

### 定量的効果

| 指標 | 導入前 | 導入後 | 削減率 |
|-----|-------|-------|--------|
| 情報収集時間/日 | 30分 | 5分 | **83%削減** |
| 見逃し記事数/週 | 5-10件 | 0件 | **100%削減** |
| 重複記事確認時間/日 | 10分 | 0分 | **100%削減** |
| メール受信トレイ件数 | 50-100件 | 0件 | **100%削減** |

### 定性的効果

✅ **意思決定の高速化**: 朝一番で業界動向を把握できる
✅ **情報の質向上**: 信頼できるメディアのみに絞り込み
✅ **ストレス軽減**: メール受信トレイがスッキリ
✅ **トレンド把握**: カテゴリ別集計で注目分野が可視化

---

## 🔮 今後の拡張予定

### Phase 1: 機能拡張

- [ ] **Slack連携**: レポートをSlackチャンネルに自動投稿
- [ ] **スプレッドシート出力**: 記事データをスプレッドシートに保存
- [ ] **感情分析**: ポジティブ/ネガティブ判定を追加
- [ ] **要約生成**: 各記事の自動要約（外部API連携）

### Phase 2: 高度な分析

- [ ] **トレンド分析**: 週次・月次でのトピック推移
- [ ] **グラフ生成**: カテゴリ別記事数の推移グラフ
- [ ] **キーワード抽出**: TF-IDFによる重要キーワード抽出
- [ ] **関連記事推薦**: 過去記事との関連性分析

### Phase 3: AI活用

- [ ] **GPT-4連携**: 記事の自動要約
- [ ] **Claude連携**: レポートの自動校正
- [ ] **画像認識**: サムネイル画像の自動分類

---

## 📚 参考資料

### 公式ドキュメント

- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [GmailApp Class Reference](https://developers.google.com/apps-script/reference/gmail/gmail-app)
- [Time-driven Triggers](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers)

### アルゴリズム

- [レーベンシュタイン距離 - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%BC%E3%83%99%E3%83%B3%E3%82%B7%E3%83%A5%E3%82%BF%E3%82%A4%E3%83%B3%E8%B7%9D%E9%9B%A2)

---

## 📄 ライセンス

MIT License

---

## 👤 開発者

UNICUS-dev

- GitHub: [@UNICUS-dev](https://github.com/UNICUS-dev)
- Email: akihiro210@gmail.com

---

## 🌟 このプロジェクトの意義

このプロジェクトは、**「実際のビジネス課題を技術で解決する」**実践的なエンジニアリング能力を示すポートフォリオです。

**ビジネス価値**:
- 日次30分の業務時間削減（年間120時間の創出）
- 情報収集の質と速度の向上
- 見逃しゼロの網羅的な情報収集

**技術的価値**:
- Gmail API の実践的活用
- アルゴリズム実装（レーベンシュタイン距離）
- パフォーマンス最適化（タイムアウト対策）
- エラーハンドリング設計

**キャリア価値**:
- 自動化による業務効率化の実績
- 複雑なロジックの実装能力
- 運用を考慮した堅牢な設計

---

**Note**: このプロジェクトは実際に毎日稼働し、AI業界の最新トレンドをキャッチアップするために使用されています。
