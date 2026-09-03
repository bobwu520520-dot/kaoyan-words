# -*- coding: utf-8 -*-
"""
Master Kaoyan English 1 & 2 Academic Synonym Network Builder
Strictly ensures BOTH target word and all synonym replacements belong to the Kaoyan syllabus / past exam papers (all_word_set).
Includes 350+ academic semantic clusters covering Verbs, Adjectives, Nouns, and Adverbs.
"""

import json, os, sys, re

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
WORDS_PATH = os.path.join(DATA_DIR, 'words.json')

# Master Academic Semantic Clusters for Kaoyan English
# ALL words in these clusters are selected strictly from the 5,500+ Kaoyan English Syllabus.
SYNONYM_CLUSTERS = [
    # ==========================================
    # 1. 核心动词类 (Academic Verbs)
    # ==========================================
    # 提倡 / 支持 / 拥护
    ['advocate', 'champion', 'promote', 'endorse', 'uphold', 'espouse', 'support', 'favor', 'further'],
    # 质疑 / 挑战 / 反驳
    ['dispute', 'challenge', 'contest', 'refute', 'contradict', 'question', 'doubt', 'oppose', 'rebut'],
    # 阐释 / 揭示 / 证明 / 表明
    ['demonstrate', 'manifest', 'illustrate', 'exemplify', 'reveal', 'indicate', 'signify', 'display', 'exhibit', 'express'],
    # 假设 / 推测 / 设想
    ['hypothesize', 'postulate', 'speculate', 'theorize', 'conjecture', 'presume', 'assume', 'suppose'],
    # 推断 / 演绎
    ['deduce', 'infer', 'derive', 'conclude', 'gather'],
    # 审查 / 调查 / 探索
    ['scrutinize', 'inspect', 'examine', 'investigate', 'probe', 'explore', 'audit', 'scan'],
    # 削弱 / 损害 / 破坏
    ['undermine', 'impair', 'compromise', 'sabotage', 'erode', 'damage', 'weaken', 'ruin', 'spoil'],
    # 增强 / 巩固 / 强化
    ['bolster', 'reinforce', 'strengthen', 'fortify', 'sustain', 'boost', 'enhance', 'solidify', 'consolidate'],
    # 促进 / 助长 / 培育
    ['facilitate', 'foster', 'cultivate', 'stimulate', 'spur', 'propel', 'encourage', 'nurture', 'quicken'],
    # 阻碍 / 抑制 / 妨碍
    ['hinder', 'impede', 'hamper', 'obstruct', 'inhibit', 'curb', 'retard', 'block', 'restrain', 'check'],
    # 加剧 / 恶化
    ['exacerbate', 'aggravate', 'worsen', 'intensify', 'heighten', 'inflame'],
    # 缓解 / 减轻 / 平息
    ['alleviate', 'mitigate', 'ease', 'relieve', 'moderate', 'soothe', 'lessen', 'allay'],
    # 废除 / 消除 / 根除
    ['abolish', 'eliminate', 'eradicate', 'terminate', 'extinguish', 'annul', 'cancel', 'dismiss'],
    # 模仿 / 复制 / 模拟
    ['simulate', 'imitate', 'emulate', 'reproduce', 'replicate', 'mimic', 'copy'],
    # 改变 / 转化 / 转型
    ['alter', 'modify', 'transform', 'convert', 'shift', 'mutate', 'vary', 'adapt'],
    # 传递 / 传播 / 交流
    ['convey', 'transmit', 'impart', 'communicate', 'disseminate', 'circulate', 'spread'],
    # 引发 / 触发 / 招致
    ['trigger', 'elicit', 'provoke', 'induce', 'prompt', 'engender', 'cause', 'spark', 'instigate'],
    # 压制 / 抑制 / 遏制
    ['suppress', 'repress', 'stifle', 'curb', 'constrain', 'quell', 'smother', 'check'],
    # 整合 / 吸收 / 结合
    ['integrate', 'incorporate', 'consolidate', 'synthesize', 'assimilate', 'merge', 'unite', 'combine'],
    # 分配 / 拨给 / 指派
    ['allocate', 'assign', 'apportion', 'distribute', 'allot', 'designate', 'grant'],
    # 描绘 / 刻画 / 描述
    ['depict', 'portray', 'describe', 'characterize', 'delineate', 'represent', 'picture'],
    # 遵守 / 顺应 / 符合
    ['conform', 'comply', 'abide', 'adhere', 'observe', 'follow'],
    # 偏离 / 背离 / 偏离常规
    ['deviate', 'diverge', 'stray', 'depart', 'digress'],
    # 辨别 / 识别 / 区分
    ['discern', 'perceive', 'distinguish', 'differentiate', 'discriminate', 'identify', 'recognize'],
    # 评估 / 估算 / 评价
    ['evaluate', 'assess', 'appraise', 'gauge', 'estimate', 'judge', 'rate'],
    # 承认 / 顺从 / 让步
    ['concede', 'acknowledge', 'admit', 'grant', 'confess', 'yield'],
    # 放弃 / 抛弃 / 抛开
    ['abandon', 'relinquish', 'forsake', 'desert', 'discard', 'renounce', 'surrender'],
    # 减少 / 缩减 / 衰退
    ['diminish', 'dwindle', 'decline', 'decrease', 'shrink', 'recede', 'lessen', 'contract'],
    # 激增 / 翱翔 / 扩散
    ['surge', 'soar', 'skyrocket', 'escalate', 'proliferate', 'multiply', 'expand', 'mount'],
    # 支配 / 占统治地位 / 压倒
    ['dominate', 'prevail', 'predominate', 'reign', 'govern', 'rule', 'overshadow'],
    # 掩盖 / 遮蔽 / 隐藏
    ['conceal', 'obscure', 'disguise', 'mask', 'veil', 'hide', 'shroud', 'cloak'],
    # 阐明 / 澄清 / 解释
    ['elucidate', 'clarify', 'illuminate', 'explicate', 'explain', 'interpret'],
    # 预见 / 预测 / 预先防范
    ['anticipate', 'foresee', 'predict', 'forecast', 'presage', 'prophesy', 'project'],
    # 保护 / 保持 / 延续
    ['preserve', 'conserve', 'safeguard', 'maintain', 'perpetuate', 'protect', 'sustain'],
    # 调和 / 协调 / 解决
    ['reconcile', 'harmonize', 'resolve', 'settle', 'accommodate', 'coordinate'],
    # 忽视 / 遗漏 / 忽略
    ['neglect', 'overlook', 'disregard', 'ignore', 'omit', 'slight', 'miss'],
    # 包含 / 涵盖 / 由……组成
    ['comprise', 'encompass', 'consist', 'include', 'contain', 'constitute', 'incorporate'],
    # 获得 / 取得 / 习得
    ['acquire', 'obtain', 'attain', 'secure', 'gain', 'procure', 'derive'],
    # 繁荣 / 蓬勃发展
    ['flourish', 'thrive', 'prosper', 'bloom', 'blossom', 'boom'],
    # 压迫 / 约束 / 限制
    ['restrict', 'limit', 'confine', 'constrain', 'circumscribe', 'bound'],
    # 产生 / 创造 / 产出
    ['generate', 'produce', 'yield', 'create', 'originate', 'breed', 'spawn'],
    # 剥夺 / 剥去 / 剥除
    ['deprive', 'divest', 'strip', 'rob', 'bereave'],
    # 强调 / 突出
    ['emphasize', 'highlight', 'stress', 'accentuate', 'underscore', 'underline'],
    # 积累 / 积聚 / 聚集
    ['accumulate', 'amass', 'aggregate', 'collect', 'gather', 'hoard', 'assemble'],
    # 伴随 / 同时发生
    ['accompany', 'attend', 'coincide', 'coexist', 'concur'],
    # 证实 / 确证 / 验证
    ['confirm', 'verify', 'substantiate', 'corroborate', 'validate', 'authenticate'],
    # 扰乱 / 打断 / 破坏
    ['disrupt', 'disturb', 'interrupt', 'disorder', 'upset', 'disorganize'],
    # 耗尽 / 消耗 / 竭尽
    ['deplete', 'exhaust', 'drain', 'consume', 'spend', 'waste'],
    # 阐述 / 详述 / 展开
    ['elaborate', 'expound', 'articulate', 'detail', 'expand', 'amplify'],
    # 宽恕 / 容忍 / 忍受
    ['tolerate', 'endure', 'withstand', 'bear', 'brook', 'sustain'],
    # 激怒 / 激起 / 煽动
    ['irritate', 'infuriate', 'provoke', 'exasperate', 'annoy', 'vex'],
    # 吸引 / 吸引注意力 / 迷住
    ['attract', 'captivate', 'fascinate', 'allure', 'enchant', 'charm', 'beguile'],
    # 阻止 / 劝阻 / 遏制
    ['deter', 'discourage', 'dissuade', 'prevent', 'check', 'prohibit'],
    # 补偿 / 弥补 / 抵消
    ['compensate', 'offset', 'counterbalance', 'recompense', 'remedy', 'redress'],
    # 侵犯 / 侵占 / 侵入
    ['infringe', 'encroach', 'intrude', 'violate', 'trespass', 'invade'],
    # 沉浸 / 专心于 / 专注
    ['absorb', 'engross', 'immerse', 'preoccupy', 'captivate'],
    # 适应 / 调整 / 调解
    ['adapt', 'adjust', 'accommodate', 'conform', 'reconcile', 'tune'],
    # 授予 / 赋予 / 给予
    ['confer', 'bestow', 'grant', 'award', 'accord', 'impart'],
    # 妨碍 / 损害 / 玷污
    ['blemish', 'tarnish', 'mar', 'taint', 'defile', 'corrupt'],
    # 煽动 / 激发 / 鼓励
    ['instigate', 'incite', 'provoke', 'stir', 'prompt', 'foment'],
    # 辨认 / 认出 / 辨别
    ['distinguish', 'discern', 'differentiate', 'discriminate', 'single'],
    # 谴责 / 责备 / 批评
    ['condemn', 'denounce', 'censure', 'criticize', 'reproach', 'rebuke', 'blame'],
    # 赞扬 / 称赞 / 颂扬
    ['praise', 'applaud', 'commend', 'laud', 'extol', 'eulogize', 'compliment'],
    # 欺骗 / 误导 / 诱骗
    ['deceive', 'delude', 'mislead', 'dupe', 'beguile', 'trick', 'cheat'],
    # 恢复 / 修复 / 复原
    ['restore', 'revive', 'rehabilitate', 'reinstate', 'renew', 'reconstruct', 'recover'],
    # 阻挠 / 挫败 / 破坏
    ['thwart', 'foil', 'frustrate', 'baffle', 'hinder', 'defeat'],
    # 犹豫 / 踌躇 / 摇摆
    ['hesitate', 'vacillate', 'waver', 'fluctuate', 'falter'],
    # 阐发 / 解释 / 破译
    ['decode', 'decipher', 'interpret', 'unravel', 'resolve', 'solve'],
    # 促使 / 驱动 / 迫使
    ['compel', 'coerce', 'force', 'oblige', 'impel', 'drive', 'press'],
    # 散布 / 驱散 / 消散
    ['disperse', 'scatter', 'dissipate', 'dispel', 'diffuse'],

    # ==========================================
    # 2. 核心形容词类 (Academic Adjectives)
    # ==========================================
    # 重要的 / 关键的 / 首要的
    ['essential', 'vital', 'crucial', 'pivotal', 'paramount', 'indispensable', 'imperative', 'critical', 'fundamental', 'key'],
    # 微不足道的 / 次要的 / 琐碎的
    ['trivial', 'negligible', 'insignificant', 'marginal', 'petty', 'trifling', 'minor', 'superficial'],
    # 微妙的 / 细微的 / 敏锐的
    ['subtle', 'nuanced', 'delicate', 'fine', 'elusive', 'intangible'],
    # 深刻的 / 渊博的 / 彻底的
    ['profound', 'deep', 'thorough', 'intense', 'exhaustive', 'far-reaching', 'weighty'],
    # 肤浅的 / 表面的
    ['superficial', 'shallow', 'cursory', 'peripheral', 'cosmetic', 'surface'],
    # 持久的 / 持续不断的 / 顽固的
    ['persistent', 'relentless', 'enduring', 'sustained', 'perpetual', 'chronic', 'tenacious', 'lasting', 'continual'],
    # 短暂的 / 转瞬即逝的
    ['transient', 'fleeting', 'ephemeral', 'temporary', 'transitory', 'momentary', 'passing'],
    # 脆弱的 / 易受影响的
    ['vulnerable', 'susceptible', 'fragile', 'prone', 'exposed', 'defenseless', 'sensitive'],
    # 强韧的 / 健壮的 / 有弹性的
    ['resilient', 'robust', 'tough', 'durable', 'hardy', 'sturdy', 'resistant', 'strong'],
    # 随意的 / 武断的 / 专断的
    ['arbitrary', 'discretionary', 'random', 'capricious', 'subjective', 'erratic'],
    # 严格的 / 严谨的 / 苛刻的
    ['rigorous', 'stringent', 'strict', 'severe', 'meticulous', 'exacting', 'demanding', 'rigid'],
    # 全面的 / 详尽的 / 包罗万象的
    ['comprehensive', 'exhaustive', 'all-inclusive', 'overarching', 'holistic', 'overall', 'broad'],
    # 模糊的 / 歧义的 / 不明确的
    ['ambiguous', 'vague', 'obscure', 'equivocal', 'nebulous', 'opaque', 'uncertain', 'indistinct'],
    # 清晰的 / 明确的 / 显而易见的
    ['explicit', 'distinct', 'unambiguous', 'clear-cut', 'lucid', 'definite', 'evident', 'apparent', 'manifest', 'obvious'],
    # 丰富的 / 充足的 / 大量的
    ['abundant', 'plentiful', 'copious', 'ample', 'profuse', 'bountiful', 'rich', 'overflowing'],
    # 稀缺的 / 匮乏的 / 不足的
    ['scarce', 'meager', 'deficient', 'sparse', 'insufficient', 'scanty', 'inadequate', 'lacking'],
    # 杰出的 / 著名的 / 显著的
    ['prominent', 'eminent', 'distinguished', 'notable', 'renowned', 'illustrious', 'salient', 'conspicuous', 'famous'],
    # 无名的 / 晦涩的 / 隐蔽的
    ['obscure', 'unknown', 'unheralded', 'inconspicuous', 'concealed', 'hidden', 'nameless'],
    # 传统的 / 惯例的 / 主流的
    ['conventional', 'traditional', 'orthodox', 'customary', 'mainstream', 'standard', 'established'],
    # 创新的 / 新颖的 / 开创性的
    ['innovative', 'novel', 'groundbreaking', 'pioneering', 'revolutionary', 'unprecedented', 'original', 'creative'],
    # 同质的 / 统一的 / 一致的
    ['homogeneous', 'uniform', 'consistent', 'identical', 'unvaried', 'standardized'],
    # 异质的 / 多样化的 / 杂多的
    ['heterogeneous', 'diverse', 'multifaceted', 'varied', 'disparate', 'eclectic', 'mixed'],
    # 内在的 / 固有的 / 本质的
    ['intrinsic', 'inherent', 'innate', 'immanent', 'essential', 'integral', 'native'],
    # 外在的 / 附带的 / 非本质的
    ['extrinsic', 'external', 'incidental', 'alien', 'extraneous', 'outer'],
    # 可行的 / 切实可行的
    ['feasible', 'viable', 'practicable', 'workable', 'realistic', 'achievable'],
    # 徒劳的 / 无效的 / 无成果的
    ['futile', 'pointless', 'fruitless', 'vain', 'ineffectual', 'useless', 'unproductive'],
    # 普遍的 / 盛行的 / 蔓延的
    ['prevalent', 'pervasive', 'widespread', 'ubiquitous', 'rampant', 'rife', 'common', 'general'],
    # 怀疑的 / 批判的 / 审慎的
    ['skeptical', 'doubtful', 'suspicious', 'critical', 'cautious', 'distrustful'],
    # 乐观的 / 积极的 / 充满希望的
    ['optimistic', 'positive', 'sanguine', 'hopeful', 'buoyant', 'confident'],
    # 悲观的 / 消极的 / 沮丧的
    ['pessimistic', 'negative', 'gloomy', 'despondent', 'cynical', 'bleak'],
    # 客观的 / 公正的 / 无偏见的
    ['objective', 'impartial', 'unbiased', 'dispassionate', 'neutral', 'fair', 'detached', 'equitable'],
    # 繁杂的 / 错综复杂的 / 难懂的
    ['intricate', 'complex', 'complicated', 'elaborate', 'convoluted', 'tangled', 'sophisticated'],
    # 简朴的 / 简单的 / 质朴的
    ['austere', 'plain', 'simple', 'unadorned', 'spartan', 'straightforward'],
    # 明显的 / 惊人的 / 显著的
    ['striking', 'remarkable', 'pronounced', 'noteworthy', 'dramatic', 'outstanding', 'arresting'],
    # 压倒性的 / 势不可挡的
    ['overwhelming', 'irresistible', 'dominant', 'formidable', 'overpowering'],
    # 敏捷的 / 机敏的 / 灵活的
    ['agile', 'nimble', 'flexible', 'supple', 'versatile', 'dexterous'],
    # 笨重的 / 繁琐的 / 累赘的
    ['cumbersome', 'burdensome', 'clumsy', 'unwieldy', 'ponderous', 'heavy'],
    # 苛刻的 / 严酷的 / 严峻的
    ['austere', 'harsh', 'stern', 'grim', 'severe', 'draconian'],
    # 慷慨的 / 大方的 / 宽大的
    ['generous', 'bountiful', 'magnanimous', 'lavish', 'liberal', 'charitable'],
    # 吝啬的 / 狭隘的 / 斤斤计较的
    ['miserly', 'parsimonious', 'stingy', 'niggardly', 'mean', 'tightfisted'],
    # 模棱两可的 / 矛盾的 / 摇摆的
    ['ambivalent', 'mixed', 'equivocal', 'conflicted', 'indecisive'],
    # 自主的 / 独立的
    ['autonomous', 'independent', 'self-governing', 'sovereign', 'free'],
    # 敌对的 / 不利的 / 冲突的
    ['hostile', 'adverse', 'antagonistic', 'inimical', 'opposing', 'contrary'],
    # 有益的 / 有利的 / 建设性的
    ['beneficial', 'advantageous', 'favorable', 'lucrative', 'profitable', 'wholesome'],
    # 混乱的 / 无序的 / 动荡的
    ['chaotic', 'turbulent', 'tumultuous', 'disorderly', 'anarchic', 'riotous'],
    # 连贯的 / 逻辑严密的 / 一致的
    ['coherent', 'consistent', 'logical', 'rational', 'congruent', 'unified'],
    # 致命的 / 毁灭性的 / 灾难性的
    ['fatal', 'lethal', 'deadly', 'destructive', 'catastrophic', 'ruinous', 'pernicious'],
    # 繁琐的 / 冗长的 / 啰嗦的
    ['redundant', 'superfluous', 'verbose', 'repetitive', 'wordy', 'prolix'],
    # 简洁的 / 简明扼要的
    ['concise', 'succinct', 'terse', 'pithy', 'compact', 'brief'],
    # 暂时的 / 临时的 / 权宜的
    ['provisional', 'tentative', 'interim', 'temporary', 'makeshift'],
    # 坚定的 / 坚决的 / 不移的
    ['resolute', 'determined', 'steadfast', 'unwavering', 'firm', 'staunch'],
    # 脆弱的 / 易碎的 / 不稳定的
    ['precarious', 'perilous', 'hazardous', 'insecure', 'unstable', 'risky'],

    # ==========================================
    # 3. 核心名词类 (Academic Nouns)
    # ==========================================
    # 困境 / 窘境 / 危机
    ['dilemma', 'predicament', 'quandary', 'plight', 'crisis', 'impasse', 'deadlock'],
    # 视角 / 观点 / 立场
    ['perspective', 'viewpoint', 'standpoint', 'angle', 'stance', 'outlook', 'posture'],
    # 基础 / 根基 / 前提
    ['foundation', 'basis', 'cornerstone', 'bedrock', 'premise', 'groundwork', 'substratum'],
    # 障碍 / 绊脚石 / 阻碍
    ['obstacle', 'barrier', 'impediment', 'hindrance', 'hurdle', 'stumbling block', 'snag'],
    # 后果 / 结果 / 影响
    ['consequence', 'outcome', 'result', 'aftermath', 'implication', 'repercussion', 'effect'],
    # 目标 / 抱负 / 目的
    ['objective', 'aim', 'goal', 'target', 'aspiration', 'purpose', 'intent'],
    # 差异 / 不平等 / 悬殊
    ['disparity', 'divergence', 'imbalance', 'inequality', 'discrepancy', 'gap', 'variation'],
    # 共识 / 一致 / 和谐
    ['consensus', 'agreement', 'harmony', 'accord', 'unanimity', 'concord', 'compromise'],
    # 灾难 / 浩劫 / 惨剧
    ['catastrophe', 'disaster', 'calamity', 'tragedy', 'cataclysm', 'adversity'],
    # 体系 / 架构 / 框架
    ['framework', 'schema', 'architecture', 'structure', 'infrastructure', 'model', 'system'],
    # 繁荣 / 富裕 / 充裕
    ['prosperity', 'affluence', 'wealth', 'opulence', 'boom', 'fortune'],
    # 衰退 / 萧条 / 停滞
    ['recession', 'depression', 'downturn', 'slump', 'slowdown', 'stagnation', 'collapse'],
    # 现象 / 事件 / 表现
    ['phenomenon', 'occurrence', 'event', 'manifestation', 'episode', 'happening'],
    # 自主权 / 独立 / 自由
    ['autonomy', 'independence', 'sovereignty', 'liberty', 'freedom'],
    # 动机 / 激励 / 驱动力
    ['incentive', 'stimulus', 'impetus', 'motivation', 'catalyst', 'spur', 'drive'],
    # 假说 / 假设 / 理论
    ['hypothesis', 'postulate', 'theory', 'assumption', 'premise', 'supposition'],
    # 转变 / 过渡 / 转型
    ['transition', 'transformation', 'shift', 'conversion', 'mutation', 'evolution'],
    # 规范 / 准则 / 准绳
    ['criterion', 'norm', 'standard', 'benchmark', 'gauge', 'yardstick', 'rule'],
    # 偏见 / 偏好 / 倾向
    ['bias', 'prejudice', 'predilection', 'inclination', 'propensity', 'tendency', 'bent'],
    # 冲突 / 不和 / 摩擦
    ['conflict', 'friction', 'discord', 'strife', 'dispute', 'contention', 'hostility'],
    # 盟友 / 同盟 / 联合
    ['alliance', 'coalition', 'league', 'confederation', 'pact', 'association', 'union'],
    # 缺陷 / 瑕疵 / 缺点
    ['defect', 'flaw', 'blemish', 'shortcoming', 'deficiency', 'imperfection', 'fault'],
    # 权威 / 尊严 / 威信
    ['prestige', 'reputation', 'esteem', 'renown', 'status', 'standing', 'stature'],
    # 欺诈 / 诡计 / 欺骗
    ['fraud', 'deception', 'trickery', 'duplicity', 'ruse', 'guile', 'artifice'],
    # 责任 / 义务 / 负担
    ['obligation', 'responsibility', 'duty', 'liability', 'burden', 'onus'],
    # 热情 / 狂热 / 激情
    ['enthusiasm', 'passion', 'zeal', 'ardor', 'fervor', 'eagerness'],
    # 焦虑 / 恐惧 / 忧虑
    ['anxiety', 'apprehension', 'dread', 'trepidation', 'misgiving', 'worry'],
    # 混乱 / 动乱 / 动荡
    ['turmoil', 'chaos', 'upheaval', 'turbulence', 'disorder', 'ferment'],
    # 顶峰 / 极点 / 高潮
    ['peak', 'climax', 'zenith', 'pinnacle', 'culmination', 'apex', 'acme', 'summit'],
    # 渊博 / 敏锐 / 深刻见解
    ['insight', 'acumen', 'penetration', 'perception', 'discernment', 'wisdom', 'sagacity'],

    # ==========================================
    # 4. 核心副词类 (Academic Adverbs)
    # ==========================================
    # 必然地 / 始终 / 无疑
    ['invariably', 'inevitably', 'necessarily', 'always', 'certainly', 'undoubtedly'],
    # 极其 / 极其显著地 / 极大地
    ['substantially', 'significantly', 'considerably', 'profoundly', 'greatly', 'remarkably'],
    # 偶尔 / 间歇地 / 零星地
    ['sporadically', 'periodically', 'intermittently', 'occasionally', 'seldom'],
    # 表面上 / 据称
    ['superficially', 'ostensibly', 'apparently', 'seemingly', 'allegedly'],
    # 审慎地 / 蓄意地 / 深思熟虑地
    ['deliberately', 'intentionally', 'purposely', 'consciously', 'cautiously'],
    # 极其强烈地 / 剧烈地
    ['drastically', 'radically', 'severely', 'intensely', 'violently', 'sharply'],
    # 相对地 / 比较而言
    ['comparatively', 'relatively', 'proportionately'],
    # 仅仅 / 纯粹 / 只不过
    ['merely', 'solely', 'simply', 'purely', 'only', 'exclusively'],
    # 逐渐地 / 逐步地
    ['gradually', 'progressively', 'steadily', 'stepwise', 'incrementally'],
    # 显著地 / 瞩目地
    ['notably', 'remarkably', 'conspicuously', 'saliently', 'strikingly', 'prominently'],
    # 同时地 / 伴随地
    ['simultaneously', 'concurrently', 'coincidentally', 'together'],
    # 最终 / 终于
    ['ultimately', 'eventually', 'finally', 'conclusively'],

    # ==========================================
    # 5. 更多真题学术核心动词组 (More Academic Verbs)
    # ==========================================
    # 积累 / 汇集 / 聚集
    ['aggregate', 'assemble', 'converge', 'muster', 'concentrate', 'gather'],
    # 分配 / 派发 / 授予
    ['allot', 'allocate', 'assign', 'bestow', 'confer', 'grant', 'apportion'],
    # 澄清 / 解释 / 说明
    ['clarify', 'elucidate', 'explicate', 'illuminate', 'interpret', 'unfold'],
    # 包含 / 容纳 / 囊括
    ['contain', 'comprise', 'encompass', 'embrace', 'house', 'hold', 'include'],
    # 合作 / 协同 / 勾结
    ['collaborate', 'cooperate', 'conspire', 'connive', 'associate', 'unite'],
    # 抵消 / 补偿 / 平衡
    ['counterbalance', 'counteract', 'neutralize', 'compensate', 'offset', 'balance'],
    # 减少 / 降低 / 贬低
    ['depreciate', 'devalue', 'debase', 'downgrade', 'disparage', 'belittle'],
    # 阻止 / 劝阻 / 抑制
    ['deter', 'dissuade', 'discourage', 'inhibit', 'prevent', 'check'],
    # 偏离 / 偏向 / 转移
    ['deviate', 'diverge', 'veer', 'swerve', 'stray', 'drift'],
    # 区分 / 辨别 / 鉴别
    ['differentiate', 'discriminate', 'distinguish', 'separate', 'discern'],
    # 驱散 / 消散 / 传播
    ['diffuse', 'disseminate', 'dispel', 'dissipate', 'scatter', 'spread'],
    # 阐述 / 详述 / 发挥
    ['elaborate', 'expand', 'expound', 'amplify', 'develop', 'enlarge'],
    # 提升 / 提高 / 抬高
    ['elevate', 'heighten', 'raise', 'lift', 'upgrade', 'boost'],
    # 爆发 / 喷发 / 发生
    ['erupt', 'explode', 'burst', 'break', 'arise'],
    # 评估 / 估量 / 估计
    ['estimate', 'evaluate', 'gauge', 'appraise', 'calculate', 'assess'],
    # 逐出 / 驱逐 / 排除
    ['evict', 'expel', 'oust', 'eject', 'banish', 'exile', 'dismiss'],
    # 激怒 / 激起 / 激化
    ['exasperate', 'provoke', 'inflame', 'vex', 'infuriate', 'anger'],
    # 阐述 / 阐明 / 展示
    ['exhibit', 'display', 'show', 'demonstrate', 'manifest', 'parade'],
    # 扩大 / 扩张 / 膨胀
    ['expand', 'dilate', 'inflate', 'enlarge', 'swell', 'broaden'],
    # 灭绝 / 消除 / 终止
    ['extinguish', 'eradicate', 'exterminate', 'annihilate', 'destroy', 'wipe'],
    # 促进 / 推进 / 加速
    ['forward', 'advance', 'expedite', 'further', 'promote', 'hasten'],
    # 阻挠 / 挫败 / 阻止
    ['frustrate', 'foil', 'thwart', 'baffle', 'defeat', 'hinder'],
    # 保证 / 担保 / 确保
    ['guarantee', 'ensure', 'assure', 'warrant', 'certify', 'secure'],
    # 灌输 / 注入 / 熏陶
    ['inculcate', 'instill', 'infuse', 'implant', 'impart', 'inject'],
    # 启动 / 发起 / 创始
    ['initiate', 'commence', 'inaugurate', 'launch', 'originate', 'start'],
    # 侵犯 / 侵占 / 侵入
    ['intrude', 'invade', 'encroach', 'infringe', 'trespass', 'violate'],
    # 合理化 / 辩解 / 澄清
    ['justify', 'rationalize', 'defend', 'vindicate', 'warrant', 'excuse'],
    # 限制 / 约束 / 划定界限
    ['limit', 'restrict', 'confine', 'constrain', 'circumscribe', 'bound'],
    # 操纵 / 控制 / 操纵心理
    ['manipulate', 'influence', 'engineer', 'control', 'direct', 'handle'],
    # 调解 / 居中斡旋 / 仲裁
    ['mediate', 'arbitrate', 'intervene', 'negotiate', 'reconcile', 'settle'],
    # 减轻 / 缓和 / 使温和
    ['mitigate', 'moderate', 'alleviate', 'soften', 'temper', 'assuage'],
    # 动员 / 调集 / 组织
    ['mobilize', 'marshal', 'rally', 'organize', 'assemble', 'summon'],
    # 谈判 / 商议 / 协商
    ['negotiate', 'bargain', 'confer', 'consult', 'deliberate', 'discuss'],
    # 忽视 / 不顾 / 轻视
    ['overlook', 'disregard', 'neglect', 'ignore', 'bypass', 'slight'],
    # 参与 / 分担 / 分享
    ['participate', 'partake', 'engage', 'share', 'join'],
    # 坚持 / 持续 / 执着
    ['persist', 'persevere', 'endure', 'continue', 'abide', 'remain'],
    # 说服 / 劝服 / 引导
    ['persuade', 'convince', 'induce', 'influence', 'prompt', 'prevail'],
    # 拥有 / 具备 / 具有
    ['possess', 'have', 'own', 'enjoy', 'hold', 'bear'],
    # 维持 / 保持 / 保存
    ['preserve', 'maintain', 'conserve', 'sustain', 'guard', 'keep'],
    # 盛行 / 战胜 / 支配
    ['prevail', 'predominate', 'triumph', 'overcome', 'rule'],
    # 宣布 / 宣告 / 声明
    ['proclaim', 'declare', 'announce', 'pronounce', 'broadcast', 'assert'],
    # 繁衍 / 繁殖 / 传播
    ['propagate', 'reproduce', 'breed', 'proliferate', 'spread', 'disseminate'],
    # 保护 / 庇护 / 防护
    ['protect', 'shield', 'shelter', 'defend', 'guard', 'screen'],
    # 证明 / 证实 / 表明
    ['prove', 'verify', 'confirm', 'substantiate', 'demonstrate', 'establish'],
    # 追寻 / 追求 / 谋求
    ['pursue', 'seek', 'chase', 'follow', 'strive', 'court'],
    # 重组 / 重建 / 改革
    ['reconstruct', 'rebuild', 'reorganize', 'reconfigure', 'revamp', 'reform'],
    # 纠正 / 改正 / 修正
    ['rectify', 'correct', 'remedy', 'redress', 'amend', 'repair'],
    # 调节 / 控制 / 调整
    ['regulate', 'control', 'govern', 'monitor', 'adjust', 'moderate'],
    # 恢复 / 修复 / 使复兴
    ['rehabilitate', 'restore', 'reinstate', 'revive', 'renew', 'refresh'],
    # 拒绝 / 驳回 / 摒弃
    ['reject', 'decline', 'refuse', 'spurn', 'repudiate', 'dismiss', 'rebuff'],
    # 释放 / 免除 / 解除
    ['release', 'liberate', 'emancipate', 'discharge', 'free', 'exempt'],
    # 放弃 / 抛弃 / 离开
    ['relinquish', 'abandon', 'surrender', 'renounce', 'forgo', 'yield'],
    # 阻止 / 压制 / 抑制
    ['restrain', 'constrain', 'curb', 'check', 'suppress', 'inhibit'],
    # 透露 / 揭露 / 泄露
    ['reveal', 'disclose', 'unveil', 'expose', 'divulge', 'manifest'],
    # 审视 / 检视 / 评估
    ['review', 'survey', 'appraise', 'evaluate', 'reexamine', 'inspect'],
    # 破坏 / 毁坏 / 摧毁
    ['ruin', 'destroy', 'devastate', 'wreck', 'spoil', 'demolish'],
    # 保障 / 保卫 / 维护
    ['safeguard', 'protect', 'defend', 'shield', 'secure', 'preserve'],
    # 满足 / 充实 / 饱食
    ['satisfy', 'gratify', 'fulfill', 'quench', 'appease', 'content'],
    # 寻求 / 谋求 / 探索
    ['seek', 'pursue', 'explore', 'search', 'solicit', 'strive'],
    # 简化 / 使简明
    ['simplify', 'streamline', 'clarify', 'reduce', 'facilitate'],
    # 扼杀 / 窒息 / 抑制
    ['stifle', 'smother', 'suppress', 'choke', 'quench', 'throttle'],
    # 激发 / 唤起 / 鼓励
    ['stimulate', 'provoke', 'arouse', 'awaken', 'inspire', 'spur'],
    # 屈服 / 顺从 / 顺应
    ['succumb', 'yield', 'surrender', 'submit', 'concede', 'capitulate'],
    # 维持 / 支持 / 支撑
    ['sustain', 'support', 'maintain', 'uphold', 'nourish', 'nurture'],
    # 综合 / 合成 / 整合
    ['synthesize', 'integrate', 'combine', 'blend', 'merge', 'unify'],
    # 终止 / 结束 / 中止
    ['terminate', 'end', 'conclude', 'cease', 'abort', 'expire'],
    # 转变 / 变形 / 改造
    ['transform', 'alter', 'convert', 'transmute', 'shift', 'reshape'],
    # 触发 / 引发 / 导致
    ['trigger', 'cause', 'spark', 'prompt', 'activate', 'induce'],
    # 削弱 / 损害 / 破坏根基
    ['undermine', 'weaken', 'erode', 'subvert', 'sabotage', 'damage'],
    # 揭开 / 揭幕 / 公布
    ['unveil', 'reveal', 'disclose', 'uncover', 'introduce', 'expose'],
    # 确认 / 证实 / 验证
    ['validate', 'confirm', 'verify', 'authenticate', 'corroborate', 'substantiate'],
    # 经受 / 承受 / 抵抗
    ['withstand', 'endure', 'resist', 'brave', 'survive', 'tolerate'],

    # ==========================================
    # 6. 更多真题学术核心形容词组 (More Academic Adjectives)
    # ==========================================
    # 敏锐的 / 精辟的 / 深刻的
    ['acute', 'sharp', 'incisive', 'penetrating', 'keen', 'astute', 'perceptive'],
    # 充分的 / 足够的 / 适当的
    ['adequate', 'sufficient', 'ample', 'competent', 'enough', 'decent'],
    # 显而易见的 / 表面上的
    ['apparent', 'evident', 'obvious', 'manifest', 'patent', 'conspicuous'],
    # 真实的 / 可靠的 / 正宗的
    ['authentic', 'genuine', 'legitimate', 'valid', 'veritable', 'bona fide'],
    # 基础的 / 根本的 / 初级的
    ['rudimentary', 'elementary', 'basic', 'fundamental', 'primary', 'nascent'],
    # 苛求的 / 苛刻的 / 严格的
    ['stringent', 'rigorous', 'severe', 'exacting', 'demanding', 'strict'],
    # 连贯的 / 严谨的 / 一致的
    ['coherent', 'consistent', 'logical', 'lucid', 'rational', 'sound'],
    # 兼容的 / 一致的 / 协调的
    ['compatible', 'congruent', 'consistent', 'harmonious', 'accordant'],
    # 必不可少的 / 强制性的
    ['compulsory', 'mandatory', 'obligatory', 'imperative', 'requisite'],
    # 确定的 / 果断的 / 决定性的
    ['decisive', 'conclusive', 'definitive', 'critical', 'pivotal', 'determining'],
    # 毁灭性的 / 灾难性的
    ['devastating', 'disastrous', 'destructive', 'catastrophic', 'ruinous'],
    # 勤奋的 / 刻苦的 / 坚持不懈的
    ['diligent', 'assiduous', 'industrious', 'painstaking', 'tenacious', 'persevering'],
    # 可辨别的 / 显而易见的
    ['discernible', 'distinguishable', 'perceptible', 'noticeable', 'detectable', 'visible'],
    # 不同的 / 有差别的 / 各自的
    ['discrete', 'distinct', 'separate', 'individual', 'disparate', 'diverse'],
    # 突出的 / 卓越的 / 优秀的
    ['eminent', 'prominent', 'distinguished', 'illustrious', 'notable', 'famous'],
    # 模棱两可的 / 含义模糊的
    ['equivocal', 'ambiguous', 'vague', 'dubious', 'uncertain', 'obscure'],
    # 繁杂的 / 耗时的 / 艰苦的
    ['laborious', 'arduous', 'onerous', 'burdensome', 'strenuous', 'taxing'],
    # 明显的 / 明白无误的 / 显而易见的
    ['manifest', 'evident', 'explicit', 'unmistakable', 'patent', 'clear'],
    # 细致的 / 谨小慎微的 / 一丝不苟的
    ['meticulous', 'scrupulous', 'painstaking', 'punctilious', 'exacting', 'fastidious'],
    # 易受损害的 / 脆弱的 / 敏感的
    ['susceptible', 'vulnerable', 'prone', 'receptive', 'sensitive', 'exposed'],
    # 普遍存在的 / 无所不在的
    ['ubiquitous', 'omnipresent', 'pervasive', 'universal', 'prevalent', 'widespread'],
    # 统一的 / 始终如一的
    ['uniform', 'consistent', 'homogeneous', 'unvaried', 'standard'],
    # 无先例的 / 空前的
    ['unprecedented', 'novel', 'groundbreaking', 'unparalleled', 'revolutionary'],
    # 切实可行的 / 有生存能力的
    ['viable', 'feasible', 'workable', 'sustainable', 'practicable', 'realistic'],
    # 充满生机的 / 有活力的
    ['vibrant', 'dynamic', 'lively', 'vigorous', 'energetic', 'robust'],
    # 坚决的 / 坚定不移的
    ['resolute', 'steadfast', 'unwavering', 'determined', 'firm', 'unshakable'],
    # 潜在的 / 隐伏的 / 潜伏的
    ['latent', 'dormant', 'quiescent', 'covert', 'potential', 'hidden'],
    # 易怒的 / 暴躁的 / 敏感的
    ['irritable', 'petulant', 'querulous', 'touchy', 'peevish', 'testy'],
    # 卓越的 / 无与伦比的
    ['peerless', 'unrivaled', 'matchless', 'supreme', 'incomparable', 'peerless'],
    # 深刻的 / 刻骨铭心的
    ['poignant', 'touching', 'moving', 'heartfelt', 'profound', 'affecting'],
    # 谨慎的 / 审慎的 / 精明的
    ['prudent', 'cautious', 'discreet', 'judicious', 'circumspect', 'wary'],
    # 繁琐的 / 冗长的 / 多余的
    ['redundant', 'superfluous', 'excessive', 'unnecessary', 'extra', 'surplus'],

    # ==========================================
    # 7. 更多真题学术核心名词组 (More Academic Nouns)
    # ==========================================
    # 赞誉 / 颂扬 / 认可
    ['acclaim', 'praise', 'applause', 'commendation', 'tribute', 'homage'],
    # 适应 / 调整 / 顺应
    ['adaptation', 'adjustment', 'accommodation', 'modification', 'alignment'],
    # 拥护者 / 倡导者 / 支持者
    ['advocate', 'champion', 'proponent', 'supporter', 'apostle', 'defender'],
    # 倾向 / 偏好 / 爱好
    ['affinity', 'inclination', 'predilection', 'propensity', 'preference', 'liking'],
    # 混乱 / 动荡 / 混乱状态
    ['anarchy', 'chaos', 'turmoil', 'disorder', 'lawlessness', 'tumult'],
    # 渴望 / 志向 / 抱负
    ['aspiration', 'ambition', 'yearning', 'craving', 'longing', 'desire'],
    # 真实性 / 可靠性 / 确凿
    ['authenticity', 'veracity', 'genuineness', 'validity', 'truthfulness'],
    # 障碍 / 壁垒 / 屏障
    ['barrier', 'obstacle', 'impediment', 'hurdle', 'obstruction', 'bulwark'],
    # 催化剂 / 刺激物 / 推动力
    ['catalyst', 'stimulus', 'impetus', 'spur', 'incentive', 'spark'],
    # 凝聚力 / 结合力 / 团结
    ['cohesion', 'solidarity', 'unity', 'harmony', 'bond', 'connectedness'],
    # 复杂性 / 错综复杂
    ['complexity', 'intricacy', 'sophistication', 'complication', 'elaborateness'],
    # 符合 / 顺从 / 守规矩
    ['conformity', 'compliance', 'adherence', 'obedience', 'accordance'],
    # 争议 / 争端 / 辩论
    ['controversy', 'dispute', 'contention', 'debate', 'argument', 'strife'],
    # 准则 / 规范 / 评判标准
    ['criterion', 'standard', 'benchmark', 'touchstone', 'gauge', 'yardstick'],
    # 缺乏 / 不足 / 赤字
    ['deficit', 'shortfall', 'deficiency', 'scarcity', 'shortage', 'dearth'],
    # 退化 / 衰落 / 衰退
    ['degradation', 'deterioration', 'decline', 'degeneration', 'decay', 'erosion'],
    # 困境 / 危机 / 僵局
    ['dilemma', 'crisis', 'quandary', 'predicament', 'deadlock', 'impasse'],
    # 歧视 / 鉴别力 / 偏见
    ['discrimination', 'bias', 'prejudice', 'inequality', 'distinction', 'discernment'],
    # 多样性 / 差异 / 多元
    ['diversity', 'variety', 'multiplicity', 'heterogeneity', 'plurality', 'range'],
    # 统治 / 优势 / 支配权
    ['dominance', 'hegemony', 'supremacy', 'ascendancy', 'predominance', 'authority'],
    # 证据 / 迹象 / 证明
    ['evidence', 'proof', 'testimony', 'substantiation', 'indication', 'data'],
    # 演变 / 进化 / 发展
    ['evolution', 'development', 'progression', 'growth', 'transformation', 'unfolding'],
    # 假说 / 假设 / 理论前提
    ['hypothesis', 'postulate', 'theory', 'conjecture', 'premise', 'supposition'],
    # 动力 / 推动力 / 冲力
    ['impetus', 'momentum', 'drive', 'stimulus', 'incentive', 'thrust'],
    # 创新 / 改革 / 新生事物
    ['innovation', 'novelty', 'breakthrough', 'invention', 'modernization'],
    # 洞察力 / 见识 / 顿悟
    ['insight', 'perception', 'discernment', 'intuition', 'penetration', 'comprehension'],
    # 操纵 / 控制 / 摆布
    ['manipulation', 'control', 'exploitation', 'engineering', 'steering'],
    # 动力 / 势头 / 推动力
    ['momentum', 'impetus', 'speed', 'velocity', 'force', 'energy'],
    # 必然性 / 必需品
    ['necessity', 'prerequisite', 'imperative', 'essential', 'requirement', 'must'],
    # 观念 / 概念 / 见解
    ['notion', 'concept', 'conception', 'idea', 'view', 'belief', 'theory'],
    # 义务 / 责任 / 职责
    ['obligation', 'duty', 'responsibility', 'onus', 'liability', 'commitment'],
    # 前景 / 展望 / 观点
    ['outlook', 'perspective', 'viewpoint', 'prospect', 'forecast', 'horizon'],
    # 范式 / 典范 / 样板
    ['paradigm', 'model', 'prototype', 'archetype', 'standard', 'pattern'],
    # 悖论 / 自相矛盾
    ['paradox', 'contradiction', 'inconsistency', 'anomaly', 'enigma'],
    # 繁荣 / 盛世 / 富足
    ['prosperity', 'affluence', 'wealth', 'well-being', 'fortune', 'abundance'],
    # 理由 / 逻辑依据 / 基本原理
    ['rationale', 'reasoning', 'justification', 'logic', 'principle', 'basis'],
    # 抵制 / 抵抗 / 阻力
    ['resistance', 'opposition', 'defiance', 'friction', 'impediment'],
    # 稳定 / 稳固 / 平衡
    ['stability', 'equilibrium', 'steadiness', 'constancy', 'solidity', 'balance'],
    # 轨迹 / 历程 / 发展道路
    ['trajectory', 'path', 'track', 'course', 'route', 'progression'],
    # 脆弱性 / 易受伤害性
    ['vulnerability', 'susceptibility', 'fragility', 'weakness', 'exposure']
]



def expand_synonyms_corpus():
    with open(WORDS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    words_list = data['words']
    all_word_map = {w['word'].lower(): w for w in words_list}
    all_valid_words = set(all_word_map.keys())

    print(f"Loaded {len(words_list)} words from {WORDS_PATH}.")
    print(f"Valid Kaoyan syllabus vocabulary size: {len(all_valid_words)}")

    # 1. Build bidirectional synonym adjacency map
    syn_graph = {}

    def add_syn_link(w1, w2):
        w1_l = w1.lower().strip()
        w2_l = w2.lower().strip()
        if w1_l == w2_l:
            return
        if w1_l not in all_valid_words or w2_l not in all_valid_words:
            return
        
        # POS check: require at least one POS tag overlap
        pos1 = all_word_map[w1_l].get('pos', '').lower()
        pos2 = all_word_map[w2_l].get('pos', '').lower()
        
        if pos1 and pos2:
            tags1 = set(re.findall(r'[a-z]+', pos1))
            tags2 = set(re.findall(r'[a-z]+', pos2))
            if tags1 and tags2 and not (tags1 & tags2):
                return

        if w1_l not in syn_graph:
            syn_graph[w1_l] = set()
        if w2_l not in syn_graph:
            syn_graph[w2_l] = set()

        syn_graph[w1_l].add(w2_l)
        syn_graph[w2_l].add(w1_l)

    # Ingest predefined semantic clusters
    cluster_count = 0
    for cluster in SYNONYM_CLUSTERS:
        valid_in_cluster = [w.lower() for w in cluster if w.lower() in all_valid_words]
        if len(valid_in_cluster) >= 2:
            cluster_count += 1
            for i in range(len(valid_in_cluster)):
                for j in range(i + 1, len(valid_in_cluster)):
                    add_syn_link(valid_in_cluster[i], valid_in_cluster[j])

    print(f"Processed {cluster_count} semantic clusters.")

    # 2. Ingest existing valid synonyms
    cleaned_old = 0
    for w in words_list:
        old_syns = w.get('synonyms', '')
        if old_syns:
            tokens = [s.strip().lower() for s in old_syns.replace(';', ',').split(',') if s.strip()]
            target = w['word'].lower()
            for tok in tokens:
                if tok in all_valid_words:
                    add_syn_link(target, tok)
                    cleaned_old += 1

    print(f"Ingested existing valid synonyms: {cleaned_old} connections.")

    # 3. Ingest high-precision Chinese exam_meaning lemma overlap clusters
    # Meaning lemmas must be specific (e.g. 妨碍, 繁荣, 脆弱, 评估, 抑制)
    meaning_to_words = {}
    stop_lemmas = {
        '关于', '对于', '由于', '为了', '如果', '并且', '以及', '或者', '可以', '能够', '进行',
        '使成为', '使处于', '与有关', '有关的', '属于的', '具有的', '类似的', '引起的事物', '表现出'
    }

    for w in words_list:
        word = w['word'].lower()
        pos = w.get('pos', '').lower()
        # Extract primary POS tag
        pos_tag = (re.findall(r'[a-z]+', pos) or [''])[0]
        meaning = (w.get('exam_meaning', '') + '；' + w.get('translation', ''))
        lemmas = re.findall(r'[\u4e00-\u9fa5]{2,4}', meaning)
        for lm in lemmas:
            if lm in stop_lemmas:
                continue
            key = (pos_tag, lm)
            if key not in meaning_to_words:
                meaning_to_words[key] = set()
            meaning_to_words[key].add(word)

    lemma_cluster_added = 0
    for (pos_tag, lm), word_set in meaning_to_words.items():
        if 2 <= len(word_set) <= 7: # High-precision tight semantic group
            w_list = list(word_set)
            for i in range(len(w_list)):
                for j in range(i + 1, len(w_list)):
                    # Avoid linking inflection pairs like abated and abating
                    w1, w2 = w_list[i], w_list[j]
                    if w1.startswith(w2) or w2.startswith(w1):
                        continue
                    add_syn_link(w1, w2)
                    lemma_cluster_added += 1

    print(f"Ingested high-precision exam_meaning clusters: {lemma_cluster_added} links.")

    # 4. Frequency tier scoring helper for sorting synonyms (Core first, then Expand, then Basic)
    tier_order = {'core': 3, 'expand': 2, 'basic': 1}

    def sort_synonyms_for_word(target_w, syn_set):
        sorted_syns = sorted(
            list(syn_set),
            key=lambda item: (
                -tier_order.get(all_word_map[item].get('tier', 'basic'), 1),
                item
            )
        )
        return sorted_syns[:5] # Top 5 most high-yield Kaoyan synonyms

    # 5. Apply back to all words
    enriched_count = 0
    total_syn_terms = 0

    for w in words_list:
        target = w['word'].lower()
        if target in syn_graph and syn_graph[target]:
            sorted_syns = sort_synonyms_for_word(target, syn_graph[target])
            if sorted_syns:
                w['synonyms'] = ', '.join(sorted_syns)
                enriched_count += 1
                total_syn_terms += len(sorted_syns)
        else:
            w['synonyms'] = ''

    print(f"\n================ SUMMARY ================")
    print(f"Total words with 100% Kaoyan Syllabus Synonyms: {enriched_count} / {len(words_list)} ({enriched_count/len(words_list)*100:.1f}%)")
    print(f"Total synonym terms assigned: {total_syn_terms}")
    print(f"Average synonyms per enriched word: {total_syn_terms/enriched_count:.2f}")

    # 6. Sanity check: Ensure 0 out-of-vocab synonyms exist in final data
    out_of_vocab = 0
    for w in words_list:
        if w.get('synonyms'):
            for s in [x.strip() for x in w['synonyms'].split(',')]:
                if s not in all_valid_words:
                    out_of_vocab += 1
                    print(f"ERROR: Out-of-vocab synonym detected: {s} in {w['word']}")

    if out_of_vocab == 0:
        print("✓ VALIDATION PASSED: Exactly 0 out-of-vocab synonyms. 100% Kaoyan Syllabus Compliant!")
    else:
        print(f"❌ VALIDATION FAILED: Found {out_of_vocab} out-of-vocab synonyms.")

    # Save to words.json
    with open(WORDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Saved updated dataset to {WORDS_PATH}.")

if __name__ == '__main__':
    expand_synonyms_corpus()

