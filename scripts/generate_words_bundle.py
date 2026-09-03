import json, os

data_dir = r'd:\谷歌反重力\kaoyan_vocab_v9\data'
json_path = os.path.join(data_dir, 'words.json')
bundle_path = os.path.join(data_dir, 'words_bundle.js')

with open(json_path, 'r', encoding='utf-8') as f:
    wdata = json.load(f)

with open(bundle_path, 'w', encoding='utf-8') as f:
    f.write('window.__WORDS_DATA__ = ' + json.dumps(wdata, ensure_ascii=False) + ';\n')

count = len(wdata.get('words', []))
size = os.path.getsize(bundle_path)
print(f'Successfully generated {bundle_path} ({size:,} bytes, {count} words)')
