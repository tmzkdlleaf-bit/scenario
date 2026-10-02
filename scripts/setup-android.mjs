// `npx cap add android`로 만든 안드로이드 프로젝트에 CASE FILE 전용 설정을 덮어쓴다.
// 여러 번 실행해도 결과가 같다 (이미 적용된 부분은 건너뜀).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "android/app");
if (!existsSync(app)) { console.error("[setup-android] android 폴더가 없어. 먼저 `npx cap add android`를 실행해."); process.exit(1); }

const pkgDir = join(app, "src/main/java/com/nabi/casefile");
mkdirSync(pkgDir, { recursive: true });

function edit(file, fn) {
  const before = readFileSync(file, "utf8");
  const after = fn(before);
  if (after !== before) writeFileSync(file, after);
}
function mustReplace(text, from, to, label) {
  if (text.includes(to)) return text;            // 이미 적용됨
  if (!text.includes(from)) { console.error(`[setup-android] 찾지 못함: ${label}`); process.exit(1); }
  return text.replace(from, to);
}

/* 1) 인쇄 창을 여는 작은 네이티브 기능 (웹뷰 화면을 안드로이드 인쇄로 넘김 → 'PDF로 저장' 가능) */
writeFileSync(join(pkgDir, "PrintPlugin.java"), `package com.nabi.casefile;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CaseFilePrint")
public class PrintPlugin extends Plugin {

    @PluginMethod
    public void print(final PluginCall call) {
        final String name = call.getString("name", "CASE FILE");
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    WebView webView = getBridge().getWebView();
                    PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                    PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(name);
                    printManager.print(name, adapter, new PrintAttributes.Builder().build());
                    call.resolve();
                } catch (Exception e) {
                    call.reject("print failed: " + e.getMessage());
                }
            }
        });
    }
}
`);

/* 2) 메인 화면: 인쇄 기능 등록 + 시스템 막대 뒤 배경을 앱 배경색으로 */
writeFileSync(join(pkgDir, "MainActivity.java"), `package com.nabi.casefile;

import android.graphics.Color;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PrintPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0a0a0b"));
    }
}
`);

/* 3) 버전 번호(깃허브 빌드 번호)와 서명 설정 */
edit(join(app, "build.gradle"), t => {
  t = mustReplace(t, `        versionCode 1
        versionName "1.0"`, `        versionCode((System.getenv("CF_BUILD_NUMBER") ?: "1").toInteger())
        versionName "1.0." + (System.getenv("CF_BUILD_NUMBER") ?: "0")`, "versionCode");
  t = mustReplace(t, `    buildTypes {
        release {
            minifyEnabled false`, `    signingConfigs {
        release {
            // 깃허브 비밀값(Secrets)에서 받은 서명키. 없으면 임시 키(debug)로 서명된다.
            if (System.getenv("CF_KEYSTORE_FILE")) {
                storeFile file(System.getenv("CF_KEYSTORE_FILE"))
                storePassword System.getenv("CF_KEYSTORE_PASSWORD")
                keyAlias "casefile"
                keyPassword System.getenv("CF_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig System.getenv("CF_KEYSTORE_FILE") ? signingConfigs.release : signingConfigs.debug
            minifyEnabled false`, "signingConfigs");
  return t;
});

/* 4) 테마: 흰 화면 깜빡임 없이 어두운 배경 */
edit(join(app, "src/main/res/values/styles.xml"), t => {
  t = mustReplace(t, `        <item name="android:background">@null</item>
    </style>`, `        <item name="android:background">@null</item>
        <item name="android:windowBackground">@color/cf_background</item>
    </style>`, "NoActionBar 배경");
  t = mustReplace(t, `        <item name="android:background">@drawable/splash</item>
    </style>`, `        <item name="android:background">@drawable/splash</item>
        <item name="windowSplashScreenBackground">@color/cf_background</item>
    </style>`, "Splash 배경");
  return t;
});
const colorsFile = join(app, "src/main/res/values/cf_colors.xml");
writeFileSync(colorsFile, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="cf_background">#0A0A0B</color>
</resources>
`);

/* 5) 안드로이드 10 이하에서 '문서' 폴더에 저장할 수 있게 */
edit(join(app, "src/main/AndroidManifest.xml"), t => {
  t = mustReplace(t, `        android:supportsRtl="true"`, `        android:supportsRtl="true"
        android:requestLegacyExternalStorage="true"`, "requestLegacyExternalStorage");
  t = mustReplace(t, `    <uses-permission android:name="android.permission.INTERNET" />`, `    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />`, "저장소 권한");
  return t;
});

console.log("[setup-android] 완료");
