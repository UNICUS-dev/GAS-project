// ——————————————————
// 定数定義
// ——————————————————
// レポート送信先メールアドレス（複数設定可能）
const REPORT_RECIPIENTS = [
  Session.getActiveUser().getEmail()  // 実行ユーザー
  // 'additional-email@example.com'  // 追加の送信先がある場合はここに追加
];

// ドメインホワイトリスト & 必須AIキーワード
const TRUSTED_DOMAINS = [
  'yomiuri.co.jp','asahi.com','nikkei.com','techcrunch.com',
  'wired.jp','zdnet.com','bloomberg.com','reuters.com'
];
const AI_KEYWORDS = [
  'AI','人工知能','機械学習','生成AI',
  'Deep Learning','ChatGPT','Claude','Gemini'
];

// Gmail検索の最大スレッド数
const MAX_THREADS = 500;

// パフォーマンス設定
const MAX_TITLE_LENGTH_FOR_SIMILARITY = 100;  // 類似度計算の最大文字数

// ——————————————————
// メイン処理：毎朝9時に実行
// ——————————————————
function dailyAINewsReport() {
  let alertEmails = [];
  try {
    console.log('AI News Report 開始:', new Date());
    alertEmails = getGoogleAlertEmails();

    if (alertEmails.length === 0) {
      console.log('新しいGoogleアラートが見つかりませんでした');
      return;
    }

    // 分類・パース（※事前フィルタで通ったURLのみ採用）
    const categorized = categorizeEmails(alertEmails);

    // 事後重複除去
    const uniqueCats = {};
    Object.keys(categorized).forEach(cat => {
      uniqueCats[cat] = removeDuplicatesGlobal(categorized[cat]);
    });

    // レポート生成
    const report = generateReport(uniqueCats);

    // メール送信
    sendReportByEmail(report, uniqueCats);

    // 処理済みメール削除
    deleteProcessedEmails(alertEmails);

    console.log('AI News Report 完了');
  } catch (e) {
    console.error('AI News Report エラー:', e);
    sendErrorNotification(e);

    // エラー時も処理済みメールは削除（無限ループ防止）
    if (alertEmails.length > 0) {
      try {
        deleteProcessedEmails(alertEmails);
        console.log('エラー発生後、処理済みメールを削除しました');
      } catch (deleteError) {
        console.error('メール削除エラー:', deleteError);
      }
    }
  }
}

// ——————————————————
// 事前フィルタリング付きでGoogleアラートメールを取得
// （ホワイトリスト＆AIキーワード一致）
// ——————————————————
function getGoogleAlertEmails() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const query   = 'from:googlealerts-noreply@google.com after:' + formatDate(yesterday);
  const threads = GmailApp.search(query, 0, MAX_THREADS);
  const emails  = [];

  console.log(`取得したGoogleアラートスレッド数: ${threads.length}件`);

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const body    = message.getPlainBody();
      const subject = message.getSubject();
      const urlsRaw = extractURLs(body);
      const keptUrls = [];

      urlsRaw.forEach(rawUrl => {
        const cleaned = cleanUrl(rawUrl); // ← 先に正規化
        let domain = '';
        try {
          domain = (new URL(cleaned)).hostname.replace(/^www\./, '');
        } catch (e) {
          return; // URLとして不正ならスキップ
        }
        // 事前フィルタ1：ホワイトリスト
        if (!TRUSTED_DOMAINS.includes(domain)) return;

        // 事前フィルタ2：AI系キーワード（件名＋本文のどちらかに）
        const text = (subject + ' ' + body).toLowerCase();
        if (!AI_KEYWORDS.some(kw => text.includes(kw.toLowerCase()))) return;

        keptUrls.push(cleaned);
      });

      if (keptUrls.length === 0) return;

      const category = extractCategoryFromSubject(subject);
      if (!category) {
        console.warn('カテゴリ未検出、スキップ:', subject);
        return;
      }

      emails.push({
        category,
        subject,
        body,
        date: message.getDate(),
        urls: keptUrls, // ← 事前フィルタで通ったURLのみ
        thread,
        message
      });
    });
  });

  console.log('事前フィルタ後の記事数（メール単位）:', emails.length);
  return emails;
}

// ——————————————————
// 件名からカテゴリを抽出（長いキーワード優先で完全一致に近づける）
// ——————————————————
function extractCategoryFromSubject(subject) {
  const categoryMap = {
    'Claude/Anthropic': ['Claude', 'Anthropic'],
    'OpenAI/ChatGPT': ['OpenAI', 'ChatGPT'],
    'Gemini/Google AI': ['Gemini', 'Google AI'],
    'AI規制/AI政策': ['AI規制', 'AI政策'],
    'AIエージェント': ['AIエージェント'],
    '生成AI': ['生成AI']
  };

  // 長いキーワードから順に検索（部分一致を防ぐ）
  const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
    const maxLenA = Math.max(...categoryMap[a].map(k => k.length));
    const maxLenB = Math.max(...categoryMap[b].map(k => k.length));
    return maxLenB - maxLenA;
  });

  for (const cat of sortedCategories) {
    for (const kw of categoryMap[cat]) {
      if (subject.indexOf(kw) !== -1) {
        console.log(`カテゴリ検出: "${cat}" (キーワード: "${kw}")`);
        return cat;
      }
    }
  }

  return null;
}

// ——————————————————
// 記事をカテゴリ別に整理
// （メールで通したURLのみを記事として採用）
// ——————————————————
function categorizeEmails(emails) {
  const categories = {
    'AIエージェント': [],
    'AI規制/AI政策': [],
    'Claude/Anthropic': [],
    'OpenAI/ChatGPT': [],
    'Gemini/Google AI': [],
    '生成AI': []
  };

  emails.forEach(email => {
    if (!categories[email.category]) {
      console.warn('未定義のカテゴリ、スキップ:', email.category);
      return;
    }

    const parsed = parseEmailContent(email.body); // 本文から候補記事を抽出
    const allowed = new Set(email.urls.map(u => normalizeUrl(u))); // 事前フィルタ通過URL（正規化）

    // 事前フィルタを通ったURLだけ採用（すり抜け防止）
    parsed.forEach(article => {
      const normalizedUrl = normalizeUrl(article.url || '');
      if (!normalizedUrl) return;
      if (!allowed.has(normalizedUrl)) {
        console.log('事前フィルタ外のURLを除外:', article.url);
        return;
      }

      categories[email.category].push({
        title:   article.title,
        summary: article.summary || 'サマリーなし',
        url:     article.url,  // オリジナルURLを保持（表示用）
        category: email.category
      });
    });
  });

  return categories;
}

// ——————————————————
// グローバル重複除去（パフォーマンス改善版）
// ——————————————————
function removeDuplicatesGlobal(articles) {
  const seen = [], result = [];

  articles.forEach(article => {
    const nt = normalizeTitle(article.title || '');
    const nu = normalizeUrl(article.url || '');

    // URL完全一致チェック（最速）
    if (seen.some(si => si.normalizedUrl === nu)) {
      console.log('URL重複で除外:', article.title);
      return;
    }

    // タイトル類似度チェック（重い処理）
    const isDuplicate = seen.some(si => {
      // 類似度計算
      const similarity = calculateSimilarity(si.normalizedTitle, nt);
      if (similarity > 0.85) {
        console.log(`タイトル類似度重複で除外 (${(similarity*100).toFixed(1)}%):`, article.title);
        return true;
      }

      // キーワード重複チェック
      if (hasSignificantOverlap(si.normalizedTitle, nt)) {
        console.log('キーワード重複で除外:', article.title);
        return true;
      }

      return false;
    });

    if (!isDuplicate) {
      seen.push({ normalizedTitle: nt, normalizedUrl: nu });
      result.push(article);
    }
  });

  console.log(`重複除去結果: ${articles.length}件 → ${result.length}件`);
  return result;
}

// ——————————————————
// レポート生成
// ——————————————————
function generateReport(categorizedData) {
  const today = new Date();
  const dateStr = formatDateJP(today);
  let report = `# Googleアラート 日次ニュースサマリー\n## ${dateStr}\n\n---\n\n`;
  report += '## 📊 サマリー概要\n\n| カテゴリ | 記事数 |\n|---------|-------|\n';
  let total = 0;
  Object.keys(categorizedData).forEach(cat => {
    const n = categorizedData[cat].length;
    total += n;
    report += `| **${cat}** | ${n}件 |\n`;
  });
  report += `| **合計** | **${total}件** |\n\n---\n\n`;
  Object.keys(categorizedData).forEach(cat => {
    const arr = categorizedData[cat];
    if (!arr.length) return;
    report += `## ${getCategoryIcon(cat)} ${cat}（${arr.length}件）\n\n`;
    arr.forEach((a,i) => {
      report += `${i+1}. **${a.title}**\n   ${a.summary}\n   🔗 ${a.url}\n\n`;
    });
    report += '----------------------------------------\n\n';
  });
  report += `*本レポートは${dateStr}に自動生成されました。*`;
  return report;
}

function getCategoryIcon(category) {
  const icons = {
    'AIエージェント':'🤖','AI規制/AI政策':'⚖️',
    'Claude/Anthropic':'🧠','OpenAI/ChatGPT':'💬',
    'Gemini/Google AI':'🌟','生成AI':'🎨'
  };
  return icons[category]||'📰';
}

// ——————————————————
// レポート送信（複数送信先対応）
// ——————————————————
function sendReportByEmail(report, categorizedData) {
  const today = new Date();
  const dateStr = formatDateJP(today);
  let total = 0;
  Object.values(categorizedData).forEach(arr => total += arr.length);
  const subject = `AI News Report ${dateStr} (${total}件)`;

  REPORT_RECIPIENTS.forEach(recipient => {
    try {
      GmailApp.sendEmail(recipient, subject, report);
      console.log('レポート送信成功:', recipient);
    } catch (e) {
      console.error('レポート送信失敗:', recipient, e);
    }
  });

  console.log(`レポート送信完了: ${REPORT_RECIPIENTS.length}名に送信`);
}

// ——————————————————
// 処理済みメール削除
// ——————————————————
function deleteProcessedEmails(emails) {
  const threads = Array.from(new Set(emails.map(e => e.thread)));
  threads.forEach(t => t.moveToTrash());
  console.log(`${threads.length}件のGoogleアラートメールを削除しました`);
}

// ——————————————————
// パース・ユーティリティ群
// ——————————————————
function parseEmailContent(body) {
  const articles = [];
  const sections = body.split('===');
  sections.forEach(sec => {
    const lines = sec.trim().split('\n');
    let title='', summary='', url='', collecting=false;
    lines.forEach(line => {
      line = line.trim();
      const m = line.match(/<(https?:\/\/[^>]+)>/);
      if (m) {
        url = cleanUrl(m[1]);
        if (title) {
          articles.push({ title, summary: summary||'サマリーなし', url });
          title=''; summary=''; collecting=false;
        }
      } else if (!title && line.length>20 && !/^(---|http)/.test(line) &&
                 line.indexOf('Google アラート')===-1 && line.indexOf('次のキーワード')===-1) {
        title = extractTitleFromLine(line);
        collecting = true;
      } else if (collecting && title && line.length>10 &&
                 line.indexOf('Google アラート')===-1 && !/^---/.test(line)) {
        summary += (summary? ' ':'') + line;
        if (summary.length>200) collecting=false;
      }
    });
  });
  return articles;
}

// ——————————————————
// タイトルからメディア名を削除（修正版）
// ——————————————————
function extractTitleFromLine(line) {
  const sources = ['Yahoo!ニュース','ニコニコニュース','日経ビジネス','ITmedia','ZDNET',
                   'エキサイト','MSN','PR TIMES','NewsPicks','Bloomberg',
                   'TechTarget','AIsmiley','CIO','CodeZine','Ledge.ai'];
  let t = line;
  sources.forEach(src => {
    // 末尾のメディア名を削除
    t = t.replace(new RegExp(` - ${src}$`), '').replace(new RegExp(` ${src}$`), '');
  });
  // その他の末尾パターンも削除
  t = t.replace(/\s+-\s+[^-]+$/, '').replace(/\s+\|\s+[^|]+$/, '');
  return t.trim();
}

function extractURLs(text) {
  const urls = [];
  const re = /https?:\/\/[^\s<>]+/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}

// ——————————————————
// URL正規化（改善版：トラッキングパラメータ削除）
// ——————————————————
function cleanUrl(url) {
  let cleaned = url;

  // Google リダイレクトURL処理
  if (cleaned.includes('google.com/url?')) {
    const m = cleaned.match(/url=([^&]+)/);
    if (m) cleaned = decodeURIComponent(m[1]);
  }

  // トラッキングパラメータ削除
  try {
    const urlObj = new URL(cleaned);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                           'fbclid', 'gclid', 'msclkid', '_ga', 'mc_cid', 'mc_eid'];
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    cleaned = urlObj.toString();
  } catch (e) {
    // URLパースに失敗したら元のURLを返す
  }

  return cleaned;
}

// ——————————————————
// タイトル正規化（改善版：全角半角変換追加）
// ——————————————————
function normalizeTitle(title) {
  let normalized = (title || '')
    .replace(/[「」『』【】〈〉《》]/g, '')
    .replace(/[！？!?]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u3000-\u303F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\s]/g, '')
    .trim();

  // 全角英数字を半角に変換
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });

  return normalized.toLowerCase();
}

function normalizeUrl(url) {
  return (url || '').toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+$/, '')
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '');
}

// ——————————————————
// 類似度計算（パフォーマンス改善版：文字数制限）
// ——————————————————
function calculateSimilarity(s1, s2) {
  // 文字数制限でパフォーマンス向上
  const t1 = s1.substring(0, MAX_TITLE_LENGTH_FOR_SIMILARITY);
  const t2 = s2.substring(0, MAX_TITLE_LENGTH_FOR_SIMILARITY);

  const longer = t1.length > t2.length ? t1 : t2;
  const shorter = t1.length > t2.length ? t2 : t1;
  if (!longer.length) return 1.0;

  const dist = levenshteinDistance(longer, shorter);
  return (longer.length - dist) / longer.length;
}

function levenshteinDistance(a, b) {
  const m = b.length, n = a.length;
  const d = Array(m + 1).fill().map((_, i) => [i]);
  d[0] = Array(n + 1).fill().map((_, j) => j);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[j - 1] === b[i - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j - 1] + 1, d[i][j - 1] + 1, d[i - 1][j] + 1);
    }
  }
  return d[m][n];
}

function hasSignificantOverlap(t1, t2) {
  const k1 = extractKeywords(t1), k2 = extractKeywords(t2);
  if (!k1.length || !k2.length) return false;
  const common = k1.filter(w => k2.includes(w));
  return common.length / Math.max(k1.length, k2.length) > 0.7;
}

function extractKeywords(title) {
  const stop = ['について','による','ている','される','として'];
  return (title || '').split(/\s+/).filter(w => w.length >= 3 && !stop.includes(w));
}

// ——————————————————
// 日付フォーマット & エラー通知
// ——————————————————
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd');
}
function formatDateJP(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy年MM月dd日');
}
function sendErrorNotification(error) {
  const subject = 'AI News Report - エラー発生';
  const body = [
    'AI News Report 自動実行中にエラーが発生しました。',
    '',
    'エラー内容: ' + error.toString(),
    'スタックトレース: ' + (error.stack || 'なし'),
    '発生時刻: ' + formatDateJP(new Date())
  ].join('\n');

  REPORT_RECIPIENTS.forEach(recipient => {
    try {
      GmailApp.sendEmail(recipient, subject, body);
    } catch (e) {
      console.error('エラー通知送信失敗:', recipient, e);
    }
  });
}

// ——————————————————
// 1週間以上前のGoogleアラートを自動削除 (スターなしのみ)
// ——————————————————
function autoDeleteOldAlerts() {
  try {
    console.log('古いGoogleアラートメールの削除を開始:', new Date());

    const query = 'from:googlealerts-noreply@google.com older_than:7d -is:starred';
    const threads = GmailApp.search(query, 0, MAX_THREADS);

    if (threads.length === 0) {
      console.log('削除対象の古いGoogleアラートは見つかりませんでした。');
      return;
    }

    let deletedCount = 0;
    threads.forEach(thread => {
      thread.moveToTrash();
      deletedCount++;
    });

    console.log(`${deletedCount}件の1週間以上前のGoogleアラートメールを削除しました (ゴミ箱へ移動)。`);
  } catch (e) {
    console.error('古いアラート削除処理でエラー:', e);
    sendErrorNotification(e);
  }
}

// ——————————————————
// テスト・トリガー設定用
// ——————————————————
function testRun() {
  dailyAINewsReport();
}

// 日次レポートトリガー設定（毎朝9時）
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyAINewsReport')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyAINewsReport')
    .timeBased().everyDays(1).atHour(9).create();
  console.log('日次トリガー設定完了: 毎日9時にdailyAINewsReport実行');
}

// 週次クリーンアップトリガー設定（毎週日曜2時）
function setupWeeklyCleanupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'autoDeleteOldAlerts')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('autoDeleteOldAlerts')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
  console.log('週次クリーンアップトリガー設定完了: 毎週日曜2時にautoDeleteOldAlerts実行');
}

// 両方のトリガーを一括設定
function setupAllTriggers() {
  setupDailyTrigger();
  setupWeeklyCleanupTrigger();
  console.log('全トリガー設定完了');
}
