# -*- coding: utf-8 -*-
"""
High-Precision Academic Kaoyan Sentence Synthesizer
Synthesizes contextualized, authentic, exam-level sentences (15-26 words)
with precise academic Chinese translations matching Kaoyan reading texts.
"""

import json, os, sys, re, random

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
AI_DIR = os.path.join(DATA_DIR, 'ai_examples')
os.makedirs(AI_DIR, exist_ok=True)

# Helper regex stem
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

def clean_zh_def(trans, exam):
    for raw in [exam, trans]:
        if raw and raw.strip():
            m = raw.strip()
            m = re.sub(r'^[a-z]+\.\s*', '', m)
            m = re.sub(r'\(.*?\)|（.*?）', '', m)
            m = re.sub(r'[;；,，/、\s]+', '、', m).strip('、')
            parts = [p.strip() for p in m.split('、') if p.strip()]
            if parts:
                return parts[0]
    return "该事物"

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

# Domain-specific semantic patterns
VERB_PATTERNS = [
    # General action / solve
    ("Municipal engineers worked diligently to {word} the damaged infrastructure before the onset of the severe winter storm.",
     "市政工程师们在严酷的冬季风暴来临之前，夜以继日地{zh}受损的基础设施。"),
    ("Scholars frequently {word} empirical experiments under controlled laboratory conditions to verify whether the initial hypothesis holds true across diverse populations.",
     "学者们经常在受控的实验室条件下{zh}实证实验，以验证最初的假设在不同人群中是否均成立。"),
    ("Regulatory agencies require commercial banks to {word} outdated legacy software systems with secure, cloud-based data processing architectures.",
     "监管机构要求商业银行用安全、基于云的数据处理架构来{zh}过时的传统软件系统。"),
    ("Company executives declined to {word} to journalistic inquiries regarding alleged antitrust violations during recent international trade negotiations.",
     "在近期国际贸易谈判期间，公司高管拒绝针对涉嫌违反反垄断法的记者质询做出{zh}。"),
    ("Economic analysts must carefully {word} annual fiscal statistics to the parliamentary committee before new budgetary allocations are approved.",
     "在批准新的预算拨款之前，经济分析师必须向议会委员会认真{zh}年度财政统计数据。"),
    ("Elected officials are constitutionally obligated to {word} the legitimate interests and welfare of their regional constituencies in parliamentary debates.",
     "民选官员在宪法上有义务在议会辩论中{zh}其所在选区选民的合法利益与福祉。"),
    ("International diplomats convened in Geneva to {word} territorial disputes through binding legal arbitration rather than prolonged armed confrontation.",
     "国际外交官在日内瓦举行会晤，旨在通过具有约束力的法律仲裁而不是旷日持久的武装冲突来{zh}领土争端。"),
    ("Agricultural scientists strive to {word} regional soil fertility by promoting organic crop rotation and minimizing chemical fertilizer runoff.",
     "农业科学家致力于通过推广有机轮作和最大限度减少化肥流失来{zh}区域土壤肥力。"),
    ("The integration of quantum computing will fundamentally {word} existing cybersecurity protocols, rendering conventional encryption techniques obsolete.",
     "量子计算的融合将从根本上{zh}现有的网络安全协议，使传统加密技术彻底过时。"),
    ("Innovative clean energy investments are projected to {word} substantial long-term economic dividends while significantly curtailing greenhouse gas emissions.",
     "创新型清洁能源投资预计将{zh}可观的长期经济效益，同时显著削减温室气体排放。"),
    ("Rigorous empirical testing was conducted to {word} the theoretical assertions published by prominent cognitive neuroscientists last year.",
     "研究人员进行了严格的实证测试，以{zh}去年著名认知神经科学家发表的理论主张。"),
    ("Strict judicial regulations {word} corporate monopolies from engaging in anti-competitive mergers that harm consumer welfare.",
     "严格的司法法规{zh}企业垄断实体从事损害消费者福祉的反竞争并购行为。")
]

NOUN_PATTERNS = [
    ("Investigative journalists published an extensive report exposing corporate corruption and institutional negligence across multiple regional branches.",
     "调查记者发表了一篇详尽的报道，揭露了多个区域分支机构的企业腐败和制度性疏忽。"),
    ("Public health authorities established a dedicated task force to monitor the emergence of contagious viral variants across urban medical facilities.",
     "公共卫生机构建立了一个专门工作组，以监测城市医疗机构中传染性病毒变异株的出现。"),
    ("Advanced satellite imagery allows meteorologists to accurately track the trajectory and intensity of an incoming coastal storm.",
     "先进的卫星图像使气象学家能够准确追踪即将到来的沿海风暴的轨迹与强度。"),
    ("Ecologists warn that rising global temperatures are accelerating the thawing of ancient permafrost across the Arctic region.",
     "生态学家警告说，全球气温上升正在加速北极地区古老永久冻土的融化。"),
    ("Coastal municipal authorities implemented automated early-warning sirens to protect resident populations from devastating tidal waves.",
     "沿海市政当局部署了自动化预警警报器，以保护居民免受破坏性巨浪的袭击。"),
    ("Modern environmental engineering facilities utilize advanced microbial filtration methods to purify industrial wastewater before discharging it into natural rivers.",
     "现代环境工程设施利用先进的微生物过滤技术，在将工业废水排放到天然河流之前对其进行深度净化。"),
    ("Biologists emphasize that preserving the fragile coastal wetland is essential for protecting migratory bird populations and filtering runoff water.",
     "生物学家强调，保护脆弱的沿海湿地对于保护候鸟种群和过滤地表径流至关重要。"),
    ("A senior corporate representative delivered an insightful keynote address emphasizing ethical leadership and technological adaptability in global supply chains.",
     "一位资深企业代表发表了富有深刻见解的主旨演讲，强调了全球供应链中的道德领导力与技术适应能力。"),
    ("Political historians often examine how republican ideals influenced the founding constitutional frameworks of modern democratic nations.",
     "政治历史学家经常研究共和主义理想如何影响了现代民主国家的建国宪法框架。")
]

ADJ_PATTERNS = [
    ("The empirical investigation highlighted several salient differences in cognitive processing speed between bilingual and monolingual children.",
     "这项实证调查突出了双语儿童与单语儿童在认知处理速度方面的几处显著差异。"),
    ("After enduring weeks of severe food deprivation, the stranded explorers appeared gaunt and visibly exhausted upon rescue.",
     "在经历了数周严重的食物匮乏之后，受困的探险队员在获救时显得面容憔悴且精疲力竭。"),
    ("The literary critic was renowned for his sardonic commentary on contemporary political posturing and commercialized artistic culture.",
     "这位文学评论家以对当代政治作态和商业化艺术文化的冷嘲热讽而闻名。"),
    ("Maintaining macroeconomic price stability is vital for preserving the purchasing power of low-income working households.",
     "保持宏观经济物价稳定对于保护低收入工薪家庭的购买力至关重要。"),
    ("Small-scale agricultural producers remain exceptionally vulnerable to sudden market price volatility and prolonged seasonal droughts.",
     "小规模农业生产者在面对突如其来的市场价格剧烈波动和旷日持久的季节性干旱时依然极其脆弱。"),
    ("The university library preserves a unique collection of rare medieval manuscripts that illuminate early European scientific thought.",
     "大学图书馆保存着一套独特的罕见中世纪手稿，阐明了早期欧洲的科学思想。"),
    ("Economists reached a consensus that substantial capital investments in public infrastructure are prerequisite for long-term regional development.",
     "经济学家达成共识，认为在公共基础设施领域进行大量的资本投资是区域长期发展的先决条件。")
]

print("Pattern definitions ready.")
