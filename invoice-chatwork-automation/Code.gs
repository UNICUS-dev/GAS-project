// ——————————————————
// 定数定義
// ——————————————————
// Chatwork API トークン
const CHATWORK_TOKEN = 'YOUR_CHATWORK_API_TOKEN';
// 請求書PDFを保存するGoogle DriveフォルダID
const FOLDER_ID = "YOUR_FOLDER_ID";

// 請求書シート名
const SHEET_NAMES = [
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  "XXXXXXXXXX",
  "XXXXXXXXXX"
];
// ChatworkルームID
const CHATWORK_ROOMS = {
  "XXXXXXXXXX": "XXXXXXXXXX",
  "XXXXXXXXXX": "XXXXXXXXXX",
  "XXXXXXXXXX": "XXXXXXXXXX",
  "XXXXXXXXXX": "XXXXXXXXXX",
  "XXXXXXXXXX": "XXXXXXXXXX"
};

// ——————————————————
// 1. 請求書PDF化＋Drive保存 (ファイル名文字化け対策済み)
// ——————————————————
/**
 * スプレッドシートの各シートをPDF化し、指定フォルダに保存します。
 * ファイル名文字化けを防ぐため、一時ファイル作成後にリネームします。
 */
function exportSheetsToPdf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById(FOLDER_ID);

  const today = new Date();
  const year  = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const dateString = year + month;

  SHEET_NAMES.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`シート「${sheetName}」が存在しないためスキップ`);
      return;
    }

    // PDFファイル名（日本語）を設定
    const pdfName = `請求書${dateString}(${sheetName}).pdf`;

    // PDFエクスポートURLを構築
    const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export' +
                '?format=pdf' +
                '&gid=' + sheet.getSheetId() +
                '&portrait=false' +
                '&gridlines=false' +
                '&size=A4';

    const options = {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    };

    try {
      // 1. PDFデータをBlobとして取得
      const response = UrlFetchApp.fetch(url, options);
      let pdfBlob = response.getBlob();

      // 2. MIMEタイプを設定（重要）
      pdfBlob = pdfBlob.setContentType('application/pdf');

      // 3. 一時的な英数字ファイル名で作成
      const tempName = 'temp_' + new Date().getTime() + '.pdf';
      pdfBlob.setName(tempName);

      // 4. ファイルを作成
      const file = folder.createFile(pdfBlob);

      // 5. 作成後に日本語ファイル名に変更
      file.setName(pdfName);

      Logger.log(`✓ PDF保存成功: ${pdfName}`);

    } catch (e) {
      Logger.log(`✗ PDF生成失敗: ${sheetName} (エラー: ${e.message})`);
    }

    // APIレート制限や処理負荷を考慮し、処理間隔を空ける
    Utilities.sleep(5000);
  });
}

// ——————————————————
// 2. Chatworkへのファイル送信
// ——————————————————
/**
 * Driveフォルダ内のPDFファイルをChatworkに送信します。
 */
function sendInvoicesToChatwork() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();

  const today = new Date();
  const year  = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const dateString = year + month; // 例: 202510

  const message =
    "お世話になっております。\n" +
    "今月分の請求書をお送りしますので、ご査収くださいませ。";

  // 送信結果の記録用
  const sentFiles = [];
  const notSentFiles = [];

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    // 当月分の請求書ファイルかチェック (例: 請求書202510(クライアント名).pdf)
    if (!name.includes(dateString) || !name.endsWith(".pdf")) {
      continue; // 当月分でなければスキップ
    }

    let sent = false;

    // ファイル名からクライアント名を抽出し、送信先を特定
    for (let clientName in CHATWORK_ROOMS) {
      // ファイル名が「請求書YYYYMM(クライアント名).pdf」の形式と仮定
      const pattern = `(${clientName}).pdf`;

      if (name.includes(pattern)) {
        try {
          // Chatwork送信ヘルパー関数を呼び出し
          sendFileToChatwork(CHATWORK_ROOMS[clientName], file, message);
          Logger.log(`✓ 送信成功: ${name} → ${clientName}`);
          sentFiles.push(name);
          sent = true;
          Utilities.sleep(3000); // APIレート制限回避のため
          break;  // マッチしたら次のファイルへ
        } catch (e) {
          Logger.log(`✗ 送信失敗: ${name} → ${clientName} (エラー: ${e.message})`);
          notSentFiles.push({file: name, client: clientName, error: e.message});
        }
      }
    }

    if (!sent) {
      Logger.log(`⚠ 送信先不明/マッチ失敗: ${name}`);
      notSentFiles.push({file: name, client: "不明", error: "該当するルームなし/ファイル名不一致"});
    }
  }

  // 結果サマリーをログ出力
  Logger.log(`\n===== Chatwork送信結果 =====`);
  Logger.log(`送信成功: ${sentFiles.length}件`);
  Logger.log(`送信失敗/スキップ: ${notSentFiles.length}件`);
}

// ——————————————————
// ヘルパー: ファイルをChatworkにアップロードする
// ——————————————————
function sendFileToChatwork(roomId, file, message) {
  const endpoint = `https://api.chatwork.com/v2/rooms/${roomId}/files`;
  const options = {
    method: "post",
    headers: { "X-ChatWorkToken": CHATWORK_TOKEN },
    payload: {
      file: file.getBlob(), // DriveFileオブジェクトからBlobを取得
      message: message
    },
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(endpoint, options);

  if (res.getResponseCode() !== 200) {
      throw new Error(`Chatwork APIエラー: ${res.getResponseCode()}, ${res.getContentText()}`);
  }

  Logger.log(`Chatwork送信 (room ${roomId}): OK`);
}

// ——————————————————
// トリガー設定（一度だけ実行してください）
// ——————————————————
function createTriggers() {
  // 既存のトリガーをクリア（クリーンアップ）
  ScriptApp.getProjectTriggers().forEach(tr => {
    const fn = tr.getHandlerFunction();
    if (fn === 'exportSheetsToPdf' || fn === 'sendInvoicesToChatwork') {
      ScriptApp.deleteTrigger(tr);
    }
  });

  // 毎月1日 3:00 に請求書PDF生成
  ScriptApp.newTrigger('exportSheetsToPdf')
    .timeBased()
    .onMonthDay(1)
    .atHour(3)
    .nearMinute(0)
    .create();

  // 毎月1日 9:00 にChatwork送信
  ScriptApp.newTrigger('sendInvoicesToChatwork')
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .nearMinute(0)
    .create();

  Logger.log('トリガーを設定しました: 毎月1日 3:00 にPDF生成、9:00 にChatwork送信');
}
