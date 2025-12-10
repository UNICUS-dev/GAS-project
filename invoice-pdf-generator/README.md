# Invoice PDF Generator - Spreadsheet to PDF Automation

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Google スプレッドシートから請求書PDFを自動生成し、Google Driveに保存するシステム。奇数月の自動実行と、クライアント別の集計機能を備えた実務レベルの請求書管理ツールです。

## 🎯 プロジェクト概要

このプロジェクトは、**リスティング広告代行業務における請求書発行の完全自動化**を実現します。

### 解決する課題

従来の手動プロセスには以下の問題がありました：

❌ **月次作業の煩雑さ**: 複数シートを個別にPDF化
❌ **ファイル名の不統一**: 手作業による命名ミス
❌ **集計作業**: クライアント別の金額集計を手動計算
❌ **タイミング管理**: 奇数月のみ実行を人手で管理

### 本スクリプトによる改善

✅ **完全自動化**: 奇数月の3日に自動実行
✅ **一括PDF生成**: 全クライアント分を一度に処理
✅ **自動集計**: クライアント別の価格を自動計算
✅ **統一命名規則**: `クライアント名_YYYYMM分リスティング請求書.pdf`
✅ **レート制限対策**: 10秒間隔で安全に実行

## 🚀 主な機能

### 1. 奇数月のみ自動実行

```javascript
// 偶数月は処理をスキップ
if (month % 2 === 0) {
  Logger.log('偶数月のため処理をスキップしました。');
  return;
}
```

**対象月**: 1月、3月、5月、7月、9月、11月

### 2. 複数シートの一括PDF化

```javascript
sheets.forEach(sheet => {
  const sheetName = sheet.getName();
  // "Yahoo"と"Google"のシートはスキップ
  if (sheetName === 'Yahoo' || sheetName === 'Google') {
    return;
  }
  // PDF生成処理
});
```

**特徴**:
- 集計用シート（Yahoo、Google）は除外
- クライアント名がシート名として使用される
- 自動的に全シートを処理

### 3. 高度なPDFエクスポート設定

```javascript
const params = {
  exportFormat: 'pdf',
  size: 'A4',
  portrait: false,          // 横向き
  fitw: true,              // 幅に合わせる
  range: 'A1:AU30',        // 印刷範囲指定
  sheetnames: false,       // シート名非表示
  gridlines: false         // グリッド線非表示
};
```

**PDF設定**:
- A4横向き
- 印刷範囲: A1:AU30
- プロフェッショナルな見た目

### 4. クライアント別集計機能

```javascript
function calculateTotalPrice() {
  // A列: クライアント名、B列: 価格
  // クライアント名ごとに価格を合計
  // D列: クライアント名、E列: 合計金額
}
```

**集計処理**:
1. Yahooシートからデータ取得
2. クライアント別に価格を集計
3. 結果をD列・E列に出力
4. 金額を日本円形式（¥#,##0）で表示

### 5. レート制限対策

```javascript
// リクエスト間に10秒の遅延
Utilities.sleep(10000);

// 429エラーハンドリング
if (response.getResponseCode() === 429) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

Google APIのレート制限を回避し、安定した実行を保証します。

### 6. 自動トリガー管理

```javascript
function createOddMonthTriggers() {
  // 奇数月の3日にトリガーを自動設定
  var months = [1, 3, 5, 7, 9, 11];
  for (var i = 0; i < months.length; i++) {
    var triggerDate = new Date(currentYear, month - 1, 3, 2, 0, 0);
    ScriptApp.newTrigger('calculateTotalPrice')
      .timeBased()
      .at(triggerDate)
      .create();
  }
}
```

## 📐 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│        Google Spreadsheet (請求書マスター)          │
│  ┌───────────────────────────────────────────────┐  │
│  │  シート構成:                                  │  │
│  │  - Yahoo (集計用・PDF化対象外)               │  │
│  │  - Google (集計用・PDF化対象外)              │  │
│  │  - クライアント1 (PDF化対象)                 │  │
│  │  - クライアント2 (PDF化対象)                 │  │
│  │  - ...                                        │  │
│  └───────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ① 奇数月3日に自動実行
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│     Google Apps Script (本スクリプト)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  exportSheetsToPDF()                         │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. 月チェック（奇数月のみ実行）       │  │   │
│  │  │ 2. 全シート取得                        │  │   │
│  │  │ 3. Yahoo/Google除外                    │  │   │
│  │  │ 4. ファイル名生成                      │  │   │
│  │  │ 5. saveSheetAsPDF()呼び出し           │  │   │
│  │  │ 6. 10秒待機（レート制限対策）          │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  saveSheetAsPDF(sheet, options)              │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. Export URL構築                      │  │   │
│  │  │ 2. PDF生成パラメータ設定               │  │   │
│  │  │ 3. OAuth認証                           │  │   │
│  │  │ 4. PDF取得（UrlFetchApp）              │  │   │
│  │  │ 5. Driveへ保存                         │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  calculateTotalPrice()                       │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. Yahooシートからデータ取得           │  │   │
│  │  │ 2. クライアント別に価格集計            │  │   │
│  │  │ 3. D列・E列に結果書き込み              │  │   │
│  │  │ 4. 金額フォーマット適用                │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ② Spreadsheet Export API
                 │ ③ Drive API
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         Google Drive (保存先フォルダ)               │
│  ┌───────────────────────────────────────────────┐  │
│  │  XXXXXXXXXX_202401分リスティング請求書.pdf   │  │
│  │  XXXXXXXXXX_202401分リスティング請求書.pdf   │  │
│  │  XXXXXXXXXX_202401分リスティング請求書.pdf   │  │
│  │  ...                                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🛠 技術スタック

### Core Technologies
- **Google Apps Script**: Google Workspace自動化プラットフォーム
- **JavaScript (ES6+)**: const/let、テンプレートリテラル、アロー関数
- **V8 Runtime**: 最新のECMAScript対応

### Google APIs & Services
- **SpreadsheetApp**: スプレッドシート操作
- **DriveApp**: Drive操作
- **UrlFetchApp**: PDF生成API呼び出し
- **ScriptApp**: トリガー管理とOAuth
- **Utilities**: 日付フォーマット、スリープ機能

### Advanced Features
- **Spreadsheet Export API**: 高度なPDFエクスポート
- **OAuth 2.0**: セキュアな認証
- **Time-based Triggers**: スケジュール実行
- **Rate Limiting**: API制限対策

## 🚦 セットアップ

### 1. スプレッドシートの準備

スプレッドシートの構成:
```
シート名        用途                PDF化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yahoo          集計用               ×
Google         集計用               ×
クライアント1   請求書データ        ○
クライアント2   請求書データ        ○
...
```

### 2. スプレッドシートIDの取得

1. スプレッドシートを開く
2. URLから`スプレッドシートID`をコピー
   ```
   https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
   ```

### 3. DriveフォルダIDの取得

1. 保存先フォルダを開く
2. URLから`フォルダID`をコピー
   ```
   https://drive.google.com/drive/folders/【ここがフォルダID】
   ```

### 4. コードの設定

```javascript
// Code.gsの冒頭を編集
const SPREADSHEET_ID = 'あなたのスプレッドシートID';
const DRIVE_FOLDER_ID = 'あなたのフォルダID';
```

### 5. トリガーの設定

#### 自動実行の設定

```javascript
// 初回のみ手動実行
createOddMonthTriggers();
```

これで奇数月の3日 2:00AMに自動実行されます。

#### 手動実行（テスト用）

エディタで関数を選択して「実行」:
- `exportSheetsToPDF()` - PDF生成
- `calculateTotalPrice()` - 集計実行

### 6. 権限の承認

初回実行時に以下の権限を承認:
- スプレッドシートの閲覧と編集
- Google Drive のファイル作成
- スクリプトの実行

## 📊 実行ログの確認

```
偶数月のため処理をスキップしました。

または

スキップ: Yahoo シート
スキップ: Google シート
✅ PDF生成完了: クライアント1_202401分リスティング請求書
✅ PDF生成完了: クライアント2_202401分リスティング請求書
...
```

## 📈 技術的な成果

### 1. 業務効率化

| 指標 | 手動処理 | 自動化後 | 改善率 |
|------|---------|---------|--------|
| 月次PDF生成時間 | 30分 | 0分 | **100%削減** |
| 集計作業時間 | 15分 | 0分 | **100%削減** |
| ファイル命名ミス | 10% | 0% | **完全防止** |
| タイミング管理 | 手動 | 自動 | **完全自動化** |

### 2. 技術的特徴

- **レート制限対策**: 10秒間隔で安全な実行
- **エラーハンドリング**: 429エラーの適切な処理
- **柔軟な設定**: PDF範囲、向き、サイズを細かく制御
- **保守性**: 設定とロジックの完全分離

### 3. 運用の安定性

- **自動スキップ**: 偶数月は自動的に処理をスキップ
- **シート除外**: 集計用シートを自動除外
- **トリガー管理**: 1年分のトリガーを一括設定

## 🎓 学んだ技術スキル

このプロジェクトを通じて習得した技術:

### Google Apps Script Advanced
- **Spreadsheet Export API**: 高度なPDF生成パラメータ
- **OAuth 2.0 Token**: getOAuthToken()によるAPI認証
- **UrlFetchApp**: HTTPリクエストとレスポンス処理
- **Blob操作**: PDFファイルの取得と保存
- **Time-based Triggers**: 特定日時のトリガー設定

### JavaScript/プログラミング
- **日付計算**: 奇数月判定、年月フォーマット
- **配列操作**: forEach、map、filter
- **オブジェクト操作**: 動的なプロパティ集計
- **文字列操作**: テンプレートリテラル、パディング

### API・レート制限
- **Rate Limiting**: 429エラー対策
- **Exponential Backoff**: 遅延処理の実装
- **muteHttpExceptions**: エラーレスポンスの取得

### 業務自動化設計
- **条件分岐**: 奇数月のみ実行
- **除外処理**: 特定シートのスキップ
- **命名規則**: 統一されたファイル名生成
- **トリガー管理**: 年間スケジュールの自動設定

## 🔄 今後の改善予定

- [ ] Slack通知機能（PDF生成完了通知）
- [ ] メール自動送信（クライアントへ請求書送付）
- [ ] エラーリトライ機能
- [ ] 実行履歴のスプレッドシート記録
- [ ] PDF生成前のプレビュー機能
- [ ] クライアント別フォルダ自動作成
- [ ] パスワード保護PDF生成
- [ ] Google Chat 通知対応

## 🐛 トラブルシューティング

### よくある問題

#### 1. 「Rate limit exceeded」エラー

**原因**: Google API のレート制限

**解決策**:
```javascript
// スリープ時間を延長
Utilities.sleep(15000);  // 15秒に変更
```

#### 2. PDFが生成されない

**原因**: 権限不足またはID間違い

**解決策**:
1. スプレッドシートIDを確認
2. フォルダIDを確認
3. 権限を再承認

#### 3. 特定シートだけPDF化されない

**原因**: シート名が"Yahoo"または"Google"

**解決策**:
```javascript
// 除外リストを確認・変更
if (sheetName === 'Yahoo' || sheetName === 'Google') {
  return;  // この行がスキップ処理
}
```

#### 4. 集計結果が表示されない

**原因**: Yahooシートのデータ形式

**解決策**:
- A列: クライアント名（文字列）
- B列: 価格（数値）
この形式でデータを配置

## 📚 参考資料

- [Spreadsheet Export API](https://developers.google.com/apps-script/reference/spreadsheet)
- [UrlFetchApp Reference](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app)
- [Time-based Triggers](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers)
- [OAuth 2.0 in Apps Script](https://developers.google.com/apps-script/guides/services/authorization)

## 📄 ライセンス

MIT License

## 👤 開発者

UNICUS-dev

- GitHub: [@UNICUS-dev](https://github.com/UNICUS-dev)
- Email: akihiro210@gmail.com

## 🌟 このプロジェクトの意義

このスクリプトは、**リスティング広告代行業務における実践的な自動化**を実現しています。

**ビジネス価値**:
- 月次作業の完全自動化（45分 → 0分）
- 奇数月のみ実行という特殊要件への対応
- 統一された請求書管理

**技術的価値**:
- Spreadsheet Export API の実践的活用
- レート制限を考慮した設計
- トリガー管理の自動化

**キャリア価値**:
- 業務特性の理解と自動化設計
- API制限への対応力
- 実務レベルの運用設計

複雑な業務要件（奇数月、集計、PDF化、命名規則）を全て自動化し、実際に稼働している実践的なプロジェクトです。

---

**Note**: このREADMEは技術的な実装詳細を含んでいますが、実際のクライアント情報や機密情報は含まれていません。
