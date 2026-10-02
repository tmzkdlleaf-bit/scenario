// 웹 화면이 쓸 수 있는 최소한의 기능만 열어 둔다.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("casefileDesktop", {
  platform: process.platform,
  openExternal: (url) => {
    if (typeof url === "string" && /^(https?:|mailto:)/i.test(url)) ipcRenderer.send("open-external", url);
  }
});
