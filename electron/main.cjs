// CASE FILE 윈도우 앱 — www/index.html을 창 하나에 띄운다.
const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const BG = "#0a0a0b";
let win = null;

// 같은 앱을 두 번 켜면 기존 창을 앞으로
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
}

// 창 크기·위치 기억
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return { width: 1280, height: 840 }; }
}
function saveState() {
  if (!win || win.isDestroyed()) return;
  const b = win.getNormalBounds();
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() })); } catch {}
}

function isExternal(url) { return /^https?:/i.test(url) || /^mailto:/i.test(url); }

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1280, height: st.height || 840, x: st.x, y: st.y,
    minWidth: 420, minHeight: 560,
    backgroundColor: BG,
    title: "CASE FILE",
    icon: path.join(__dirname, "../assets/desktop-icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  if (st.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());

  // 새 창·외부 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (isExternal(url)) { e.preventDefault(); shell.openExternal(url); }
  });

  // 저장 안 된 변경이 있을 때 닫으려 하면 물어봄
  win.webContents.on("will-prevent-unload", (e) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: "warning",
      buttons: ["잠깐 기다리기", "그래도 닫기"],
      defaultId: 0, cancelId: 0,
      title: "CASE FILE",
      message: "아직 저장되지 않은 변경이 있어.",
      detail: "몇 초 기다리면 자동으로 저장돼. 지금 닫으면 마지막 몇 초의 수정이 사라질 수 있어."
    });
    if (choice === 1) e.preventDefault(); // preventDefault = 닫기를 막는 걸 취소 → 닫힘
  });

  // 파일 받기: 저장 위치를 고르는 창
  win.webContents.session.on("will-download", (_e, item) => {
    item.setSaveDialogOptions({ title: "저장할 위치", defaultPath: path.join(app.getPath("documents"), item.getFilename()) });
  });

  win.on("close", saveState);
  win.loadFile(path.join(__dirname, "../www/index.html"));
}

// 편집 단축키(복사·붙여넣기·실행취소)는 유지하면서 메뉴 막대는 숨김
Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: "편집", submenu: [
    { role: "undo", label: "실행 취소" }, { role: "redo", label: "다시 실행" }, { type: "separator" },
    { role: "cut", label: "잘라내기" }, { role: "copy", label: "복사" }, { role: "paste", label: "붙여넣기" },
    { role: "selectAll", label: "모두 선택" }
  ]},
  { label: "보기", submenu: [
    { role: "reload", label: "새로고침" }, { role: "toggleDevTools", label: "개발자 도구" }, { type: "separator" },
    { role: "resetZoom", label: "기본 크기" }, { role: "zoomIn", label: "확대" }, { role: "zoomOut", label: "축소" },
    { type: "separator" }, { role: "togglefullscreen", label: "전체 화면" }
  ]}
]));

ipcMain.on("open-external", (_e, url) => { if (typeof url === "string" && isExternal(url)) shell.openExternal(url); });
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
