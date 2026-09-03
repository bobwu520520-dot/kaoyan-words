import os, subprocess, sys, shutil

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

app_dir = r'D:\kaoyan_android_app'
gradle_bat = r'C:\Users\86178\.gradle\wrapper\dists\gradle-8.11.1-all\2qik7nd48slq1ooc2496ixf4i\gradle-8.11.1\bin\gradle.bat'

env = os.environ.copy()
env['JAVA_HOME'] = r'd:\谷歌反重力\jdk17.0.20_10'
env['ANDROID_HOME'] = r'C:\Users\86178\AppData\Local\Android\Sdk'
env['ANDROID_SDK_ROOT'] = r'C:\Users\86178\AppData\Local\Android\Sdk'
env['PATH'] = os.path.join(env['JAVA_HOME'], 'bin') + ';' + env['PATH']

print('Starting Gradle build in', app_dir)
cmd = [gradle_bat, 'clean', 'assembleDebug', '--console=plain']

res = subprocess.run(cmd, cwd=app_dir, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace')

print('--- Gradle STDOUT ---')
print(res.stdout)
if res.stderr:
    print('--- Gradle STDERR ---')
    print(res.stderr)

print(f'\nGradle process exited with code: {res.returncode}')

if res.returncode == 0:
    apk_source = os.path.join(app_dir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
    if os.path.exists(apk_source):
        apk_size = os.path.getsize(apk_source)
        print(f'SUCCESS! APK built at: {apk_source} ({apk_size:,} bytes)')
        
        sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
        import version_manager
        ver_info = version_manager.get_version_info()
        ver_name = ver_info.get('version', '9.01')
        apk_filename = f"考研词汇通_金毛背单词_v{ver_name}.apk"

        # Copy to release locations
        dest_dirs = [r'd:\谷歌反重力', r'D:\Google']
        for d in dest_dirs:
            os.makedirs(d, exist_ok=True)
            target_apk = os.path.join(d, apk_filename)
            shutil.copy2(apk_source, target_apk)
            print(f'Copied APK to: {target_apk} ({os.path.getsize(target_apk):,} bytes)')
            # Also keep latest alias
            alias_apk = os.path.join(d, '考研词汇通_金毛背单词_v9.0.apk')
            shutil.copy2(apk_source, alias_apk)
    else:
        print('APK file not found at expected location')
else:
    print('Build failed!')
