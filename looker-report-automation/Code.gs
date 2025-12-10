function saveAllLookerReports() {

  // ==================================================
  // ★設定エリア 1：保存先フォルダ（9社共通）
  // ==================================================

  // ここに「保存先フォルダのID」を1つだけ貼り付けてください
  const COMMON_FOLDER_ID = "YOUR_FOLDER_ID";


  // ==================================================
  // ★設定エリア 2：クライアント9社のリスト
  // ==================================================

  // Looker Studioの「レポート名（＝メール件名）」と
  // 保存時の「ファイル名の頭に付ける名前」をセットで登録します

  const CLIENT_LIST = [
    // --- 1社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",  // 件名（正確に！）
      fileName: "XXXXXXXXXX"             // ファイル名用
    },
    // --- 2社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 3社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName:  "XXXXXXXXXX"
    },
    // --- 4社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 5社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 6社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 7社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 8社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    },
    // --- 9社目 ---
    {
      subject: "Ad-Report(XXXXXXXXXX)",
      fileName: "XXXXXXXXXX"
    }
  ];

  // ==================================================
  // 以下は変更不要です（自動処理ロジック）
  // ==================================================

  // ■ 日付の処理（前月の日付を計算）
  const date = new Date();
  date.setMonth(date.getMonth() - 1); // 1ヶ月前に戻す
  const dateString = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy年MM月');

  Logger.log(`📅 対象年月: ${dateString} の処理を開始します`);

  // 保存先フォルダを取得
  const folder = DriveApp.getFolderById(COMMON_FOLDER_ID);

  // ■ リストの順番通りに処理を実行
  CLIENT_LIST.forEach(client => {
    processOneClient(client, folder, dateString);
  });
}

// 個別の処理を行う関数
function processOneClient(client, folder, dateString) {
  const targetSubject = client.subject;
  const finalFileName = `${client.fileName}_${dateString}.pdf`;

  // Gmail検索
  const query = `subject:"${targetSubject}" has:attachment newer_than:10d from:looker-studio-noreply@google.com`;

  Logger.log(`🔍 検索中: ${targetSubject}`);

  const threads = GmailApp.search(query);

  if (threads.length === 0) {
    Logger.log(`   → メールが見つかりませんでした。スキップします。`);
    return;
  }

  // 見つかった最新メールを処理
  const messages = threads[0].getMessages();
  const latestMessage = messages[messages.length - 1];
  const attachments = latestMessage.getAttachments();

  try {
    let saved = false;
    for (const attachment of attachments) {
      if (attachment.getContentType() === MimeType.PDF) {

        // 共通フォルダに保存
        const file = folder.createFile(attachment);
        file.setName(finalFileName);
        Logger.log(`   ✅ 保存成功: ${finalFileName}`);
        saved = true;
      }
    }

    // 保存できたらメールをゴミ箱へ（重複防止）
    if (saved) {
      latestMessage.moveToTrash();
      Logger.log(`   🗑️ メールをゴミ箱に移動しました`);
    }

  } catch (e) {
    Logger.log(`   ❌ エラー: ${e.toString()}`);
  }
}
