# Invoice ChatWork Automation - Automated Invoice Distribution System

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![ChatWork](https://img.shields.io/badge/ChatWork-F27639?logo=chatwork&logoColor=white)](https://www.chatwork.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

スプレッドシートから請求書PDFを自動生成し、ChatWorkで各クライアントに自動送信するエンドツーエンド自動化システム。日本語ファイル名の文字化け対策とAPI連携を実装した実務レベルのソリューションです。

## 🎯 プロジェクト概要

このプロジェクトは、**請求書発行業務の完全自動化**を実現します。

### 解決する課題

従来の手動プロセスには以下の問題がありました：

❌ **時間がかかる**: PDF生成→保存→送信の繰り返し作業
❌ **ミスが発生**: 送信先の間違い、ファイル名の誤り
❌ **文字化け**: 日本語ファイル名の扱いが困難
❌ **タイミング管理**: 毎月1日に忘れずに実行

### 本スクリプトによる改善

✅ **完全自動化**: PDF生成から送信まで全自動
✅ **文字化け対策**: 一時ファイル作成→リネーム方式
✅ **クライアント別送信**: ファイル名で自動振り分け
✅ **月次自動実行**: 毎月1日に自動実行
✅ **エラーレポート**: 送信結果を詳細にログ出力

## 🚀 主な機能

### 1. 請求書PDF自動生成

```javascript
// 各シートを個別にPDF化
SHEET_NAMES.forEach(sheetName => {
  const pdfName = `請求書${dateString}(${sheetName}).pdf`;
  // PDF生成処理
});
```

**特徴**:
- 複数シートの一括PDF化
- A4横向き、グリッド線なし
- 日本語ファイル名対応

**生成例**:
```
請求書202512(XXXXXXXXXX).pdf
請求書202512(XXXXXXXXXX).pdf
...
```

### 2. 日本語ファイル名の文字化け対策

従来の問題：
```javascript
// ❌ 直接日本語ファイル名を設定すると文字化けする
file.setName('請求書202512(クライアント名).pdf');
// → 結果: �����202512(�����).pdf
```

本スクリプトの解決策：
```javascript
// ✅ 3ステップで文字化けを防止
// 1. 一時的な英数字ファイル名で作成
const tempName = 'temp_' + new Date().getTime() + '.pdf';
pdfBlob.setName(tempName);

// 2. ファイルを作成
const file = folder.createFile(pdfBlob);

// 3. 作成後に日本語ファイル名に変更
file.setName(pdfName);  // ← これで文字化けしない！
```

### 3. ChatWork API連携

```javascript
function sendFileToChatwork(roomId, file, message) {
  const endpoint = `https://api.chatwork.com/v2/rooms/${roomId}/files`;
  const options = {
    method: "post",
    headers: { "X-ChatWorkToken": CHATWORK_TOKEN },
    payload: {
      file: file.getBlob(),
      message: message
    }
  };
  // API呼び出し
}
```

**API機能**:
- ファイルアップロード
- メッセージ添付
- エラーレスポンス処理

### 4. インテリジェントなファイルマッチング

```javascript
// ファイル名からクライアント名を抽出
for (let clientName in CHATWORK_ROOMS) {
  const pattern = `(${clientName}).pdf`;
  if (name.includes(pattern)) {
    // マッチしたクライアントのルームに送信
    sendFileToChatwork(CHATWORK_ROOMS[clientName], file, message);
  }
}
```

**マッチングロジック**:
1. Driveフォルダから当月PDFを取得
2. ファイル名でクライアント名を判定
3. 対応するChatWorkルームに送信

### 5. 2段階自動実行

```javascript
// 毎月1日 3:00 → PDF生成
ScriptApp.newTrigger('exportSheetsToPdf')
  .timeBased()
  .onMonthDay(1)
  .atHour(3)
  .create();

// 毎月1日 9:00 → ChatWork送信
ScriptApp.newTrigger('sendInvoicesToChatwork')
  .timeBased()
  .onMonthDay(1)
  .atHour(9)
  .create();
```

**実行フロー**:
```
3:00 AM → PDF生成・Drive保存
  ↓ (6時間待機)
9:00 AM → ChatWork送信
```

**理由**:
- PDF生成に時間がかかる可能性
- 業務時間内（9時）に送信
- 送信前にPDFを確認できる猶予時間

### 6. 詳細なエラーハンドリング

```javascript
// 送信結果の記録
const sentFiles = [];      // 成功
const notSentFiles = [];   // 失敗

// 結果サマリー
Logger.log(`送信成功: ${sentFiles.length}件`);
Logger.log(`送信失敗/スキップ: ${notSentFiles.length}件`);
```

**ログ出力例**:
```
✓ PDF保存成功: 請求書202512(XXXXXXXXXX).pdf
✓ 送信成功: 請求書202512(XXXXXXXXXX).pdf → XXXXXXXXXX
✗ 送信失敗: 請求書202512(XXXXXXXXXX).pdf → XXXXXXXXXX (エラー: API rate limit)
⚠ 送信先不明/マッチ失敗: 請求書202512(不明クライアント).pdf

===== Chatwork送信結果 =====
送信成功: 4件
送信失敗/スキップ: 1件
```

### 7. レート制限対策

```javascript
// PDF生成間隔
Utilities.sleep(5000);  // 5秒待機

// ChatWork送信間隔
Utilities.sleep(3000);  // 3秒待機
```

Google/ChatWork APIのレート制限を回避します。

## 📐 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│      Google Spreadsheet (請求書マスター)            │
│  ┌───────────────────────────────────────────────┐  │
│  │  シート構成:                                  │  │
│  │  - XXXXXXXXXX (クライアント1の請求書)        │  │
│  │  - XXXXXXXXXX (クライアント2の請求書)        │  │
│  │  - XXXXXXXXXX (クライアント3の請求書)        │  │
│  │  - ...                                        │  │
│  └───────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ① 毎月1日 3:00 AM
                 │    exportSheetsToPdf()
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│     Google Apps Script (PDF生成エンジン)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  exportSheetsToPdf()                         │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. SHEET_NAMES をループ               │  │   │
│  │  │ 2. Export URL 構築                     │  │   │
│  │  │ 3. PDF Blob 取得                       │  │   │
│  │  │ 4. 一時ファイル名で作成                │  │   │
│  │  │ 5. 日本語ファイル名にリネーム          │  │   │
│  │  │ 6. 5秒待機（レート制限対策）           │  │   │
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
│  │  請求書202512(XXXXXXXXXX).pdf                 │  │
│  │  請求書202512(XXXXXXXXXX).pdf                 │  │
│  │  請求書202512(XXXXXXXXXX).pdf                 │  │
│  │  ...                                          │  │
│  └───────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ④ 毎月1日 9:00 AM
                 │    sendInvoicesToChatwork()
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│     Google Apps Script (配信エンジン)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  sendInvoicesToChatwork()                    │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. Driveフォルダから当月PDF取得        │  │   │
│  │  │ 2. ファイル名でクライアント判定        │  │   │
│  │  │ 3. CHATWORK_ROOMSマッピング           │  │   │
│  │  │ 4. sendFileToChatwork()呼び出し       │  │   │
│  │  │ 5. 結果記録（成功/失敗）               │  │   │
│  │  │ 6. 3秒待機（レート制限対策）           │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  sendFileToChatwork(roomId, file, message)   │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │ 1. ChatWork API エンドポイント構築     │  │   │
│  │  │ 2. X-ChatWorkToken ヘッダー設定        │  │   │
│  │  │ 3. ファイル＋メッセージを POST         │  │   │
│  │  │ 4. レスポンスコードチェック            │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ⑤ ChatWork API (v2)
                 │    POST /rooms/{room_id}/files
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              ChatWork (各クライアントルーム)         │
│  ┌───────────────────────────────────────────────┐  │
│  │  Room 1 (XXXXXXXXXX):                         │  │
│  │  📎 請求書202512(XXXXXXXXXX).pdf              │  │
│  │  💬 お世話になっております。                 │  │
│  │     今月分の請求書をお送りします...          │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Room 2 (XXXXXXXXXX):                         │  │
│  │  📎 請求書202512(XXXXXXXXXX).pdf              │  │
│  │  💬 お世話になっております。                 │  │
│  └───────────────────────────────────────────────┘  │
│  ...                                              │
└─────────────────────────────────────────────────────┘
```

## 🛠 技術スタック

### Core Technologies
- **Google Apps Script**: サーバーレス自動化プラットフォーム
- **JavaScript (ES6+)**: const/let、テンプレートリテラル、アロー関数
- **V8 Runtime**: 高速JavaScript実行エンジン

### Google APIs
- **SpreadsheetApp**: スプレッドシート操作
- **DriveApp**: ファイル管理
- **UrlFetchApp**: HTTP リクエスト（PDF取得、ChatWork API）
- **ScriptApp**: OAuth トークン、トリガー管理
- **Utilities**: スリープ（レート制限対策）

### External APIs
- **ChatWork API v2**: ファイルアップロード、メッセージ送信
- **Spreadsheet Export API**: PDF生成

### Advanced Techniques
- **Blob操作**: MIMEタイプ設定、ファイル名変更
- **日本語エンコーディング**: UTF-8文字化け対策
- **REST API統合**: POST リクエスト、ヘッダー認証
- **パターンマッチング**: ファイル名による自動振り分け

## 🚦 セットアップ

### 1. ChatWork API トークンの取得

1. [ChatWork API設定](https://www.chatwork.com/service/packages/chatwork/subpackages/api/apply_beta.php) にアクセス
2. 「APIトークンを発行する」をクリック
3. トークンをコピー

### 2. ChatWork ルームIDの取得

1. ChatWork でルームを開く
2. URLから`ルームID`を確認
   ```
   https://www.chatwork.com/#!rid【ここがルームID】
   ```

### 3. Google Driveフォルダの準備

1. PDFを保存するフォルダを作成
2. URLから`フォルダID`をコピー

### 4. コードの設定

```javascript
// Code.gs の冒頭を編集

// ChatWork API トークン
const CHATWORK_TOKEN = 'あなたのAPIトークン';

// DriveフォルダID
const FOLDER_ID = "あなたのフォルダID";

// 請求書シート名（スプレッドシート内のシート名）
const SHEET_NAMES = [
  "クライアント1",
  "クライアント2",
  "クライアント3"
];

// ChatWorkルームID（シート名 → ルームID のマッピング）
const CHATWORK_ROOMS = {
  "クライアント1": "123456789",
  "クライアント2": "987654321",
  "クライアント3": "111222333"
};
```

### 5. トリガーの設定

初回のみ手動実行:
```javascript
// エディタで createTriggers を選択して「実行」
createTriggers();
```

これで以下のトリガーが設定されます：
- 毎月1日 3:00 AM: PDF生成
- 毎月1日 9:00 AM: ChatWork送信

### 6. 権限の承認

初回実行時に以下の権限を承認:
- ✅ スプレッドシートの閲覧と編集
- ✅ Google Drive のファイル作成
- ✅ 外部サービスへの接続（ChatWork API）

### 7. テスト実行

本番前にテスト:
```javascript
// 1. PDF生成のテスト
exportSheetsToPdf();

// 2. ChatWork送信のテスト（※実際に送信されます）
sendInvoicesToChatwork();
```

## 📊 実行ログの確認

### PDF生成のログ

```
✓ PDF保存成功: 請求書202512(XXXXXXXXXX).pdf
✓ PDF保存成功: 請求書202512(XXXXXXXXXX).pdf
✓ PDF保存成功: 請求書202512(XXXXXXXXXX).pdf
✗ PDF生成失敗: XXXXXXXXXX (エラー: Sheet not found)
```

### ChatWork送信のログ

```
✓ 送信成功: 請求書202512(XXXXXXXXXX).pdf → XXXXXXXXXX
Chatwork送信 (room 123456789): OK
✓ 送信成功: 請求書202512(XXXXXXXXXX).pdf → XXXXXXXXXX
Chatwork送信 (room 987654321): OK
⚠ 送信先不明/マッチ失敗: 請求書202512(テスト).pdf

===== Chatwork送信結果 =====
送信成功: 4件
送信失敗/スキップ: 1件
```

## 📈 技術的な成果

### 1. 業務効率化

| 指標 | 手動処理 | 自動化後 | 改善率 |
|------|---------|---------|--------|
| PDF生成時間 | 15分 | 0分 | **100%削減** |
| ファイル保存時間 | 5分 | 0分 | **100%削減** |
| ChatWork送信時間 | 20分 | 0分 | **100%削減** |
| 送信ミス | 5% | 0% | **完全防止** |
| **合計** | **40分** | **0分** | **100%削減** |

### 2. 技術的課題の解決

#### 課題1: 日本語ファイル名の文字化け

**従来の方法**: ❌ 直接設定すると文字化け

**本スクリプトの解決策**: ✅ 3ステップ方式
1. 一時ファイル作成（英数字名）
2. ファイル生成
3. 日本語名にリネーム

**結果**: 100% 文字化けなし

#### 課題2: ChatWork API との連携

**実装内容**:
- REST API 統合
- マルチパートフォームデータ
- 認証ヘッダー
- エラーレスポンス処理

**結果**: 安定した API 連携

#### 課題3: ファイルとルームの自動マッピング

**アルゴリズム**:
```javascript
// ファイル名からクライアント名を抽出
// → CHATWORK_ROOMS で該当ルームを検索
// → 自動送信
```

**結果**: 手動指定不要

### 3. 運用の安定性

- **レート制限対策**: 5秒/3秒の待機時間
- **エラー分離**: 1件失敗しても他は継続
- **詳細ログ**: トラブルシューティング容易
- **時間差実行**: PDF生成と送信を6時間離す

## 🎓 学んだ技術スキル

このプロジェクトを通じて習得した技術:

### Google Apps Script Advanced
- **Spreadsheet Export API**: 高度なPDF生成パラメータ
- **Blob操作**: MIMEタイプ、ファイル名制御
- **UrlFetchApp**: POST リクエスト、マルチパート
- **OAuth 2.0**: getOAuthToken() による認証
- **Trigger Management**: 月次スケジュール設定

### External API Integration
- **ChatWork API v2**: ファイルアップロードエンドポイント
- **REST API**: HTTP メソッド、ヘッダー、ペイロード
- **認証**: API トークンベース認証
- **エラーハンドリング**: ステータスコード処理

### 文字エンコーディング
- **UTF-8 エンコーディング**: 日本語文字列の扱い
- **文字化け対策**: ファイル名設定のベストプラクティス
- **Blob 操作**: バイナリデータの適切な処理

### アルゴリズム設計
- **パターンマッチング**: 文字列検索と抽出
- **マッピング**: オブジェクトによるデータ対応付け
- **ループ制御**: forEach とwhile の使い分け

### 業務自動化設計
- **2段階実行**: PDF生成→送信の時間差設定
- **レート制限**: APIクォータの考慮
- **エラー回復**: 部分的障害への対応
- **ログ設計**: 運用監視のための情報出力

## 🔄 今後の改善予定

- [ ] Slack 通知機能（送信完了通知）
- [ ] 送信失敗時の自動リトライ
- [ ] スプレッドシートへの送信履歴記録
- [ ] メール送信機能の追加
- [ ] 送信前プレビュー機能
- [ ] カスタムメッセージテンプレート
- [ ] 複数フォーマット対応（Excel、CSV）
- [ ] 送信スケジュールのカスタマイズ
- [ ] Webhook による外部システム連携

## 🐛 トラブルシューティング

### よくある問題

#### 1. 「ChatWork APIエラー」

**原因**: APIトークンが間違っている

**解決策**:
1. ChatWork で正しいトークンを確認
2. `CHATWORK_TOKEN` を再設定

#### 2. 「送信先不明/マッチ失敗」

**原因**: ファイル名とCHATWORK_ROOMSのキーが一致しない

**解決策**:
```javascript
// ファイル名: 請求書202512(クライアントA).pdf
// ↓ キーも「クライアントA」に合わせる
const CHATWORK_ROOMS = {
  "クライアントA": "123456789"  // ← 完全一致が必要
};
```

#### 3. PDF生成で文字化け

**原因**: 古いバージョンのコード

**解決策**:
- 本スクリプトの3ステップ方式を使用
- 一時ファイル→リネーム方式は必須

#### 4. 「Sheet not found」エラー

**原因**: SHEET_NAMESのシート名が間違っている

**解決策**:
```javascript
// スプレッドシートのシート名と完全一致させる
const SHEET_NAMES = [
  "正確なシート名1",
  "正確なシート名2"
];
```

### デバッグ方法

```javascript
// ログ出力を追加
Logger.log(`処理中のシート: ${sheetName}`);
Logger.log(`生成されたファイル名: ${pdfName}`);
Logger.log(`ChatWorkルームID: ${CHATWORK_ROOMS[clientName]}`);
```

## 📚 参考資料

### 公式ドキュメント
- [ChatWork API ドキュメント](https://developer.chatwork.com/reference)
- [Spreadsheet Export API](https://developers.google.com/apps-script/reference/spreadsheet)
- [UrlFetchApp Reference](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app)
- [DriveApp Reference](https://developers.google.com/apps-script/reference/drive/drive-app)

### ChatWork API
- [ファイルアップロード](https://developer.chatwork.com/reference/post-rooms-room_id-files)
- [認証方法](https://developer.chatwork.com/authenticate)

## 📄 ライセンス

MIT License

## 👤 開発者

UNICUS-dev

- GitHub: [@UNICUS-dev](https://github.com/UNICUS-dev)
- Email: akihiro210@gmail.com

## 🌟 このプロジェクトの意義

このスクリプトは、**エンドツーエンドの業務自動化**を実現する実践的なプロジェクトです。

**ビジネス価値**:
- 月次作業40分を完全自動化
- 送信ミスの完全排除
- 業務時間内（9時）の自動配信

**技術的価値**:
- 複雑な API 連携（ChatWork）
- 日本語文字化け問題の解決
- エラー耐性の高い設計

**キャリア価値**:
- 外部APIとの統合経験
- 文字エンコーディング問題の解決
- エンドツーエンド自動化の設計

単純な自動化ではなく、**文字化け対策**、**API連携**、**エラーハンドリング**という実務で必須の技術を全て含んだ、実践的なプロジェクトです。

---

**Note**: このREADMEは技術的な実装詳細を含んでいますが、実際のAPIトークンやクライアント情報は含まれていません。
