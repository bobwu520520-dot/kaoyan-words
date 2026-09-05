import os, shutil, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import version_manager
ver_info = version_manager.get_version_info()
ver_name = ver_info.get('version', '9.01')
ver_code = ver_info.get('version_code', 901)

app_dir = r'D:\kaoyan_android_app'
os.makedirs(app_dir, exist_ok=True)

# 1. Root build.gradle
root_build_gradle = """// Top-level build file
buildscript {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
    }
}
"""
with open(os.path.join(app_dir, 'build.gradle'), 'w', encoding='utf-8') as f:
    f.write(root_build_gradle)

# 2. settings.gradle with Aliyun mirrors
settings_gradle = """pluginManagement {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/central' }
        google()
        mavenCentral()
    }
}
rootProject.name = 'KaoyanVocab'
include ':app'
"""
with open(os.path.join(app_dir, 'settings.gradle'), 'w', encoding='utf-8') as f:
    f.write(settings_gradle)

# 3. gradle.properties
gradle_props = """org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.overridePathCheck=true
"""
with open(os.path.join(app_dir, 'gradle.properties'), 'w', encoding='utf-8') as f:
    f.write(gradle_props)

# 4. App directory
app_module_dir = os.path.join(app_dir, 'app')
src_main = os.path.join(app_module_dir, 'src', 'main')
java_dir = os.path.join(src_main, 'java', 'com', 'kaoyan', 'vocab')
res_dir = os.path.join(src_main, 'res')
assets_dir = os.path.join(src_main, 'assets')
os.makedirs(java_dir, exist_ok=True)
os.makedirs(res_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

# 5. App build.gradle (zero external dependencies)
app_build_gradle = f"""plugins {{
    id 'com.android.application'
}}

android {{
    namespace 'com.kaoyan.vocab'
    compileSdk 35

    defaultConfig {{
        applicationId 'com.kaoyan.vocab'
        minSdk 24
        targetSdk 35
        versionCode {ver_code}
        versionName '{ver_name}'
    }}

    buildTypes {{
        release {{
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }}
        debug {{
            debuggable false
        }}
    }}
    compileOptions {{
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }}
}}

dependencies {{
    // Pure Android SDK WebView implementation - fast and standalone
}}
"""
with open(os.path.join(app_module_dir, 'build.gradle'), 'w', encoding='utf-8') as f:
    f.write(app_build_gradle)

# 6. Copy clean runtime web assets to assets_dir
web_src = r'd:\谷歌反重力\kaoyan_vocab_v9'
import clean_redundant_assets
clean_redundant_assets.copy_runtime_assets(web_src, assets_dir)
print('Copied clean runtime assets to android assets folder')

# 7. Generate Android Mipmap icons from golden retriever puppy image
icon_src = os.path.join(web_src, 'icon-512.png')
if os.path.exists(icon_src):
    im = Image.open(icon_src)
    densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    for folder, size in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        resized = im.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(folder_path, 'ic_launcher.png'))
        resized.save(os.path.join(folder_path, 'ic_launcher_round.png'))
    print('Generated all mipmap icons from golden retriever puppy image!')

# 8. res/values
values_dir = os.path.join(res_dir, 'values')
os.makedirs(values_dir, exist_ok=True)

with open(os.path.join(values_dir, 'strings.xml'), 'w', encoding='utf-8') as f:
    f.write('''<resources>
    <string name="app_name">考研词汇通</string>
</resources>''')

with open(os.path.join(values_dir, 'colors.xml'), 'w', encoding='utf-8') as f:
    f.write('''<resources>
    <color name="colorPrimary">#1d5a63</color>
    <color name="colorPrimaryDark">#133e44</color>
    <color name="colorAccent">#d97706</color>
    <color name="statusBarColor">#f6f7f4</color>
</resources>''')

with open(os.path.join(values_dir, 'styles.xml'), 'w', encoding='utf-8') as f:
    f.write('''<resources>
    <style name="AppTheme" parent="@android:style/Theme.Material.Light.NoActionBar">
        <item name="android:colorPrimary">#1d5a63</item>
        <item name="android:colorPrimaryDark">#133e44</item>
        <item name="android:colorAccent">#d97706</item>
        <item name="android:windowBackground">#f6f7f4</item>
        <item name="android:fitsSystemWindows">true</item>
        <item name="android:statusBarColor">#f6f7f4</item>
        <item name="android:windowLightStatusBar">true</item>
    </style>
</resources>''')

# 9. AndroidManifest.xml
manifest = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="false"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
with open(os.path.join(src_main, 'AndroidManifest.xml'), 'w', encoding='utf-8') as f:
    f.write(manifest)

# 10. MainActivity.java (fitsSystemWindows & never covers battery/status bar)
main_activity = """package com.kaoyan.vocab;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView mWebView;
    private long mLastBackPressTime = 0;

    @SuppressLint({"SetJavaScriptEnabled", "RequiresFeature"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure system status bar & battery bar are never obscured
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#f6f7f4"));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View decor = window.getDecorView();
            decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        rootLayout.setFitsSystemWindows(true);

        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        mWebView.setFitsSystemWindows(true);

        rootLayout.addView(mWebView);
        setContentView(rootLayout);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file:///android_asset/") || 
                    url.startsWith("http://127.0.0.1") || 
                    url.startsWith("http://localhost")) {
                    return false;
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return shouldOverrideUrlLoading(view, request.getUrl().toString());
            }
        });

        mWebView.setDownloadListener(new android.webkit.DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return super.onConsoleMessage(consoleMessage);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        mWebView.clearCache(true);
        mWebView.loadUrl("file:///android_asset/study.html");
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            long now = System.currentTimeMillis();
            if (now - mLastBackPressTime < 2000) {
                super.onBackPressed();
            } else {
                mLastBackPressTime = now;
                Toast.makeText(this, "再按一次退出考研词汇通", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
"""
with open(os.path.join(java_dir, 'MainActivity.java'), 'w', encoding='utf-8') as f:
    f.write(main_activity)

print('Android project updated successfully with non-fullscreen status bar safe area!')
