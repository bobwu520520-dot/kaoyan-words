import urllib.request, re, os, zipfile, shutil

mirror_url = 'https://mirrors.tuna.tsinghua.edu.cn/Adoptium/17/jdk/x64/windows/'
req = urllib.request.Request(mirror_url, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

zips = [m for m in re.findall(r'href=["\']([^"\']+\.zip)["\']', html) if 'OpenJDK17' in m]
print('Found JDK 17 zips:', zips)

if zips:
    latest_zip = zips[-1]
    download_url = mirror_url + latest_zip
    print('Downloading from Tsinghua:', download_url)
    
    zip_dest = r'd:\谷歌反重力\jdk17.zip'
    req2 = urllib.request.Request(download_url, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req2, timeout=60) as resp, open(zip_dest, 'wb') as out_f:
        downloaded = 0
        total = int(resp.headers.get('Content-Length', 0))
        while True:
            chunk = resp.read(2 * 1024 * 1024)
            if not chunk:
                break
            out_f.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                print(f'Progress: {downloaded * 100 // total}% ({downloaded // 1024 // 1024}MB / {total // 1024 // 1024}MB)', flush=True)
    
    print('Extracting JDK 17...')
    jdk_dir = r'd:\谷歌反重力\jdk17'
    with zipfile.ZipFile(zip_dest, 'r') as zf:
        top_name = zf.namelist()[0].split('/')[0]
        zf.extractall(r'd:\谷歌反重力')
        extracted_top = os.path.join(r'd:\谷歌反重力', top_name)
        if os.path.exists(jdk_dir):
            shutil.rmtree(jdk_dir)
        os.rename(extracted_top, jdk_dir)
    print('JDK 17 successfully installed at:', jdk_dir)
