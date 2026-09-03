# -*- coding: utf-8 -*-
import json, sys

sys.stdout.reconfigure(encoding='utf-8')

dict_exact = {
    "advantage": "/ədˈvɑːntɪdʒ/",
    "afford": "/əˈfɔːd/",
    "alter": "/ˈɔːltə(r)/",
    "anniversary": "/ˌænɪˈvɜːsəri/",
    "approve": "/əˈpruːv/",
    "border": "/ˈbɔːdə(r)/",
    "brief": "/briːf/",
    "chief": "/tʃiːf/",
    "conclude": "/kənˈkluːd/",
    "corporation": "/ˌkɔːpəˈreɪʃn/",
    "crew": "/kruː/",
    "defeat": "/dɪˈfiːt/",
    "desert": "/ˈdezət/",
    "disaster": "/dɪˈzɑːstə(r)/",
    "due": "/djuː/",
    "ease": "/iːz/",
    "eastern": "/ˈiːstən/",
    "economics": "/ˌiːkəˈnɒmɪks/",
    "flee": "/fliː/",
    "increase": "/ɪnˈkriːs/",
    "increasingly": "/ɪnˈkriːsɪŋli/",
    "ingredient": "/ɪnˈɡriːdiənt/",
    "journal": "/ˈdʒɜːnl/",
    "journalist": "/ˈdʒɜːnəlɪst/",
    "learning": "/ˈlɜːnɪŋ/",
    "musical": "/ˈmjuːzɪkl/",
    "nerve": "/nɜːv/",
    "ought": "/ɔːt/",
    "overall": "/ˌəʊvərˈɔːl/",
    "personnel": "/ˌpɜːsəˈnel/",
    "pollution": "/pəˈluːʃn/",
    "pour": "/pɔː(r)/",
    "recall": "/rɪˈkɔːl/",
    "repeat": "/rɪˈpiːt/",
    "root": "/ruːt/",
    "routine": "/ruːˈtiːn/",
    "search": "/sɜːtʃ/",
    "seize": "/siːz/",
    "ski": "/skiː/",
    "speed": "/spiːd/",
    "storage": "/ˈstɔːrɪdʒ/",
    "sweep": "/swiːp/",
    "tissue": "/ˈtɪʃuː/",
    "transfer": "/trænsˈfɜː(r)/",
    "urge": "/ɜːdʒ/"
}

words_path = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
with open(words_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for w in data['words']:
    word = w['word']
    if word in dict_exact:
        old_ph = w.get('phonetic', '')
        w['phonetic'] = dict_exact[word]
        count += 1
        print(f"Fixed {word}: {old_ph} -> {w['phonetic']}")

with open(words_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nAll {count} words updated in words.json with standard IPA!")

# Also regenerate words_bundle.js
bundle_path = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words_bundle.js'
with open(bundle_path, 'w', encoding='utf-8') as f:
    f.write('window.KAOYAN_WORDS_DATA = ')
    json.dump(data, f, ensure_ascii=False)
    f.write(';\n')

print("Successfully regenerated data/words_bundle.js!")
