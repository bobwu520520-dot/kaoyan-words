import json, os

data_dir = r'd:\谷歌反重力\kaoyan_vocab_v9\data'

# 1. words_bundle.js
with open(os.path.join(data_dir, 'words.json'), 'r', encoding='utf-8') as f:
    wdata = json.load(f)
raw_words = json.dumps(wdata, ensure_ascii=False)
with open(os.path.join(data_dir, 'words_bundle.js'), 'w', encoding='utf-8') as f:
    f.write('window.__WORDS_DATA__ = window.__WORDS__ = ' + raw_words + ';\n')
print(f"Bundled words_bundle.js: {len(wdata.get('words', []))} words")

# 2. ai_examples_bundle.js
with open(os.path.join(data_dir, 'ai_examples.json'), 'r', encoding='utf-8') as f:
    aidata = json.load(f)
raw_ai = json.dumps(aidata, ensure_ascii=False)
with open(os.path.join(data_dir, 'ai_examples_bundle.js'), 'w', encoding='utf-8') as f:
    f.write('window.__AI_EXAMPLES__ = window.__AI_EX__ = ' + raw_ai + ';\n')
print(f"Bundled ai_examples_bundle.js: {len(aidata.get('s', {}))} examples")

# 3. translations_bundle.js
with open(os.path.join(data_dir, 'translations.json'), 'r', encoding='utf-8') as f:
    tdata = json.load(f)
raw_trans = json.dumps(tdata, ensure_ascii=False)
with open(os.path.join(data_dir, 'translations_bundle.js'), 'w', encoding='utf-8') as f:
    f.write('window.__TRANSLATIONS_DATA__ = window.__TRANSLATIONS__ = ' + raw_trans + ';\n')
print(f"Bundled translations_bundle.js: {len(tdata.get('sentences', []))} sentences")

# 4. exam_data_bundle.js (Standardized datasets + legacy aliases)
exam_data = {}
bundle_code = []

# Standardized exam datasets
exam_categories = ['cloze', 'reading', 'newtype', 'writing', 'suite']
for cat in exam_categories:
    fpath = os.path.join(data_dir, f'exam_{cat}.json')
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            d = json.load(f)
            exam_data[cat] = d

# Legacy aliases for backward compatibility
legacy_mapping = {
    'writings_b': '__EXAM_WRITINGS_B__',
    'writings_a': '__EXAM_WRITINGS_A__',
    'reading_real': '__EXAM_READING__',
    'cloze_real': '__EXAM_CLOZE__',
    'newtype_real': '__EXAM_NEWTYPE__'
}
for fname, varname in legacy_mapping.items():
    fpath = os.path.join(data_dir, f'{fname}.json')
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            d = json.load(f)
            exam_data[fname] = d
            bundle_code.append(f'window.{varname} = ' + json.dumps(d, ensure_ascii=False) + ';\n')

bundle_code.insert(0, 'window.__EXAM_DATA__ = ' + json.dumps(exam_data, ensure_ascii=False) + ';\n')
with open(os.path.join(data_dir, 'exam_data_bundle.js'), 'w', encoding='utf-8') as f:
    f.write(''.join(bundle_code))
print(f"Bundled exam_data_bundle.js: {list(exam_data.keys())}")

