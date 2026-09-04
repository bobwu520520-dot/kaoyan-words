# -*- coding: utf-8 -*-
import json, os, re, sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = r'd:\谷歌反重力\kaoyan_vocab_v9'
VER_FILE = os.path.join(BASE_DIR, 'version.json')
ANDROID_GRADLE = r'D:\kaoyan_android_app\app\build.gradle'

def get_version_info():
    if os.path.exists(VER_FILE):
        with open(VER_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "version": "9.65",
        "version_code": 965,
        "app_name": "考研词汇通_金毛背单词",
        "apk_name": "考研词汇通_金毛背单词_v9.65.apk",
        "zip_name": "考研词汇v9.65.zip"
    }

def bump_version(delta=0.01):
    info = get_version_info()
    cur_v = float(info.get('version', '9.65'))
    new_v = round(cur_v + delta, 2)
    new_v_str = f"{new_v:.2f}"
    new_code = int(round(new_v * 100))
    
    info['version'] = new_v_str
    info['version_code'] = new_code
    info['apk_name'] = f"考研词汇通_金毛背单词_v{new_v_str}.apk"
    info['zip_name'] = f"考研词汇v{new_v_str}.zip"
    
    with open(VER_FILE, 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=2)
    
    print(f"Version bumped to: v{new_v_str} (code: {new_code})")
    apply_version_to_files(info)
    return info

def apply_version_to_files(info=None):
    if info is None:
        info = get_version_info()
    v_str = info['version']
    v_code = info['version_code']
    
    # 1. Update manifest.webmanifest
    manifest_path = os.path.join(BASE_DIR, 'manifest.webmanifest')
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                m = json.load(f)
            m['name'] = f"考研词汇通 v{v_str} · 艾宾浩斯真题背诵"
            m['short_name'] = f"考研词汇v{v_str}"
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(m, f, ensure_ascii=False, indent=2)
            print("[OK] manifest.webmanifest updated")
        except Exception as e:
            print("Error updating manifest:", e)
            
    # 2. Update sw.js CACHE name
    sw_path = os.path.join(BASE_DIR, 'sw.js')
    if os.path.exists(sw_path):
        try:
            with open(sw_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r"const CACHE = '[^']+';", f"const CACHE = 'kaoyan-v{v_str}-offline-cache';", content)
            with open(sw_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[OK] sw.js cache name updated")
        except Exception as e:
            print("Error updating sw.js:", e)

    # 3. Update js/pwa.js version variables
    pwa_path = os.path.join(BASE_DIR, 'js', 'pwa.js')
    if os.path.exists(pwa_path):
        try:
            with open(pwa_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r"var CURRENT_VERSION_CODE = \d+;", f"var CURRENT_VERSION_CODE = {v_code};", content)
            content = re.sub(r"var CURRENT_VERSION_STR = '[^']+';", f"var CURRENT_VERSION_STR = '{v_str}';", content)
            with open(pwa_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[OK] js/pwa.js version variables updated")
        except Exception as e:
            print("Error updating js/pwa.js:", e)

    # 4. Update js/memory.js version variable
    mem_js_path = os.path.join(BASE_DIR, 'js', 'memory.js')
    if os.path.exists(mem_js_path):
        try:
            with open(mem_js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r"var currentAppVersionStr = '[^']+';", f"var currentAppVersionStr = '{v_str}';", content)
            with open(mem_js_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[OK] js/memory.js version variable updated")
        except Exception as e:
            print("Error updating js/memory.js:", e)

    # 5. Update js/cloud_sync.js version field
    sync_js_path = os.path.join(BASE_DIR, 'js', 'cloud_sync.js')
    if os.path.exists(sync_js_path):
        try:
            with open(sync_js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r"version:\s*'[^']+'", f"version: '{v_str}'", content)
            with open(sync_js_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[OK] js/cloud_sync.js version field updated")
        except Exception as e:
            print("Error updating js/cloud_sync.js:", e)

    # 6. Update memory.html version badges and titles
    mem_html_path = os.path.join(BASE_DIR, 'memory.html')
    if os.path.exists(mem_html_path):
        try:
            with open(mem_html_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r'id="mem-version-badge">v[^<]+<', f'id="mem-version-badge">v{v_str}<', content)
            content = re.sub(r'id="mem-version-desc">版本 v[^·]+·', f'id="mem-version-desc">版本 v{v_str} ·', content)
            content = re.sub(r'id="mem-version-title"[^>]*>v[^<]+<', f'id="mem-version-title" style="font-size:12px;color:var(--color-primary);font-weight:700;margin-top:2px">v{v_str} 旗舰离线增强版<', content)
            with open(mem_html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[OK] memory.html version tags updated")
        except Exception as e:
            print("Error updating memory.html:", e)

    # 7. Update Android build.gradle
    if os.path.exists(ANDROID_GRADLE):
        try:
            with open(ANDROID_GRADLE, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r"versionCode\s+\d+", f"versionCode {v_code}", content)
            content = re.sub(r"versionName\s+'[^']+'", f"versionName '{v_str}'", content)
            with open(ANDROID_GRADLE, 'w', encoding='utf-8') as f:
                f.write(content)
            print(r"[OK] D:\kaoyan_android_app\app\build.gradle updated")
        except Exception as e:
            print("Error updating Android build.gradle:", e)

    print(f"\nSuccessfully applied v{v_str} across all project files!")

if __name__ == '__main__':
    info = get_version_info()
    print("Applying version:", info['version'])
    apply_version_to_files(info)
