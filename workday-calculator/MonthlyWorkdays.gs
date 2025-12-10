/**
 * 月次基準稼働日数計算スクリプト
 *
 * - 1月: 10日まで除外
 * - 4月: 25日まで
 * - 5月: 10日まで除外
 * - 8月: 10〜16日除外
 * - 12月: 20日まで
 * - 祝日は Google の「日本の祝日カレンダー」から取得して除外
 *
 * 必要な権限：
 * - スプレッドシート編集権限
 * - カレンダー（公開祝日カレンダー）参照権限
 */

/* --- 設定 --- */
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME     = 'データ受取';

/* --- 実行エントリポイント --- */
function myFunction() {
  calculateBaseWorkdays();
}

/**
 * 毎月の基準稼働日数を算出し、スプレッドシートに書き込む
 */
function calculateBaseWorkdays() {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // 祝日リストをGoogleカレンダーから取得
    const holidays = getJapaneseHolidays(year, month);

    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error('シート「データ受取」が見つかりませんでした。');
    }

    // 週1回（日曜）のみ定休日 → B2
    sheet.getRange('B2').setValue(
      calculateWorkdays(year, month, holidays, [0])
    );
    // 日曜＋水曜の定休 → B3
    sheet.getRange('B3').setValue(
      calculateWorkdays(year, month, holidays, [0, 3])
    );
    // 日曜＋月曜＋水曜の定休 → B4
    sheet.getRange('B4').setValue(
      calculateWorkdays(year, month, holidays, [0, 1, 3])
    );

  } catch (e) {
    // エラーが発生した場合、ログに記録する
    Logger.log('エラーが発生しました: ' + e.toString());
  }
}

/**
 * 祝日リストを取得する
 * @param {number} year - 年
 * @param {number} month - 月 (1-12)
 * @returns {string[]} - ISO形式の日付文字列 (例: "2025-01-01") の配列
 */
function getJapaneseHolidays(year, month) {
  const calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
  const calendar = CalendarApp.getCalendarById(calendarId);

  if (!calendar) {
    Logger.log('日本の祝日カレンダーが見つかりませんでした。');
    return [];
  }

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const events = calendar.getEvents(startOfMonth, endOfMonth);

  const holidays = events.map(event => {
    // 祝日イベントの開始日を取得し、ISO形式に変換
    return event.getStartTime().toISOString().split('T')[0];
  });

  return holidays;
}

/**
 * 稼働日数を計算する
 * @param {number} year - 年
 * @param {number} month - 月 (1-12)
 * @param {string[]} holidays - 祝日の日付文字列の配列
 * @param {number[]} offDays - 休みとなる曜日 (0:日曜, 1:月曜, ...) の配列
 * @returns {number} - 稼働日数
 */
function calculateWorkdays(year, month, holidays, offDays) {
  const daysInMonth = new Date(year, month, 0).getDate();

  // 例外ルール
  let startDay = 1;
  let endDay = daysInMonth;
  switch (month) {
    case 1:
      startDay = 10;
      break;
    case 4:
      endDay = Math.min(endDay, 25);
      break;
    case 5:
      startDay = 10;
      break;
    case 12:
      endDay = Math.min(endDay, 20);
      break;
  }

  let workdays = 0;
  for (let d = startDay; d <= endDay; d++) {
    // 8月だけは10〜16日を丸ごとスキップ
    if (month === 8 && d >= 10 && d <= 16) continue;

    const date = new Date(year, month - 1, d);
    const iso = date.toISOString().split('T')[0];
    const weekDay = date.getDay();

    // 定休日または祝日ならカウントしない
    if (offDays.includes(weekDay) || holidays.includes(iso)) continue;
    workdays++;
  }
  return workdays;
}
