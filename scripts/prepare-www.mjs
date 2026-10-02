// index.html(원본)을 앱용 www 폴더로 복사한다.
// - 인터넷 주소에서 불러오던 Supabase·Word 변환 도구를 앱 안에 포함 (첫 실행이 빨라지고 오프라인에서도 열림)
// - WEB_URL 환경 변수가 있으면 공유 링크용 웹 주소로 넣어 줌
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "www");
const nm = join(root, "node_modules");

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, "vendor"), { recursive: true });

let html = readFileSync(join(root, "index.html"), "utf8");

function swap(from, to, label) {
  if (!html.includes(from)) { console.error(`[prepare-www] 찾지 못함: ${label}`); process.exit(1); }
  html = html.split(from).join(to);
}
swap('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
     '<script src="vendor/supabase.js"></script>', "Supabase 스크립트");
swap('const DOCX_URL="https://cdn.jsdelivr.net/npm/docx@9.8.1/dist/index.iife.js";',
     'const DOCX_URL="vendor/docx.iife.js";', "Word 변환 도구 주소");

const webUrl = (process.env.WEB_URL || "").trim();
if (webUrl) {
  if (!/^https:\/\//.test(webUrl)) { console.error("[prepare-www] WEB_URL은 https:// 로 시작해야 해: " + webUrl); process.exit(1); }
  swap('const WEB_URL="";', `const WEB_URL=${JSON.stringify(webUrl)};`, "WEB_URL");
}

writeFileSync(join(www, "index.html"), html);
copyFileSync(join(nm, "@supabase/supabase-js/dist/umd/supabase.js"), join(www, "vendor/supabase.js"));
copyFileSync(join(nm, "docx/dist/index.iife.js"), join(www, "vendor/docx.iife.js"));
if (existsSync(join(root, "assets/icon-only.png"))) copyFileSync(join(root, "assets/icon-only.png"), join(www, "icon.png"));

console.log(`[prepare-www] 완료 · 웹 주소: ${webUrl || "(없음)"}`);
