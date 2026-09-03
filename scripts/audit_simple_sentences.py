import json
import re

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
AI_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)
words = words_data['words']

with open(AI_PATH, 'r', encoding='utf-8') as f:
    ai_data = json.load(f).get('s', {})

simple_words = []
colloquial_regex = re.compile(r'^(he |she |i |you |we |they |the boy |the girl |the cat |the dog |tom |mary |john |please |don\'t |look at |this is |that is |it is a |there is a )', re.IGNORECASE)

for w in words:
    word = w['word'].lower()
    ex_en = ''
    ex_zh = ''
    src = ''
    if word in ai_data:
        ex_en, ex_zh = ai_data[word][0], ai_data[word][1]
        src = 'ai'
    elif w.get('example_en'):
        ex_en = w['example_en']
        ex_zh = w.get('example_zh', '')
        src = 'words.json'
    
    if not ex_en:
        simple_words.append((w, 'missing', '', '', src))
        continue

    tokens = re.findall(r'[a-zA-Z\-]+', ex_en)
    word_count = len(tokens)
    
    reasons = []
    if word_count < 13:
        reasons.append(f'short ({word_count}w)')
    if colloquial_regex.search(ex_en.strip()):
        reasons.append('colloquial')
    
    # Check if target word stem actually appears
    stem = word[:4] if len(word) > 4 else word
    if not re.search(r'\b' + re.escape(stem), ex_en, re.IGNORECASE):
        reasons.append('target_missing')

    if reasons:
        simple_words.append((w, ', '.join(reasons), ex_en, ex_zh, src))

print(f"Total words: {len(words)}")
print(f"Simple/Substandard examples: {len(simple_words)} ({len(simple_words)/len(words)*100:.1f}%)")

print("\n--- SAMPLE SUBSTANDARD EXAMPLES ---")
for w, reason, en, zh, src in simple_words[:20]:
    print(f"[{w['word']:15}] ({reason:20}) [{src:10}]: {en}")
