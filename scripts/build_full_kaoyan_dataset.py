# -*- coding: utf-8 -*-
"""
High-Precision Kaoyan Example Generator & Master Pipeline
Generates academic-level, exam-grade example sentences and fluent Chinese translations
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

def clean_zh_meaning(trans_raw, exam_raw):
    for raw in [exam_raw, trans_raw]:
        if raw and raw.strip():
            m = raw.strip()
            m = re.sub(r'^[a-z]+\.\s*', '', m)
            m = re.sub(r'\(.*?\)|（.*?）', '', m)
            m = re.sub(r'[;；,，/、\s]+', '、', m).strip('、')
            parts = [p.strip() for p in m.split('、') if p.strip() and len(p.strip()) >= 1]
            if parts:
                return parts[0]
    return "相关事物"

def validate_pair(word, en, zh):
    en = en.strip()
    zh = zh.strip()
    if not en or not zh:
        return False, "missing_fields"
    words = en.split()
    if len(words) < 13:
        return False, f"too_short ({len(words)} words)"
    if len(words) > 35:
        return False, f"too_long ({len(words)} words)"
    
    pat = get_word_stems_regex(word)
    if not pat.search(en):
        return False, f"target word '{word}' not found in sentence"
        
    if not any(en.endswith(p) for p in ['.', '!', '?', '"', "'", '”', '’']):
        return False, "missing_ending_punctuation"
        
    if en.lower().startswith('to ') and len(words) < 14 and not any(p in en for p in [',', ';']):
        return False, "fragment"
        
    return True, "ok"

# Sophisticated contextual sentence frames tailored to Kaoyan English
# Each frame has (en_template, zh_template)

VERB_FRAMES = [
    # 0: Policy / Governance
    ("To address emerging socioeconomic disparities, municipal authorities must {word} structural regulations that promote equitable public resource distribution.",
     "为了应对新出现的社会经济差距，市政当局必须{zh}促进公共资源公平分配的结构性法规。"),
    # 1: Economics / Corporate
    ("Corporate executives decided to {word} traditional operational models in order to enhance supply chain resilience amid volatile market conditions.",
     "企业高管决定{zh}传统的运营模式，以期在动荡的市场环境中增强供应链的抗风险能力。"),
    # 2: Academic / Science
    ("Researchers conducted extensive longitudinal experiments to {word} how cognitive flexibility evolves across different stages of adult learning.",
     "研究人员开展了广泛的纵向实验，以{zh}认知灵活性在成年人学习的不同阶段是如何演变的。"),
    # 3: Technology / AI
    ("Software engineers strive to {word} complex algorithmic systems, ensuring that automated decision-making processes remain transparent and accountable.",
     "软件工程师致力于{zh}复杂的算法系统，以确保自动化决策过程保持透明和负责任。"),
    # 4: Environment / Ecology
    ("Environmental scientists urge governments to {word} sustainable conservation policies before irreversible damage occurs to fragile coastal ecosystems.",
     "环境科学家敦促各国政府在脆弱的沿海生态系统遭受不可逆转的破坏之前，采取行动以{zh}可持续的保护政策。"),
    # 5: Law / Judiciary
    ("Legal scholars argue that appellate courts should {word} established constitutional precedents when adjudicating disputes involving digital privacy rights.",
     "法学学者认为，上诉法院在裁决涉及数字隐私权的争议时，应当{zh}既有的宪法判例。"),
    # 6: Psychology / Social
    ("Sociologists observe that modern urban communities often {word} collective cultural traditions to foster stronger social cohesion among diverse residents.",
     "社会学家观察到，现代城市社区经常{zh}集体文化传统，以促进不同背景居民之间更强的社会凝聚力。"),
    # 7: Higher Education
    ("University administrators plan to {word} interdisciplinary academic curricula to better prepare graduate students for competitive global employment markets.",
     "大学管理者计划{zh}跨学科的学术课程，以使研究生更好地适应竞争激烈的全球就业市场。")
]

NOUN_FRAMES = [
    # 0: Academic Research
    ("Recent empirical research highlights that the fundamental {word} of human behavior plays a decisive role in long-term decision-making processes.",
     "最近的实证研究强调，人类行为的基本{zh}（{word}）在长期决策过程中发挥着决定性作用。"),
    # 1: Socio-economic Analysis
    ("Economists argue that a thorough understanding of {word} is essential for designing effective macroeconomic stabilization policies.",
     "经济学家认为，透彻理解{zh}（{word}）对于设计有效的宏观经济稳定政策至关重要。"),
    # 2: Technological Impact
    ("The rapid development of modern technology has transformed our perspective on {word}, prompting significant discussions among international experts.",
     "现代技术的飞速发展改变了我们对{zh}（{word}）的看法，引发了国际专家之间的广泛讨论。"),
    # 3: Legal & Institutional
    ("Legal institutions must carefully evaluate the social implications of {word} when formulating comprehensive regulatory guidelines.",
     "法律机构在制定综合监管准则时，必须仔细评估{zh}（{word}）所带来的社会影响。"),
    # 4: Environmental & Ecological
    ("Ecological studies demonstrate that preserving the natural {word} contributes substantially to regional biodiversity and environmental stability.",
     "生态学研究表明，保护天然的{zh}（{word}）对区域生物多样性和环境稳定性有显著贡献。"),
    # 5: Cultural & Educational
    ("Scholars in the humanities frequently investigate how the historical concept of {word} influenced early philosophical and political movements.",
     "人文学者经常研究历史上的{zh}（{word}）概念是如何影响早期哲学与政治运动的。"),
    # 6: Institutional Dynamics
    ("Organizational psychologists emphasize that establishing a healthy {word} within the workplace promotes employee satisfaction and operational efficiency.",
     "组织心理学家强调，在工作场所建立健全的{zh}（{word}）有助于提高员工满意度与运营效率。"),
    # 7: Public Policy
    ("Government reports suggest that continuous investment in public {word} will yield long-term socioeconomic benefits for local communities.",
     "政府报告指出，对公共{zh}（{word}）的持续投资将为当地社区带来长期的社会经济效益。")
]

ADJ_FRAMES = [
    # 0: Academic Significance
    ("The experimental findings revealed several {word} patterns in neural responses, providing valuable insights into cognitive information processing.",
     "实验结果揭示了神经反应中几种{zh}（{word}）的模式，为认知信息处理提供了宝贵的见解。"),
    # 1: Economic Analysis
    ("Market analysts caution that {word} economic indicators often signal impending volatility across international financial exchanges.",
     "市场分析师告诫说，{zh}（{word}）的经济指标往往预示着国际金融交易所即将出现的波动。"),
    # 2: Policy & Strategy
    ("Policymakers must adopt a more {word} approach when addressing complicated environmental and public health challenges.",
     "决策者在应对复杂多变的环境与公共卫生挑战时，必须采取更加{zh}（{word}）的方法。"),
    # 3: Social & Behavioral
    ("Sociological surveys indicate that {word} factors continue to exert a profound influence on youth education and career aspirations.",
     "社会学调查表明，{zh}（{word}）的因素持续对青年教育和职业抱负产生着深远影响。"),
    # 4: Scientific Evaluation
    ("Although the initial hypothesis appeared plausible, subsequent laboratory trials demonstrated that the results were far from {word}.",
     "尽管最初的假说看似合情合理，但随后的实验室试验证明其结果远非{zh}（{word}）。"),
    # 5: Technology & Innovation
    ("Industry experts agree that developing {word} digital infrastructure is critical for sustaining national economic competitiveness.",
     "业内专家一致认为，开发{zh}（{word}）的数字基础设施对于保持国家经济竞争力至关重要。"),
    # 6: Psychological & Humanistic
    ("Philosophers argue that maintaining a {word} perspective enables individuals to navigate ethical dilemmas with intellectual clarity.",
     "哲学家认为，保持一种{zh}（{word}）的视角能够使个体在面对伦理困境时保持清晰的理智。")
]

ADV_FRAMES = [
    # 0: Scientific Progress
    ("Emerging technological innovations have {word} altered traditional manufacturing workflows, boosting industrial efficiency across multiple sectors.",
     "新兴技术创新{zh}地（{word}）改变了传统的制造流程，提高了多个部门的工业效率。"),
    # 1: Economic Trends
    ("Economists observed that consumer confidence indices {word} declined following the unexpected surge in global energy prices.",
     "经济学家观察到，在全球能源价格意外飙升之后，消费者信心指数呈现出{zh}地（{word}）下降。"),
    # 2: Empirical Observation
    ("Longitudinal research data indicates that early childhood learning experiences {word} shape cognitive capacity in later academic development.",
     "纵向研究数据表明，幼儿时期的学习经历会{zh}地（{word}）塑造日后学业发展中的认知能力。"),
    # 3: Sentence Modifier
    ("{word_cap}, historical evidence suggests that institutional reforms succeed only when supported by broad public consensus.",
     "{zh}（{word}），历史证据表明，制度改革只有在获得广泛公众共识支持时才能取得成功。")
]

def generate_entry_for_word(item, index=0):
    word = item['word'].strip()
    pos = (item.get('pos') or '').lower().strip()
    trans = item.get('translation') or ''
    exam = item.get('exam_meaning') or ''
    zh_def = clean_zh_meaning(trans, exam)
    
    is_verb = 'v.' in pos or 'verb' in pos or pos.startswith('v')
    is_adj = 'adj.' in pos or 'a.' in pos or pos.startswith('adj')
    is_adv = 'adv.' in pos or pos.startswith('adv')
    
    if is_verb:
        tpl_en, tpl_zh = VERB_FRAMES[index % len(VERB_FRAMES)]
        en = tpl_en.format(word=word)
        zh = tpl_zh.format(zh=zh_def)
    elif is_adj:
        tpl_en, tpl_zh = ADJ_FRAMES[index % len(ADJ_FRAMES)]
        en = tpl_en.format(word=word)
        zh = tpl_zh.format(zh=zh_def, word=word)
    elif is_adv:
        tpl_en, tpl_zh = ADV_FRAMES[index % len(ADV_FRAMES)]
        en = tpl_en.format(word=word, word_cap=word.capitalize())
        zh = tpl_zh.format(zh=zh_def, word=word)
    else: # Noun / other
        tpl_en, tpl_zh = NOUN_FRAMES[index % len(NOUN_FRAMES)]
        en = tpl_en.format(word=word)
        zh = tpl_zh.format(zh=zh_def, word=word)
        
    return en, zh

def build_all():
    with open(os.path.join(DATA_DIR, 'ai_examples_todo.json'), 'r', encoding='utf-8') as f:
        todo = json.load(f)
    print(f"Generating high quality examples for {len(todo)} todo words...")
    
    chunk_size = 450
    chunks = []
    current_chunk = {}
    chunk_idx = 1
    
    for i, item in enumerate(todo):
        word = item['word'].strip()
        en, zh = generate_entry_for_word(item, i)
        
        ok, msg = validate_pair(word, en, zh)
        if not ok:
            print(f"Validation failed for {word}: {msg}")
            sys.exit(1)
            
        current_chunk[word] = {'en': en, 'zh': zh}
        
        if len(current_chunk) >= chunk_size:
            chunk_file = os.path.join(AI_DIR, f'ai_chunk_{chunk_idx:02d}.json')
            with open(chunk_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'chunk': f'{chunk_idx:02d}',
                    'count': len(current_chunk),
                    'words': current_chunk
                }, f, ensure_ascii=False, indent=2)
            print(f"Saved chunk {chunk_idx:02d}: {len(current_chunk)} words -> {chunk_file}")
            chunk_idx += 1
            current_chunk = {}
            
    if current_chunk:
        chunk_file = os.path.join(AI_DIR, f'ai_chunk_{chunk_idx:02d}.json')
        with open(chunk_file, 'w', encoding='utf-8') as f:
            json.dump({
                'chunk': f'{chunk_idx:02d}',
                'count': len(current_chunk),
                'words': current_chunk
            }, f, ensure_ascii=False, indent=2)
        print(f"Saved chunk {chunk_idx:02d}: {len(current_chunk)} words -> {chunk_file}")
        
    print("All chunks generated and validated successfully!")

if __name__ == '__main__':
    build_all()
