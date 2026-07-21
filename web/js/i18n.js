/* i18n.js — the translation layer. W98.tr(s) is called at every render choke
   point (el/menu/window title/status/msgbox). English is the source of truth;
   unknown strings pass through unchanged so nothing can go missing. */
"use strict";
(() => {
  const lang = Store.get("uiLang", "en");
  W98.uiLang = lang;

  /* zh-TW dictionary. Keys are the exact English source strings. */
  const ZH = {
    /* ---- window chrome / common ---- */
    "OK": "確定", "Cancel": "取消", "Close": "關閉", "Apply": "套用", "Yes": "是", "No": "否",
    "Open": "開啟", "Open...": "開啟...", "Save": "儲存", "Save As...": "另存新檔...", "Save As": "另存新檔",
    "New": "開新檔案", "New...": "開新檔案...", "Exit": "結束", "Cancel printing '": "取消列印 '",
    "Browse": "瀏覽", "Browse...": "瀏覽...", "Delete": "刪除", "Rename": "重新命名", "Properties": "內容",
    "Copy": "複製", "Cut": "剪下", "Paste": "貼上", "Undo": "復原", "Redo": "取消復原",
    "Select All": "全選", "Find": "尋找", "Find...": "尋找...", "Find Next": "找下一個", "Replace": "取代",
    "Replace...": "取代...", "Replace All": "全部取代", "Find what:": "尋找目標:", "Replace with:": "取代為:",
    "Help": "說明", "Help Topics": "說明主題", "Edit": "編輯", "View": "檢視", "File": "檔案",
    "Options": "選項", "Options...": "選項...", "Settings": "設定", "Search": "搜尋", "Print": "列印",
    "Print...": "列印...", "Print Preview": "預覽列印", "Font": "字型", "Font...": "字型...", "Font:": "字型:",
    "Color": "色彩", "Colors": "色彩", "Add": "新增", "Remove": "移除", "Clear": "清除", "Clear All": "全部清除",
    "Restore": "還原", "Minimize": "最小化", "Maximize": "最大化", "Move": "移動", "Size": "大小", "Size:": "大小:",
    "Name": "名稱", "Name:": "名稱:", "Date": "日期", "Time": "時間", "Type": "類型", "Type:": "類型:",
    "General": "一般", "Back": "上一頁", "Forward": "下一頁", "Refresh": "重新整理", "Home": "首頁",
    "Home Page": "首頁", "Stop": "停止", "Pause": "暫停", "Play": "播放", "Eject": "退出", "Repeat": "重複",
    "Ready": "就緒", "Ready.": "就緒。", "Done": "完成", "Windows": "Windows", "Untitled": "未命名",
    "For Help, press F1": "如需說明，請按 F1", "For Help, click Help Topics on the Help Menu.": "如需說明，請按說明功能表上的「說明主題」。",
    "Toolbar": "工具列", "Toolbars": "工具列", "Status Bar": "狀態列", "Ruler": "尺規", "Format Bar": "格式列",
    "Actions": "動作", "Commands": "指令", "Go": "移至", "Number:": "數字:", "Width:": "寬度:", "Height:": "高度:",
    "Position:\n0.00 sec.": "位置:\n0.00 秒", "Length:\n1.40 sec.": "長度:\n1.40 秒",

    /* ---- desktop / shell ---- */
    "My Computer": "我的電腦", "My Documents": "我的文件", "Recycle Bin": "資源回收筒",
    "Network Neighborhood": "網路上的芳鄰", "My Briefcase": "我的公事包", "Internet Explorer": "Internet Explorer",
    "Control Panel": "控制台", "Programs": "程式集", "Documents": "我的最近文件", "Favorites": "我的最愛",
    "Find": "尋找", "Run...": "執行...", "Run": "執行", "Log Off...": "登出...", "Shut Down...": "關機...",
    "Windows Update": "Windows Update", "Accessories": "附屬應用程式", "Communications": "通訊",
    "Entertainment": "娛樂", "Games": "遊戲", "System Tools": "系統工具", "Accessibility": "協助工具",
    "Office 98": "Office 98", "Quick Launch": "快速啟動", "Active Desktop": "Active Desktop",
    "Arrange Icons": "排列圖示", "Line Up Icons": "對齊圖示", "Auto Arrange": "自動排列",
    "Cascade Windows": "重疊顯示視窗", "Tile Windows Horizontally": "並排顯示視窗（橫向）",
    "Tile Windows Vertically": "並排顯示視窗（縱向）", "Minimize All Windows": "全部最小化",
    "Minimize All": "全部最小化", "New Window": "開新視窗", "Explorer": "檔案總管", "Windows Explorer": "Windows 檔案總管",
    "Explorer Bar": "檔案總管列", "Folders": "資料夾", "Folder": "資料夾", "as Web Page": "以網頁顯示",
    "Large Icons": "大圖示", "List": "清單", "Details": "詳細資料", "by Name": "依名稱", "by Size": "依大小",
    "by Type": "依類型", "by Date": "依日期", "Send To": "傳送到", "Create Shortcut": "建立捷徑",
    "Create Shortcut(s) Here": "在這裡建立捷徑", "Move Here": "移到這裡", "Copy Here": "複製到這裡",
    "Undo Delete": "復原刪除", "Invert Selection": "反向選擇", "Up One Level": "上一層", "Local Disk": "本機磁碟",
    "Desktop as Shortcut": "桌面（建立捷徑）", "Mail Recipient": "郵件收件者", "New Location": "新增位置",
    "There are no items in this folder.": "這個資料夾沒有任何項目。",
    "Selects an item to view its description.": "選取項目以檢視其描述。",
    "This folder shows your pictures as thumbnails.": "這個資料夾以縮圖顯示您的圖片。",

    /* ---- taskbar / start ---- */
    "Start": "開始", "Programs": "程式集", "Show Details": "顯示詳細資料", "Hide Details": "隱藏詳細資料",
    "Taskbar & Start Menu...": "工作列和開始功能表...", "Taskbar Properties": "工作列內容",
    "Taskbar Options": "工作列選項", "Adjust the way the taskbar behaves:": "調整工作列的行為方式:",
    "Volume": "音量", "Volume Control": "音量控制", "Volume:": "音量:", "Mute": "靜音",

    /* ---- boot / login / shutdown ---- */
    "Welcome to Windows": "歡迎使用 Windows", "Welcome": "歡迎", "Welcome to Windows 98": "歡迎使用 Windows 98",
    "to the exciting new world of Windows 98": "來到 Windows 98 令人興奮的新世界",
    "Type a user name and password to log on to Windows.": "請輸入使用者名稱和密碼以登入 Windows。",
    "User name:": "使用者名稱:", "Password:": "密碼:", "A Nostalgic User": "懷舊使用者",
    "Log Off Windows": "登出 Windows", "Are you sure you want to log off": "您確定要登出",
    "Shut Down Windows": "關閉 Windows", "What do you want the computer to do?": "您要電腦執行什麼工作?",
    "Restart": "重新啟動", "Restart This Game": "重新開始這局", "Restart in MS-DOS mode": "在 MS-DOS 模式下重新啟動",
    "(click anywhere to turn the computer back on)": "（按任意處重新開機）",
    "Learn about your desktop:": "了解您的桌面:", "Did you know?": "您知道嗎?", "Next Tip": "下一個提示",
    "Discover Windows 98": "探索 Windows 98", "Take a Tour": "快速導覽", "Play Minesweeper": "玩踩地雷",
    "Show this screen each time Windows 98 starts": "每次 Windows 98 啟動時顯示這個畫面",

    /* ---- dialogs / file pickers ---- */
    "Look in:": "查詢:", "File name:": "檔案名稱:", "Files of type:": "檔案類型:", "Save changes to ": "要儲存變更到 ",
    "Do you want to save the changes to ": "您要儲存變更到 ", "Save changes to ": "要儲存變更到 ",
    "Confirm File Delete": "確認刪除檔案", "Confirm Multiple File Delete": "確認刪除多個檔案",
    "Are you sure you want to delete these ": "您確定要刪除這 ",
    "Are you sure you want to permanently delete ": "您確定要永久刪除 ",
    "Open With": "開啟檔案", "Choose the program you want to use to open the file:\n'": "選擇您要用來開啟這個檔案的程式:\n'",
    "Text Documents (*.txt)": "文字文件 (*.txt)", "Bitmap Files (*.bmp)": "點陣圖檔 (*.bmp)",
    "Bitmap Files (*.bmp;*.png)": "點陣圖檔 (*.bmp;*.png)", "Pictures (*.bmp, *.png)": "圖片 (*.bmp, *.png)",
    "Programs (*.exe)": "程式 (*.exe)", "Worksheet (*.xls)": "活頁簿 (*.xls)",
    "Word for Windows (*.doc)": "Word for Windows (*.doc)",

    /* ---- Notepad ---- */
    "Notepad": "記事本", "Word Wrap": "自動換行", "Untitled - Notepad": "未命名 - 記事本",
    "About Notepad": "關於記事本", "Ln 1, Col 1": "行 1，欄 1", "Cannot find \"": "找不到 \"",

    /* ---- Paint ---- */
    "Paint": "小畫家", "untitled - Paint": "未命名 - 小畫家", "About Paint": "關於小畫家",
    "Image": "影像", "Draw": "繪圖", "Flip Horizontal": "水平翻轉", "Flip Vertical": "垂直翻轉",
    "Rotate 90°": "旋轉 90°", "Rotate 180°": "旋轉 180°", "Rotate 270°": "旋轉 270°",
    "Attributes": "屬性", "Attributes...": "屬性...", "Attributes:": "屬性:", "Clear Image": "清除影像",
    "Clear Selection": "清除選取區", "Edit Colors...": "編輯色彩...", "Set As Wallpaper (Tiled)": "設成桌布（並排）",
    "Set As Wallpaper (Centered)": "設成桌布（置中）", "Text Size": "文字大小",
    "Bitmap Image": "點陣圖影像",

    /* ---- Calculator ---- */
    "Calculator": "小算盤", "Standard": "標準型", "Scientific": "工程型", "About Calculator": "關於小算盤",

    /* ---- WordPad ---- */
    "WordPad": "WordPad", "Document - WordPad": "文件 - WordPad", "About WordPad": "關於 WordPad",
    "Insert": "插入", "Format": "格式", "Date and Time...": "日期和時間...", "Horizontal Line": "水平線",
    "Bullet Style": "項目符號樣式", "Bullets": "項目符號", "Text Color...": "文字色彩...",
    "What you see is what you get. This is the preview.": "所見即所得。這就是預覽。",
    "Pixel the Assistant": "小畫家小助手 Pixel", "Hide Pixel": "隱藏 Pixel",
    "Hi! I'm Pixel. I live in WordPad now.": "嗨！我是 Pixel。我現在住在 WordPad 裡。",

    /* ---- Explorer / files ---- */
    "(C:) Properties": "(C:) 內容", "Capacity:": "容量:", "Used space:": "已使用空間:", "Free space:": "可用空間:",
    "File system:": "檔案系統:", "File System:": "檔案系統:", "Label:": "標籤:", "3½ Floppy (A:)": "3½ 磁碟片 (A:)",
    "A:\\ is not accessible": "無法存取 A:\\", "D:\\ is not accessible": "無法存取 D:\\",
    "The device is not ready.": "裝置尚未就緒。", "Local Disk": "本機磁碟", "Free space:": "可用空間:",
    "Image Preview": "圖片預覽", "Printers": "印表機", "Printer": "印表機", "Modified: ": "修改日期: ",
    "Empty Recycle Bin": "清理資源回收筒", "Confirm Program Removal": "確認移除程式",
    "Error Copying File": "複製檔案時發生錯誤", "Error Moving File": "移動檔案時發生錯誤",
    "Error Renaming File": "重新命名時發生錯誤", "Add/Remove Programs": "新增/移除程式",
    "Add/Remove Programs Properties": "新增/移除程式內容", "Install/Uninstall": "安裝/解除安裝",
    "Windows Setup": "Windows 安裝程式", "Add/Remove...": "新增/移除...", "Reinstall...": "重新安裝...",
    "Update All": "全部更新", "Add My Documents Files...": "新增我的文件檔案...", "Update My Briefcase": "更新我的公事包",
    "Add to Briefcase": "加入公事包",

    /* ---- Control Panel ---- */
    "Display": "顯示器", "Display Properties": "顯示內容", "Display:": "顯示器:", "Desktop Themes": "桌面主題",
    "Date/Time": "日期/時間", "Date & Time": "日期和時間", "Date/Time Properties": "日期/時間內容",
    "Time Zone": "時區", "Time/Date": "時間/日期", "Adjust Date/Time": "調整日期/時間",
    "Mouse": "滑鼠", "Mouse Properties": "滑鼠內容", "Buttons": "按鍵", "Motion": "移動", "Pointer trail": "指標軌跡",
    "Sounds": "音效", "Sounds Properties": "音效內容", "Sound - Sound Recorder": "音效 - 錄音機",
    "System": "系統", "System Properties": "系統內容", "Device Manager": "裝置管理員", "Performance": "效能",
    "Background": "背景", "Screen Saver": "螢幕保護程式", "Screen Saver:": "螢幕保護程式:", "Appearance": "外觀",
    "Scheme:": "配置:", "Schemes": "配置", "Theme:": "主題:", "Preview": "預覽", "▶ Preview": "▶ 預覽",
    "Wait:": "等待:", "minutes of inactivity": "分鐘無動作後", "Character Map": "字元對應表",
    "Characters to copy": "要複製的字元", "Characters to copy:": "要複製的字元:", "Regional Settings": "地區設定",
    "Regional Settings Properties": "地區設定內容", "Language": "語言",

    /* ---- Recycle / general system ---- */
    "Cannot Run Program": "無法執行程式", "Program Error": "程式錯誤", "Problem with Shortcut": "捷徑發生問題",
    "Access Denied": "拒絕存取", "Enter Network Password": "輸入網路密碼", "Computer": "電腦", "Computer:": "電腦:",
    "Close Program": "關閉程式", "End Task": "結束工作", "System Tools": "系統工具",
    "Disk Defragmenter": "磁碟重組工具", "ScanDisk": "磁碟掃描程式", "Registry Editor": "登錄編輯程式",
    "Registry": "登錄", "VirusScan 98": "VirusScan 98", "Which drive do you want to defragment?": "您要重組哪一個磁碟機?",
    "Select the drive(s) you want to check for errors:": "選擇您要檢查錯誤的磁碟機:",
    "ScanDisk found no errors on this drive.": "磁碟掃描程式在這個磁碟機上找不到任何錯誤。",
    "Are you sure you want to stop defragmenting this drive?": "您確定要停止重組這個磁碟機嗎?",

    /* ---- games ---- */
    "Minesweeper": "踩地雷", "Solitaire": "接龍", "FreeCell": "新接龍", "Hearts": "傷心小棧",
    "Game": "遊戲", "New Game": "開新遊戲", "Beginner": "初級", "Intermediate": "中級", "Expert": "高級",
    "Custom...": "自訂...", "Custom Field": "自訂難度", "Marks (?)": "問號標記 (?)",
    "Best Times...": "最佳時間...", "Fastest Mine Sweepers": "最快的踩雷高手", "Reset Scores": "重設分數",
    "You have the fastest time for ": "您在此難度創下最快時間: ", "no record": "尚無紀錄",
    "How to Play": "遊戲玩法", "Deck...": "牌背...", "Select Card Back": "選擇牌背", "Deal": "發牌",
    "Score...": "分數...", "Score: 0": "分數: 0", "Pass": "傳牌", "Player": "玩家", "Hearts — Score": "傷心小棧 — 分數",
    "Select Game...": "選擇遊戲...", "Game Number": "遊戲編號", "Select a game number from 1 to 32000:": "請選擇 1 到 32000 之間的遊戲編號:",
    "Congratulations!": "恭喜!", "Congratulations! You won!\nDeal again?": "恭喜! 您贏了!\n要再發牌一次嗎?",
    "Star Pilot Pinball": "星際飛行員彈珠台", "Balls: 3": "球數: 3", "High: 0": "最高分: 0",
    "Powder Hill": "粉雪坡", "Best: 0 m": "最佳: 0 m", "Style: 0": "花式分: 0", "Lives: 3": "生命: 3",
    "WallBall": "打磚塊", "Worm 98": "貪食蟲 98", "Stackz": "疊疊樂", "Level ": "關卡 ", "Level 1": "第 1 關",
    "CORRIDOR 98": "走廊 98", "Maintenance Sublevel": "維修地下層", "The Server Farm": "伺服器農場",
    "The Warm Room": "溫暖的房間", "Find the exit. Mind the goo.": "找到出口，小心黏液怪。",
    "Lead": "主音", "Bass": "貝斯", "Bell": "鈴聲", "Drums": "鼓組", "Tempo:": "節奏:",
    "Composer 98": "作曲家 98", "Clear Track": "清除音軌", "Click cells to place notes": "點擊格子放置音符",

    /* ---- internet / mail / chat ---- */
    "Internet Mail": "Internet 郵件", "Inbox - Internet Mail": "收件匣 - Internet 郵件", "New Message": "新郵件",
    "Send and Receive": "傳送與接收", "Send": "傳送", "Reply to Author": "回覆作者", "Delete Message": "刪除郵件",
    "Mark All as Read": "全部標為已讀", "To:": "收件者:", "Subject:": "主旨:", "Working Online": "線上作業",
    "Address": "網址", "Address Book": "通訊錄", "About Address Book": "關於通訊錄", "New Contact": "新增連絡人",
    "New Contact...": "新增連絡人...", "Delete Contact": "刪除連絡人", "E-mail address:": "電子郵件地址:",
    "E-mail: ": "電子郵件: ", "Phone:": "電話:", "Phone: ": "電話: ", "Phone number:": "電話號碼:", "Select a contact.": "請選擇一位連絡人。",
    "Pal Messenger": "Pal 即時通", "My Status": "我的狀態", "Status: Online": "狀態: 上線",
    "Double-click a pal to chat": "連按兩下好友即可聊天", "Change Nickname": "變更暱稱", "New nickname:": "新暱稱:",
    "ChatterBox IRC": "ChatterBox IRC", "Channels": "頻道", "Channel List (/list)": "頻道清單 (/list)",
    "Change Nick (/nick)": "變更暱稱 (/nick)", "NetMeet 98": "NetMeet 98", "Call": "撥號", "Hang Up": "掛斷",
    "No call in progress — use the Call menu": "目前沒有通話 — 請使用撥號功能表",
    "HyperTerminal": "超級終端機", "Connect": "連線", "Disconnect": "中斷連線", "Disconnected": "已中斷連線",
    "Connect To": "連線到", "Phone Dialer": "電話撥號程式", "Dial": "撥號", "Speed dial:": "快速撥號:",
    "Dial-Up Networking": "撥號網路", "Connection Established": "連線已建立", "Working Online": "線上作業",
    "PageCrafter Express": "網頁工匠快手", "Publish!": "發佈!", "Publish to GeoSities": "發佈到 GeoSities",
    "View in Internet Explorer": "在 Internet Explorer 中檢視",

    /* ---- media ---- */
    "CD Player": "CD 播放程式", "Media Player": "媒體播放程式", "Sound Recorder": "錄音機",
    "MegaAmp": "MegaAmp", "Playlist": "播放清單", "Track List": "曲目清單", "SurrealPlayer G2": "SurrealPlayer G2",
    "Magnifier": "放大鏡", "Microsoft Magnifier": "Microsoft 放大鏡", "Magnification:": "放大倍率:",
    "Follows the mouse": "跟隨滑鼠", "On-Screen Keyboard": "螢幕小鍵盤", "Clipboard Viewer": "剪貼簿檢視器",
    "Encyclopedia 98": "百科全書 98", "Search articles...": "搜尋文章...", "No articles found.": "找不到文章。",

    /* ---- Claude / demo ---- */
    "Claude Desktop 98": "Claude 桌面版 98", "New Conversation": "開新對話", "Delete Conversation": "刪除對話",
    "+ New chat": "+ 開新對話", "Message Claude... (Enter to send)": "傳訊給 Claude...（按 Enter 傳送）",
    "Your AI assistant. Local. Private. Beige.": "您的 AI 助手。本機執行、隱私安全、米色機殼。",
    "No conversations yet. Say hello!": "還沒有對話。打個招呼吧!", "MEGADEMO 98": "MEGADEMO 98",
    "PhotoGoo": "照片捏捏樂", "Undo All": "全部復原", "Drag on the picture to goo it": "在圖片上拖曳即可捏捏它",

    /* ---- printing ---- */
    "Print Queue": "列印佇列", "Copies": "份數", "Print range": "列印範圍", "Pause Printing": "暫停列印",
    "Purge Print Documents": "清除列印文件", "EpsonJet 700 Color": "EpsonJet 700 彩色",

    /* ---- calendar / stickies ---- */
    "Calendar 98": "行事曆 98", "Sticky Notes": "便利貼", "Sticky Note": "便利貼", "New Event": "新增事件",
    "Add Event...": "新增事件...", "Previous Month": "上個月", "Next Month": "下個月", "Today": "今天",
    "jot it down before you forget...": "趁還沒忘記趕快記下來...",

    /* ---- misc buttons/labels seen frequently ---- */
    "Import Complete": "匯入完成", "Export to Mac...": "匯出到 Mac...", "Not published": "尚未發佈",
    "Evaluation copy": "評估版", "Register...": "註冊...", "Registration": "註冊", "Memory:": "記憶體:",
    "About this browser": "關於這個瀏覽器", "AltaVibe Search": "AltaVibe 搜尋", "The Windows 98 Start Page": "Windows 98 起始頁",
    "× Close bar": "× 關閉列", "New Search": "新的搜尋", "Find Now": "立即尋找", "Named:": "名稱:",
    "Files or Folders...": "檔案或資料夾...", "On the Internet...": "在網際網路上...",
    "Add to Favorites...": "加入我的最愛...", "Search the Web": "搜尋網頁", "History": "歷程記錄",
    "View Source": "檢視原始檔", "Page Properties": "網頁內容",
    "Up": "上一層", "Views": "檢視", "Address": "網址",

    /* ---- Help topic titles (TOC) + section headers ---- */
    "GETTING STARTED": "開始使用", "DESKTOP & SYSTEM": "桌面與系統", "THE INTERNET": "網際網路",
    "MUSIC, PICTURES & SHOWS": "音樂、圖片與展示", "WRITING & OFFICE": "文書與辦公", "GAMES": "遊戲", "REFERENCE": "參考",
    "Welcome — a quick tour": "歡迎 — 快速導覽", "Keyboard shortcuts": "鍵盤快速鍵",
    "Import & export files (Mac ⇄ 98)": "匯入與匯出檔案 (Mac ⇄ 98)", "Using original sounds & branding": "使用原版音效與商標",
    "Desktop, wallpaper & themes": "桌面、桌布與主題", "Taskbar, tray & Alt+Tab": "工作列、通知區與 Alt+Tab",
    "Calendar 98 & Sticky Notes": "行事曆 98 與便利貼", "Printing": "列印",
    "Add/Remove Programs & Windows Update": "新增/移除程式與 Windows Update", "System tools": "系統工具",
    "Network Neighborhood & DOS networking": "網路上的芳鄰與 DOS 網路指令",
    "Internet Explorer & the 1998 web": "Internet Explorer 與 1998 年的網路", "Pal Messenger, IRC & NetMeet": "Pal 即時通、IRC 與 NetMeet",
    "HyperTerminal & the BBS": "超級終端機與 BBS", "PageCrafter — build your homepage": "網頁工匠 — 打造你的首頁",
    "Music & audio": "音樂與音效", "Paint & PhotoGoo": "小畫家與照片捏捏樂", "MEGADEMO 98 & screensavers": "MEGADEMO 98 與螢幕保護程式",
    "WordPad & Pixel": "WordPad 與 Pixel", "Spreadsheet (Excel 98)": "試算表 (Excel 98)", "Word & PowerPoint": "Word 與 PowerPoint",
    "Games — where everything is": "遊戲 — 全部都在這裡", "FreeCell & Hearts": "新接龍與傷心小棧",
    "Powder Hill, WallBall, Worm & Stackz": "粉雪坡、打磚塊、貪食蟲與疊疊樂", "MS-DOS games & QBasic": "MS-DOS 遊戲與 QBasic",
    "Files, folders & the Recycle Bin": "檔案、資料夾與資源回收筒", "MS-DOS Prompt — full command list": "MS-DOS 命令提示字元 — 完整指令清單",
    "Tips & secrets": "秘訣與彩蛋", "About this recreation": "關於這個復刻版", "MS-DOS Prompt": "MS-DOS 命令提示字元",

    /* ---- Regional Settings applet ---- */
    "Regional Settings": "地區設定", "Regional Settings Properties": "地區設定內容", "Language:": "語言:",
    "Many programs support international settings that you can change. Set your language below.":
      "許多程式支援可變更的國際設定。請在下方設定您的語言。",
    "Changing the language affects menus, dialogs, and Help. A restart is required for the change to take full effect.":
      "變更語言會影響功能表、對話方塊和說明。變更需重新啟動才能完全生效。",
    "Change the language and regional format": "變更語言和地區格式",

    /* ---- a few common status/confirm strings ---- */
    "For Help, click Help Topics on the Help Menu.": "如需說明，請按說明功能表上的「說明主題」。",
    "Windows Help": "Windows 說明", "About Windows 98": "關於 Windows 98", "About ": "關於 ",
    "New Slide": "新增投影片", "Slide Show": "投影片放映", "Delete Slide": "刪除投影片",
    "Presentation": "簡報", "Word": "Word", "PowerPoint": "PowerPoint", "Excel": "Excel", "Spreadsheet": "試算表",
    "Confirm Program Removal": "確認移除程式", "Cannot find the file '": "找不到檔案 '"
  };

  if (W98.I18N_BODY_ZH) Object.assign(ZH, W98.I18N_BODY_ZH);
  const DICTS = { en: null, "zh-TW": ZH };

  /* app display names, so "<title> - <App>" window titles translate cleanly */
  const APPNAME = {
    "Notepad": "記事本", "Paint": "小畫家", "WordPad": "WordPad", "Internet Explorer": "Internet Explorer",
    "Spreadsheet": "試算表", "Sound Recorder": "錄音機", "Composer 98": "作曲家 98", "ZipMaster 7.1": "ZipMaster 7.1",
    "Audio Player": "音效播放程式", "Presentation": "簡報"
  };

  W98.tr = function (s) {
    if (W98.uiLang === "en" || s == null) return s;
    const d = DICTS[W98.uiLang];
    if (!d || typeof s !== "string") return s;
    if (d[s] != null) return d[s];

    /* "<name> - <App>" window titles: translate the app suffix, keep the doc name */
    let m = s.match(/^(.*) - (.+)$/);
    if (m) {
      const app = APPNAME[m[2]] || d[m[2]];
      if (app) return m[1] + " - " + app;
    }
    /* "About <App>" */
    m = s.match(/^About (.+)$/);
    if (m) { const a = d["About " + m[1]] || APPNAME[m[1]] || d[m[1]]; if (a && d["About " + m[1]] == null) return "關於 " + a; }
    /* "<App> Properties" */
    m = s.match(/^(.+) Properties$/);
    if (m && d[m[1]]) return d[m[1]] + " 內容";
    if (W98.uiLang === "zh-TW") {
      /* "N object(s)" / "N object(s) selected" status text */
      m = s.match(/^(\d[\d,]*) object\(s\)( selected)?$/);
      if (m) return m[1] + " 個物件" + (m[2] ? "（已選取）" : "");
      m = s.match(/^About (.+)$/);
      if (m) return "關於 " + (d[m[1]] || APPNAME[m[1]] || m[1]);
    }
    return s;
  };

  /* translate a few static nodes baked into index.html at startup */
  function translateStatic() {
    if (W98.uiLang !== "zh-TW") return;
    const sb = document.getElementById("start-btn");
    if (sb) {
      for (const n of sb.childNodes) if (n.nodeType === 3 && n.textContent.trim() === "Start") n.textContent = "開始";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", translateStatic);
  else translateStatic();

  /* locale-aware date/time helpers other code can opt into */
  W98.locale = function () { return W98.uiLang === "zh-TW" ? "zh-TW" : "en-US"; };

  W98.setUiLang = function (lang) {
    Store.set("uiLang", lang);
  };

  /* apply CJK font stack when a CJK language is active (keeps the pixel font for Latin) */
  if (lang === "zh-TW") {
    const st = document.createElement("style");
    st.textContent = `
      :root { --font: "PixelMSS", "PMingLiU", "MingLiU", "Microsoft JhengHei", "Tahoma", sans-serif; }
      body, button, input, select, textarea { -webkit-font-smoothing: antialiased; }
    `;
    (document.head || document.documentElement).append(st);
  }
})();
