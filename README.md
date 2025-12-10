# GAS Project - Google Apps Script Automation Collection

[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Google Apps Script (GAS) を使用した業務自動化プロジェクト集。Gmail、Google Drive、Spreadsheetなどの Google Workspace サービスを連携させた実践的な自動化スクリプトを提供します。

## 🎯 プロジェクト概要

このリポジトリは、実務で培った**業務自動化ノウハウ**をコード化したコレクションです。それぞれのプロジェクトは実際のビジネス課題を解決し、業務効率を劇的に改善しています。

### なぜGoogle Apps Scriptなのか？

✅ **ゼロコスト**: Google Workspaceユーザーなら追加コスト不要
✅ **強力な統合**: Gmail、Drive、Sheets等とシームレス連携
✅ **クラウド実行**: サーバー不要で24時間自動実行
✅ **JavaScript**: 広く使われる言語で学習コストが低い
✅ **迅速な開発**: プロトタイプから本番まで短期間で実現

## 📁 プロジェクト一覧

### 1. [Looker Report Automation](./looker-report-automation/)

**概要**: Looker Studio のレポートPDFを自動的にGmailから取得し、Google Driveに整理して保存

**主な機能**:
- 複数クライアントの月次レポート自動保存
- Gmail検索とPDF抽出
- 統一された命名規則での保存
- 処理済みメールの自動削除

**技術**:
- Gmail API
- Drive API
- 時間駆動型トリガー

**効果**:
- 月次作業時間: 2時間 → 0時間（100%削減）
- 人的ミス: 完全排除

[→ 詳細を見る](./looker-report-automation/)

---

## 🛠 技術スタック

### Core Technologies
- **Google Apps Script**: Google Workspace 自動化プラットフォーム
- **JavaScript (ES6+)**: モダンなJavaScript構文
- **V8 Runtime**: 高速実行エンジン

### Google Workspace APIs
- **Gmail API**: メール操作と検索
- **Google Drive API**: ファイル管理
- **Google Sheets API**: スプレッドシート操作（予定）
- **Calendar API**: カレンダー操作（予定）

### Development Tools
- **Google Apps Script Editor**: ブラウザベースIDE
- **clasp**: ローカル開発用CLI（オプション）
- **Git**: バージョン管理

## 🚀 はじめ方

### 前提条件

- Googleアカウント
- Google Workspace（Gmail、Drive等）へのアクセス

### 基本的な使用方法

1. **プロジェクトを選択**
   - 各フォルダに個別のREADMEがあります

2. **Google Apps Scriptにコピー**
   ```
   1. script.google.com にアクセス
   2. 新しいプロジェクトを作成
   3. コードをコピー＆ペースト
   ```

3. **設定の変更**
   - 各プロジェクトの設定エリアを編集

4. **実行・テスト**
   - 手動実行でテスト
   - トリガー設定で自動化

### ローカル開発（上級者向け）

```bash
# clasp のインストール
npm install -g @google/clasp

# ログイン
clasp login

# プロジェクトのクローン
clasp clone <スクリプトID>

# プッシュ
clasp push
```

## 📊 実績と成果

### 業務効率化

| プロジェクト | 削減時間/月 | 自動化率 | ミス削減 |
|------------|------------|---------|---------|
| Looker Report Automation | 2時間 | 100% | 100% |
| **合計** | **2時間** | **100%** | **100%** |

### 技術的成果

- **API統合スキル**: 複数のGoogle Workspace APIを実践的に活用
- **エラーハンドリング**: 堅牢なエラー処理設計
- **自動化設計**: 業務フローの分析と自動化設計
- **運用考慮**: ログ出力とトラブルシューティング

## 🎓 学んだ技術スキル

このプロジェクト群を通じて習得した技術:

### Google Apps Script
- Gmail/Drive/Sheets API の実践的活用
- トリガー管理（時間駆動・イベント駆動）
- 権限管理とOAuth
- ログ設計とデバッグ

### JavaScript開発
- ES6+ 構文（const/let、テンプレートリテラル、アロー関数）
- 非同期処理
- エラーハンドリング
- 関数型プログラミング

### 業務自動化
- 業務フロー分析
- 要件定義
- 設定駆動アーキテクチャ
- 運用設計

### DevOps
- Git によるバージョン管理
- ドキュメント作成
- トラブルシューティング

## 🔄 今後の追加予定

以下のプロジェクトを順次追加予定:

- [ ] **Gmail自動返信システム**: 問い合わせメールへの自動返信
- [ ] **スプレッドシート日次レポート**: データ集計と自動レポート生成
- [ ] **カレンダー同期ツール**: 複数カレンダーの統合管理
- [ ] **Slack通知システム**: 重要メールのSlack転送
- [ ] **ファイル整理自動化**: Drive内の自動整理
- [ ] **メール添付ファイルバックアップ**: 自動バックアップシステム

## 📚 参考資料

### 公式ドキュメント
- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [GmailApp Class Reference](https://developers.google.com/apps-script/reference/gmail/gmail-app)
- [DriveApp Class Reference](https://developers.google.com/apps-script/reference/drive/drive-app)
- [SpreadsheetApp Class Reference](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app)

### 学習リソース
- [Apps Script Quickstart](https://developers.google.com/apps-script/guides/gs101)
- [clasp - Command Line Apps Script Projects](https://github.com/google/clasp)

## 🤝 コントリビューション

バグ報告や機能提案は Issue でお願いします。

## 📄 ライセンス

MIT License

各プロジェクトは個別のライセンスを持つ場合があります。詳細は各フォルダのREADMEを参照してください。

## 👤 開発者

UNICUS-dev

- GitHub: [@UNICUS-dev](https://github.com/UNICUS-dev)
- Email: akihiro210@gmail.com

## 🌟 このリポジトリの意義

このリポジトリは、単なるコード集ではありません。**「実際のビジネス課題を技術で解決する」**という実践的なエンジニアリング能力を示すポートフォリオです。

**ビジネス価値**:
- 業務プロセスの理解と改善提案
- 実測可能なコスト削減効果
- 運用を考慮した実装

**技術的価値**:
- API統合の実践経験
- エラー耐性の高い設計
- 保守性・拡張性の考慮

**キャリア価値**:
- 問題解決能力の証明
- 自動化スキルの実践
- 継続的な学習姿勢

すべてのプロジェクトは**実際に業務で使用され、価値を生み出している**実践的なコードです。

---

**Note**: このリポジトリは技術的な実装詳細を公開していますが、実際のクライアント情報や機密情報は含まれていません。
