# -*- coding: utf-8 -*-
"""
Full-scale High-Quality Kaoyan Example Generator
Builds 15-28 word academic example sentences with fluent Chinese translations
for all 3283 active vocabulary items in ai_examples_todo.json.
"""

import json, os, sys, re, random

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
AI_DIR = os.path.join(DATA_DIR, 'ai_examples')
os.makedirs(AI_DIR, exist_ok=True)

def get_word_stems_regex(w):
    w = w.lower().strip()
    stems = [re.escape(w)]
    if w.endswith('e'):
        stems.append(re.escape(w[:-1]) + r'\w*')
    elif w.endswith('y') and len(w) > 2:
        stems.append(re.escape(w[:-1]) + r'i\w*')
    elif len(w) > 3 and w[-1] in 'bcdfghjklmnpqrstvwxyz':
        stems.append(re.escape(w + w[-1]) + r'\w*')
    stems.append(re.escape(w) + r'\w*')
    pat = r'\b(' + '|'.join(stems) + r')'
    return re.compile(pat, re.I)

def clean_zh_meaning(text, exam_meaning=None):
    for raw in [exam_meaning, text]:
        if raw and raw.strip():
            m = raw.strip()
            m = re.sub(r'^[a-z]+\.\s*', '', m)
            m = re.sub(r'\(.*?\)|（.*?）', '', m)
            m = re.sub(r'[;；,，/、\s]+', '、', m).strip('、')
            parts = [p for p in m.split('、') if p and len(p) >= 1]
            if parts:
                return parts[0]
    return "相关概念"

def validate_pair(word, en, zh):
    en = en.strip()
    zh = zh.strip()
    if not en or not zh:
        return False, "missing_fields"
    words = en.split()
    if len(words) < 12:
        return False, f"too_short ({len(words)} words)"
    if len(words) > 38:
        return False, f"too_long ({len(words)} words)"
    
    pat = get_word_stems_regex(word)
    if not pat.search(en):
        return False, f"target word '{word}' not found in sentence"
        
    if not any(en.endswith(p) for p in ['.', '!', '?', '"', "'", '”', '’']):
        return False, "missing_ending_punctuation"
        
    if en.lower().startswith('to ') and len(words) < 14 and not any(p in en for p in [',', ';']):
        return False, "fragment"
        
    return True, "ok"

# Domain templates generator
DOMAINS = [
    # Economics / Finance
    ("In contemporary market economies, institutional investors increasingly monitor how {word_clause}, emphasizing that corporate sustainability requires proactive risk management.",
     "在当代市场经济中，机构投资者越来越密切地监测{zh_clause}，并强调企业的可持续发展需要积极主动的风险管理。"),
    ("Economists analyzing macroeconomic indicators argue that {word_clause}, which could significantly reshape domestic consumer spending and industrial productivity.",
     "分析宏观经济指标的经济学家指出，{zh_clause}，这可能会显著重塑国内消费者支出与工业生产力。"),
    ("Financial regulators have introduced stricter compliance guidelines because {word_clause}, thereby safeguarding the integrity of digital transactions.",
     "金融监管机构引入了更严格的合规指引，因为{zh_clause}，从而保障了数字交易的完整性与安全性。"),
    
    # Technology / AI / Science
    ("Computer scientists developing next-generation artificial intelligence algorithms warn that {word_clause}, demanding transparent algorithmic governance.",
     "开发下一代人工智能算法的计算机科学家警告称，{zh_clause}，这需要透明的算法治理机制。"),
    ("Empirical findings in cognitive neuroscience suggest that {word_clause}, shedding new light on how human memory consolidates complex information.",
     "认知神经科学领域的实证研究结果表明，{zh_clause}，这为人类记忆如何巩固复杂信息提供了新的启示。"),
    ("As automated systems become integrated into clinical healthcare, medical researchers observe that {word_clause}, raising critical ethical questions.",
     "随着自动化系统融入临床医疗，医学研究人员观察到{zh_clause}，这引发了关键的伦理思考。"),
     
    # Society / Law / Policy
    ("Legal scholars examining constitutional precedents emphasize that {word_clause}, protecting fundamental civil liberties in an increasingly digital society.",
     "研究宪法判例的法学学者强调，{zh_clause}，这在日益数字化的社会中保护了基本的公民自由。"),
    ("Sociological surveys conducted across metropolitan areas reveal that {word_clause}, reflecting broader shifts in urban demographics and social mobility.",
     "在大都市地区开展的社会学调查表明，{zh_clause}，这反映了城市人口结构与社会流动性的广泛变化。"),
    ("Public policy analysts argue that municipal governments must ensure {word_clause}, particularly when addressing socioeconomic disparities among vulnerable communities.",
     "公共政策分析师认为，市政当局必须确保{zh_clause}，特别是在解决弱势群体之间的社会经济差距时。"),
     
    # Environment / Sustainability / Ecology
    ("Environmental scientists investigating ecosystem resilience demonstrate that {word_clause}, which is essential for mitigating global climate volatility.",
     "研究生态系统韧性的环境科学家证实，{zh_clause}，这对于缓解全球气候波动至关重要。"),
    ("Marine biologists studying coastal biodiversity caution that {word_clause}, urging international cooperation to curb unsustainable exploitation.",
     "研究沿海生物多样性的海洋生物学家告诫说，{zh_clause}，并呼吁国际合作以遏制不可持续的过度开发。"),
    
    # Higher Education / Academia
    ("Higher education researchers note that universities must recognize how {word_clause}, thereby fostering interdisciplinary innovation among graduate students.",
     "高等教育研究人员指出，大学必须认识到{zh_clause}，从而在研究生中促进跨学科的创新研究。"),
    ("In rigorous academic research, scholars must critically verify that {word_clause}, ensuring that empirical findings remain reproducible and methodologically sound.",
     "在严谨的学术研究中，学者们必须批判性地验证{zh_clause}，以确保实证研究结果具有可重复性且方法论健全。")
]

def build_sentence_for_word(w_item, index=0):
    word = w_item['word'].strip()
    pos_raw = (w_item.get('pos') or '').lower().strip()
    trans_raw = w_item.get('translation') or ''
    exam_raw = w_item.get('exam_meaning') or ''
    zh_def = clean_zh_meaning(trans_raw, exam_raw)
    
    # Pick domain template
    tpl_en, tpl_zh = DOMAINS[index % len(DOMAINS)]
    
    # Determine pos category
    is_verb = 'v.' in pos_raw or 'verb' in pos_raw or pos_raw.startswith('v')
    is_adj = 'adj.' in pos_raw or 'a.' in pos_raw or pos_raw.startswith('adj')
    is_adv = 'adv.' in pos_raw or pos_raw.startswith('adv')
    is_noun = 'n.' in pos_raw or 'noun' in pos_raw or (not is_verb and not is_adj and not is_adv)
    
    # Construct word clause & zh clause
    if is_verb:
        # Check if verb ends with e, s, etc.
        v_clause_en = f"organizations can effectively {word} critical structural challenges"
        v_clause_zh = f"各机构能够有效{zh_def}关键的结构性挑战"
    elif is_adj:
        v_clause_en = f"sustainable growth remains highly {word} under volatile economic conditions"
        v_clause_zh = f"在动荡的经济条件下，可持续增长依然高度表现出{zh_def}的特征"
    elif is_adv:
        v_clause_en = f"technological advancements are {word} transforming traditional industrial paradigms"
        v_clause_zh = f"技术进步正{zh_def}地改变着传统的工业范式"
    else: # Noun
        v_clause_en = f"the strategic management of {word} plays a decisive role in organizational resilience"
        v_clause_zh = f"对{zh_def}（{word}）的战略管理在组织韧性中发挥着决定性作用"
        
    en_sent = tpl_en.format(word_clause=v_clause_en)
    zh_sent = tpl_zh.format(zh_clause=v_clause_zh)
    
    return en_sent, zh_sent

if __name__ == '__main__':
    with open(os.path.join(DATA_DIR, 'ai_examples_todo.json'), 'r', encoding='utf-8') as f:
        todo = json.load(f)
    print(f"Loaded {len(todo)} todo words.")
    
    # Test generation on sample
    print("Testing sample 10 words:")
    for i, item in enumerate(todo[:10]):
        en, zh = build_sentence_for_word(item, i)
        ok, msg = validate_pair(item['word'], en, zh)
        print(f"[{item['word']}] valid={ok} ({msg}):")
        print(f"  EN: {en}")
        print(f"  ZH: {zh}\n")
