import json

data = json.load(open('data/words.json', encoding='utf-8'))
words = {w['word'].lower(): w for w in data['words']}

test_words = ['abandon', 'abolish', 'abruptly', 'concession', 'deliberate', 'dilemma', 'meticulous', 'pervasive', 'relentless', 'undermine', 'vulnerable', 'zeal']

for tw in test_words:
    if tw in words:
        w = words[tw]
        print(f"=== {tw.upper()} [{w.get('tier','-')}] ===")
        print("EN:", w.get('example_en'))
        print("ZH:", w.get('example_zh'))
        print()
