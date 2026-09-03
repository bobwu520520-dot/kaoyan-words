# -*- coding: utf-8 -*-
"""
Batch 1 High-Quality Kaoyan Examples Generator
Covers Core High Frequency words (represent, resolve, resource, reveal, revenue, significant, specific, strategy, substantial, sufficient, sustain, transform, trend, ultimate, unique, vital, vulnerable, yield)
and high frequency words.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
base = r'd:\谷歌反重力\kaoyan_vocab_v9'

# Sample high quality entries map
batch_examples = {
    "represent": [
        "Statistical models that fail to represent non-linear relationships often produce misleading projections about climate change.",
        "未能体现非线性关系的统计模型往往会对气候变化产生具有误导性的预测。"
    ],
    "resolve": [
        "International arbitration provides a neutral forum for multinational corporations to resolve cross-border contractual disputes without litigation.",
        "国际仲裁为跨国公司提供了一个中立的平台，使其无需诉讼即可解决跨国合同纠纷。"
    ],
    "resource": [
        "Developing nations must carefully allocate scarce financial resources between immediate infrastructure needs and long-term public health investments.",
        "发展中国家必须在眼下的基础设施需求与长期的公共卫生投资之间审慎分配稀缺的财政资源。"
    ],
    "reveal": [
        "Longitudinal brain imaging studies reveal that neural plasticity persists well into late adulthood, challenging traditional neurobiological dogmas.",
        "纵向脑成像研究表明神经可塑性会一直持续到成年晚期，这对传统的神经生物学教条提出了挑战。"
    ],
    "revenue": [
        "Digital subscription models now generate more recurring revenue for traditional newspapers than physical newsstand circulation.",
        "数字订阅模式目前为传统报纸带来的经常性收入已超过实体报刊亭的发行收入。"
    ],
    "significant": [
        "The empirical study found a statistically significant correlation between early bilingual education and enhanced cognitive flexibility.",
        "这项实证研究发现，早期双语教育与认知灵活性的提升之间存在统计学上显著的正相关。"
    ],
    "specific": [
        "Public health campaigns are far more effective when tailored to address the specific socioeconomic barriers faced by marginalized communities.",
        "当公共卫生宣传活动针对边缘化群体所面临的具体社会经济障碍进行量身定制时，其效果会显著提升。"
    ],
    "strategy": [
        "Corporate executives increasingly adopt diversification strategies to mitigate supply chain disruptions caused by geopolitical instability.",
        "企业高管越来越多地采取多元化策略，以缓解地缘政治不稳定所导致的供应链中断风险。"
    ],
    "substantial": [
        "Transitioning from fossil fuels to renewable energy will require substantial capital investments in grid modernization and energy storage.",
        "从化石燃料向可再生能源的转型将需要在电网现代化和储能技术方面进行大量的资本投资。"
    ],
    "sufficient": [
        "A rigorous scientific hypothesis cannot be accepted without sufficient empirical data gathered under strictly controlled experimental conditions.",
        "在没有通过严格受控的实验条件下收集到充分的实证数据之前，严谨的科学假说是无法被接受的。"
    ],
    "sustain": [
        "Agricultural economists question whether intensive farming methods can sustain current crop yields without causing irreversible soil degradation.",
        "农业经济学家质疑集约化耕作方法是否能够在不造成不可逆转的土壤退化的情况下维持现有的农作物产量。"
    ],
    "transform": [
        "The rapid integration of artificial intelligence into higher education promises to transform traditional pedagogical paradigms fundamentally.",
        "人工智能在高等教育中的迅速融合有望从根本上改变传统的教学模式。"
    ],
    "trend": [
        "Demographic data indicates an irreversible trend toward urbanization across developing economies over the coming decades.",
        "人口统计数据表明，在未来几十年中，发展中经济体将呈现出不可逆转的城市化趋势。"
    ],
    "ultimate": [
        "While short-term profits satisfy shareholders, the ultimate survival of any technology company depends on continuous innovation.",
        "尽管短期利润能迎合股东，但任何科技企业的最终生存都取决于持续的自主创新。"
    ],
    "unique": [
        "Each linguistic dialect reflects a unique cultural heritage and historical evolution that standardized languages often obscure.",
        "每一种语言方言都反映了独特的文化遗产和历史演变，而这往往会被标准化语言所掩盖。"
    ],
    "vital": [
        "Maintaining genetic diversity within agricultural crops is vital for global food security against evolving plant pathogens.",
        "保持农作物的遗传多样性对于抵御不断演变的植物病原体、保障全球粮食安全至关重要。"
    ],
    "vulnerable": [
        "Coastal metropolitan areas remain exceptionally vulnerable to rising sea levels and extreme meteorological events caused by global warming.",
        "沿海大都市地区极易受到全球变暖引发的海平面上升和极端气象事件的危害。"
    ],
    "yield": [
        "Pioneering research in quantum materials is expected to yield practical breakthroughs in ultra-efficient energy transmission.",
        "量子材料领域的开创性研究预计将在超高效能源传输方面带来实质性的突破。"
    ]
}

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

print("Validating sample batch:")
for word, (en, zh) in batch_examples.items():
    pat = get_word_stems_regex(word)
    has_word = bool(pat.search(en))
    wc = len(en.split())
    print(f"[{word}] {wc} words, has_word={has_word}:")
    print(f"  EN: {en}")
    print(f"  ZH: {zh}")
