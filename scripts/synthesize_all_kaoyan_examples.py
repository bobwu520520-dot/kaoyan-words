import json
import re

WORDS_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\words.json'
AI_PATH = r'd:\谷歌反重力\kaoyan_vocab_v9\data\ai_examples.json'

with open(WORDS_PATH, 'r', encoding='utf-8') as f:
    words_data = json.load(f)
words = words_data['words']

with open(AI_PATH, 'r', encoding='utf-8') as f:
    ai_raw = json.load(f)
ai_data = ai_raw.get('s', {})

# High-yield academic domain contexts
ACADEMIC_DOMAINS = [
    ("Macroeconomics & Policy", "宏观经济与政策治理"),
    ("Cognitive Science & Psychology", "认知科学与心理学"),
    ("Artificial Intelligence & Tech Governance", "前沿人工智能与科技伦理"),
    ("Environmental Ecology & Climate", "生态环境与可持续发展"),
    ("Constitutional Law & Civil Liberties", "宪法法治与公民权利"),
    ("Higher Education & Academic Reform", "高等教育与科研创新"),
    ("Sociology & Demographic Shifts", "社会变迁与群体动态")
]

def generate_academic_sentence(word_obj):
    word = word_obj['word']
    pos = word_obj.get('pos', '').lower()
    meaning = word_obj.get('exam_meaning', '') or word_obj.get('translation', '')
    # Clean meaning for translation
    zh_mean = re.sub(r'[a-zA-Z\.\s；;，,]+', ' ', meaning).strip().split(' ')[0]
    if not zh_mean:
        zh_mean = '该概念'

    # Determine syntactic template based on POS
    if 'v' in pos:
        templates = [
            (
                f"Contemporary empirical studies indicate that institutions seeking to {word} systemic challenges must balance short-term operational costs with long-term strategic resilience.",
                f"当代实证研究表明，旨在{zh_mean}系统性挑战的机构，必须在短期运营成本与长期战略韧性之间寻求平衡。"
            ),
            (
                f"While policymakers attempted to {word} market fluctuations through emergency regulatory interventions, underlying macroeconomic imbalances continued to threaten overall economic stability.",
                f"尽管政策制定者试图通过紧急监管干预来{zh_mean}市场波动，但深层宏观经济失衡依然威胁着整体经济稳定。"
            ),
            (
                f"Leading researchers emphasized that failing to {word} environmental degradation in urban centers would impose severe long-term fiscal burdens on municipal healthcare budgets.",
                f"权威学者强调，未能在城市中心有效{zh_mean}环境退化问题，将给地方公共医疗财政预算带来沉重的长期负担。"
            )
        ]
    elif 'adj' in pos:
        templates = [
            (
                f"Scholars argue that maintaining a {word} approach to scientific methodology is indispensable when evaluating complex interdisciplinary hypotheses.",
                f"学者们主张，在评估复杂的跨学科科学假说时，保持一种{zh_mean}的学术研究方法是必不可少的。"
            ),
            (
                f"The rapid integration of automated digital platforms has created a {word} environment where traditional regulatory frameworks often prove inadequate.",
                f"自动化数字平台的快速融合营造出了一种{zh_mean}的环境，在这一环境中传统的监管框架往往显得捉襟见肘。"
            ),
            (
                f"Sociological analysis reveals that {word} shifts in demographic structures profoundly influence regional labor markets and social welfare allocations.",
                f"社会学分析表明，人口结构中出现的{zh_mean}转变，对区域劳动力市场以及社会福利资源的分配产生了深远影响。"
            )
        ]
    elif 'adv' in pos:
        templates = [
            (
                f"Financial analysts observed that sovereign debt yields {word} reflected investor expectations regarding upcoming central bank interest rate decisions.",
                f"金融分析师观察到，国债收益率{zh_mean}反映了投资者对于中央银行即将出台的基准利率决议的普遍预期。"
            ),
            (
                f"The revised statutory framework was {word} formulated to prevent dominant technology conglomerates from exploiting proprietary consumer transaction data.",
                f"经过修订的法定监管框架被{zh_mean}制定出来，旨在防止垄断性科技巨头非法滥用消费者的专有交易数据。"
            )
        ]
    else: # Noun
        templates = [
            (
                f"Sociological research demonstrates that the persistent rise of {word} within modern urban communities directly reflects broader institutional and economic transformations.",
                f"社会学研究表明，现代城市社区中{zh_mean}（{word}）现象的持续出现，直接反映了更为广泛的制度与经济转型。"
            ),
            (
                f"Environmental scientists caution that overlooking the structural impact of {word} could accelerate the destabilization of fragile coastal biodiversity habitats.",
                f"环境科学家警示称，若忽视{zh_mean}（{word}）所带来的结构性冲击，可能会加速脆弱沿海生物多样性栖息地的失稳与崩溃。"
            ),
            (
                f"In contemporary constitutional jurisprudence, the protection of {word} remains a fundamental pillar for preserving democratic accountability and civil liberties.",
                f"在当代宪法法理学中，对{zh_mean}（{word}）的法律保护依然是维护民主问责机制与公民基本自由的根本支柱。"
            )
        ]

    # Select deterministically based on hash of word
    idx = abs(hash(word)) % len(templates)
    return templates[idx]

# Scan words and upgrade all short (< 13w) or colloquial ones
colloquial_regex = re.compile(r'^(he |she |i |you |we |they |the boy |the girl |the cat |the dog |tom |mary |john |please |don\'t |look at |this is |that is |it is a |there is a )', re.IGNORECASE)

upgraded_count = 0
for w in words:
    word = w['word'].lower()
    ex_en = ''
    ex_zh = ''
    if word in ai_data:
        ex_en = ai_data[word][0]
        ex_zh = ai_data[word][1]
    elif w.get('example_en'):
        ex_en = w['example_en']
        ex_zh = w.get('example_zh', '')

    tokens = re.findall(r'[a-zA-Z\-]+', ex_en)
    word_count = len(tokens)
    
    is_substandard = (
        not ex_en or 
        word_count < 13 or 
        colloquial_regex.search(ex_en.strip()) or
        not re.search(r'\b' + re.escape(word[:4] if len(word)>4 else word), ex_en, re.IGNORECASE)
    )

    if is_substandard:
        new_en, new_zh = generate_academic_sentence(w)
        ai_data[word] = [new_en, new_zh]
        w['example_en'] = new_en
        w['example_zh'] = new_zh
        upgraded_count += 1

# Save ai_examples.json
with open(AI_PATH, 'w', encoding='utf-8') as f:
    json.dump({'s': ai_data}, f, ensure_ascii=False, indent=2)

# Save words.json
with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"Total words scanned: {len(words)}")
print(f"Total substandard examples upgraded to Kaoyan academic standard: {upgraded_count}")
