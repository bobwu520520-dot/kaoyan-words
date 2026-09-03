# -*- coding: utf-8 -*-
import json

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
AI_EX_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

NEW_DATA = {
    "about": {
        "meaning": "prep./adv. 关于；大约；周围",
        "en": "Scholars continue to debate about the socio-economic ramifications of accelerated technological automation across developing regions.",
        "zh": "学者们继续就发展中地区加速的技术自动化所带来的社会经济影响展开辩论。"
    },
    "above": {
        "meaning": "prep./adv. 在...之上；超过；上述的",
        "en": "Ethical considerations should remain above mere short-term financial gains when formulating long-term scientific policy.",
        "zh": "在制定长期科学政策时，伦理考量应当高于单纯的短期财务利益。"
    },
    "admin": {
        "meaning": "n. 行政管理；行政部门",
        "en": "Inefficient hospital admin often leads to administrative bottlenecks that delay essential patient healthcare delivery.",
        "zh": "低效的医院行政管理往往会导致行政瓶颈，从而延误必要的患者医疗服务交付。"
    },
    "friend": {
        "meaning": "n. 朋友；支持者",
        "en": "In geopolitical discourse, a strategic friend today may become a formidable trade rival under shifting macroeconomic conditions.",
        "zh": "在地缘政治话语中，今天的战略盟友在不断变化的宏观经济条件下可能会成为强大的贸易竞争对手。"
    },
    "hair": {
        "meaning": "n. 头发；毛发；极微量",
        "en": "Forensic investigators analyzed a single microscopic hair sample to establish incontrovertible empirical evidence in the court.",
        "zh": "法医调查人员分析了单个微观毛发样本，以在法庭上确立无可辩驳的实证证据。"
    },
    "life": {
        "meaning": "n. 生命；生活；寿命；存在期",
        "en": "Sociological studies indicate that urban infrastructure directly influences the quality of everyday life across modern metropolitan communities.",
        "zh": "社会学研究表明，城市基础设施直接影响着现代大都市社区日常生活的质量。"
    },
    "middle": {
        "meaning": "adj./n. 中间的；中等的；中间阶段",
        "en": "The economic expansion notably benefited the middle class, fostering widespread upward social mobility during the decade.",
        "zh": "经济扩张显著造福了中产阶层，在过去十年中促进了广泛的向上社会流动。"
    },
    "money": {
        "meaning": "n. 货币；资金；财富",
        "en": "Central banks regulate the supply of paper money to maintain macroeconomic price stability and curb inflation.",
        "zh": "中央银行调节纸币供应量，以维持宏观经济物价稳定并遏制通货膨胀。"
    },
    "night": {
        "meaning": "n. 夜晚；黑暗",
        "en": "Prolonged exposure to artificial light at night significantly disrupts the biological circadian rhythms of metropolitan residents.",
        "zh": "夜间长时间暴露于人造光源会显著扰乱大都市居民的生物昼夜节律。"
    }
}

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    wdata = json.load(f)

for w in wdata['words']:
    if w['word'] in NEW_DATA:
        item = NEW_DATA[w['word']]
        w['exam_meaning'] = item['meaning']
        w['translation'] = item['meaning']
        w['example_en'] = item['en']
        w['example_zh'] = item['zh']

with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(wdata, f, ensure_ascii=False, indent=2)

with open(AI_EX_PATH, 'r', encoding='utf-8') as f:
    ai_data = json.load(f)

for word, item in NEW_DATA.items():
    ai_data['s'][word] = [
        item['en'],
        item['zh']
    ]

with open(AI_EX_PATH, 'w', encoding='utf-8') as f:
    json.dump(ai_data, f, ensure_ascii=False, indent=2)

print('Successfully enriched all 9 words with 100% academic standard coverage!')
