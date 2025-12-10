// スプレッドシートのIDを指定
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
// 保存先のGoogle DriveフォルダIDを指定
const DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID';

function exportSheetsToPDF() {
  // 現在の日付を取得
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth()は0から始まるため+1

  // 月が奇数（1, 3, 5, 7, 9, 11月）でない場合は処理を中断
  if (month % 2 === 0) {
    Logger.log('偶数月のため処理をスキップしました。');
    return;
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = spreadsheet.getSheets();

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      // "Yahoo"と"Google"のシートはPDF化しない
      if (sheetName === 'Yahoo' || sheetName === 'Google') {
        Logger.log(`スキップ: ${sheetName} シート`);
        return;
      }

      // 現在の年月を取得
      const now = new Date();
      const year = now.getFullYear();
      const monthFormatted = ('0' + (now.getMonth() + 1)).slice(-2); // 月を2桁にフォーマット

      // ファイル名を作成
      const fileName = `${sheetName}${year}${monthFormatted}分リステイング請求書`;

      // PDFオプションを設定
      const pdfOptions = {
        exportFolder: DRIVE_FOLDER_ID,
        filename: fileName,
        range: 'A1:AU30',
        orientation: 'landscape'
      };

      saveSheetAsPDF(sheet, pdfOptions);

      // リクエスト間に遅延を挿入
      Utilities.sleep(10000); // 10秒の遅延を追加
    });
  } catch (e) {
    Logger.log('Error: ' + e.message);
    throw e;
  }
}

function saveSheetAsPDF(sheet, options) {
  const spreadsheet = sheet.getParent();
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheet.getId()}/export?`;
  const params = {
    exportFormat: 'pdf',
    format: 'pdf',
    size: 'A4',
    portrait: options.orientation === 'portrait',
    fitw: true,
    sheetnames: false,
    printtitle: false,
    pagenumbers: false,
    gridlines: false,
    fzr: false,
    gid: sheet.getSheetId(),
    range: options.range
  };

  const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(`${url}${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const blob = response.getBlob().setName(`${options.filename}.pdf`);
  DriveApp.getFolderById(options.exportFolder).createFile(blob);
}

function calculateTotalPrice() {
  // スプレッドシートを取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Yahoo");

  // シートが存在しない場合は終了
  if (!sheet) {
    Logger.log("Sheet 'Yahoo' not found.");
    return;
  }

  // A列とB列のデータを取得
  var data = sheet.getRange("A:B").getValues();

  // クライアント名ごとに価格を合計
  var totals = {};
  for (var i = 0; i < data.length; i++) {
    var client = data[i][0];
    var price = data[i][1];
    if (client && price) {
      if (!totals[client]) {
        totals[client] = 0;
      }
      totals[client] += price;
    }
  }

  // D列とE列に結果を書き込む
  var output = [];
  for (var client in totals) {
    output.push([client, totals[client]]);
  }
  var range = sheet.getRange(1, 4, output.length, 2);
  range.setValues(output);

  // E列の表示形式を金額形式に設定
  sheet.getRange(1, 5, output.length).setNumberFormat('¥#,##0');
}

function createOddMonthTriggers() {
  // 現在のプロジェクトからすべてのトリガーを削除
  deleteTriggers();

  // 奇数月の3日にトリガーを設定
  var months = [1, 3, 5, 7, 9, 11];
  var now = new Date();
  var currentYear = now.getFullYear();

  for (var i = 0; i < months.length; i++) {
    var month = months[i];
    var triggerDate = new Date(currentYear, month - 1, 3, 2, 0, 0);
    ScriptApp.newTrigger('calculateTotalPrice')
      .timeBased()
      .at(triggerDate)
      .create();
  }
}

function deleteTriggers() {
  // 既存のトリガーをすべて削除
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
