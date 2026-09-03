import json, os, re

BASE_DIR = r'd:\谷歌反重力\kaoyan_vocab_v9'
VER_FILE = os.path.join(BASE_DIR, 'version.json')

def get_version_info():
    if os.path.exists(VER_FILE):
        with open(VER_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "version": "9.01",
        "version_code": 901,
        "app_name": "考研词汇通_金毛背单词",
        "apk_name": "考研词汇通_金毛背单词_v9.01.apk",
        "zip_name": "考研词汇v9.01.zip"
    }

def bump_version(delta=0.01):
    info = get_version_info()
    cur_v = float(info.get('version', '9.00'))
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
        except Exception as e:
            print("Error updating manifest:", e)
            
    # 2. Update sw.js CACHE name
    sw_path = os.path.join(BASE_DIR, 'sw.js')
    if os.path.exists(sw_path):
        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r"const CACHE = '[^']+';", f"const CACHE = 'kaoyan-v{v_str}-offline-cache';", content)
        with open(sw_path, 'w', encoding='utf-8') as f:
            f.write(content)

    print(f"Applied version v{v_str} across manifest and service worker.")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'bump':
        bump_version()
    else:
        info = get_version_info()
        print("Current version:", info)
        apply_version_to_files(info)
