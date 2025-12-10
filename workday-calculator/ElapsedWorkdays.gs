/**
 * 経過稼働日数計算スクリプト
 *
 * - 4月は 26日以降をカウントしない（4/26〜4/30 除外）
 * - 12月は 21日以降をカウントしない（12/21〜12/31 除外）
 * - 祝日は Google の「日本の祝日カレンダー」から取得して除外
 * - タイムゾーンは Asia/Tokyo 固定（日時フォーマットの基準）
 *
 * 必要な権限：
 * - スプレッドシート編集権限
 * - カレンダー（公開祝日カレンダー）参照権限
 */

/* --- 設定 --- */
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME     = 'データ受取';
const TIMEZONE       = 'Asia/Tokyo'; // 明示的に JST とする

/* --- 実行エントリポイント --- */
function myFunction() {
  calculateBaseWorkdays();
}

/**
 * 毎月の基準稼働日数を算出し、スプレッドシートに書き込む
 */
function calculateBaseWorkdays() {
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth() + 1; // 1〜12

  // 指定月の祝日（'yyyy-MM-dd' 文字列配列）を取得
  const holidays = getJapaneseHolidays(year, month);

  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(SHEET_NAME);

  // 週1回のみ（日曜）→ C2 に出力
  sheet.getRange('C2').setValue(
    calculateElapsedWorkdays(year, month, today.getDate(), holidays, [0])
  );
  // 日曜＋木曜休み → C3
  sheet.getRange('C3').setValue(
    calculateElapsedWorkdays(year, month, today.getDate(), holidays, [0, 4])
  );
  // 日曜＋月曜＋木曜休み → C4
  sheet.getRange('C4').setValue(
    calculateElapsedWorkdays(year, month, today.getDate(), holidays, [0, 1, 4])
  );
}

/**
 * 指定年月日の実働日数を計算する
 *  - dayCount: 当日日付（1～31）
 *  - offDays: 休業曜日の配列 (0=日曜, 1=月曜, …, 6=土曜)
 */
function calculateElapsedWorkdays(year, month, dayCount, holidays, offDays) {
  const tz = TIMEZONE;
  let workdays = 0;

  // 例外ルール（スキップする期間）
  const exceptions = [
    { m: 1,  from: 1,  to: 10 },  // 1月: 1～10日
    { m: 4,  from: 26, to: 30 },  // 4月: 26～30日
    { m: 5,  from: 1,  to: 10 },  // 5月: 1～10日
    { m: 8,  from: 10, to: 16 },  // 8月: 10～16日
    { m: 12, from: 21, to: 31 }   // 12月: 21～31日
  ];

  for (let d = 1; d <= dayCount; d++) {
    // 例外期間はカウントしない
    if (exceptions.some(e => e.m === month && d >= e.from && d <= e.to)) {
      continue;
    }

    const date    = new Date(year, month - 1, d);
    const weekDay = date.getDay(); // 0=日曜…6=土曜
    const iso     = Utilities.formatDate(date, tz, 'yyyy-MM-dd');

    // 休業曜日 or 祝日ならカウントしない
    if (offDays.includes(weekDay) || holidays.includes(iso)) continue;

    workdays++;
  }
  return workdays;
}

/**
 * 指定年・月の日本の祝日を取得して 'yyyy-MM-dd' 配列で返す
 *
 * カレンダー ID: 'ja.japanese#holiday@group.v.calendar.google.com'
 */
function getJapaneseHolidays(year, month) {
  const tz = TIMEZONE;
  const calId = 'ja.japanese#holiday@group.v.calendar.google.com';
  try {
    const cal = CalendarApp.getCalendarById(calId);
    if (!cal) return [];

    const start = new Date(year, month - 1, 1);       // 月初（含む）
    const end   = new Date(year, month, 1);           // 次月1日（除く）
    const events = cal.getEvents(start, end);

    const dates = events.map(function(ev) {
      let d;
      try {
        if (typeof ev.getAllDayStartDate === 'function') {
          d = ev.getAllDayStartDate();
        } else {
          d = ev.getStartTime();
        }
      } catch (e) {
        d = ev.getStartTime();
      }
      return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    });

    // 重複除去して返す
    return Array.from(new Set(dates));
  } catch (err) {
    // カレンダー参照に問題がある場合は空配列を返す
    return [];
  }
}
