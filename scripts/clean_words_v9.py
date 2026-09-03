# -*- coding: utf-8 -*-
"""v9 词库清洗：
1. 停用基础词（小学/初中简单词）及其屈折词条 → active=false（保留数据可恢复）
2. 停用"普通扩展"低频补全词（≤★★ 且无核心义/熟词僻义）→ active=false
3. 追加 v9 高频补充词（考研高频缺失词，附考研核心义）
4. data_version 升级触发前端旧进度清理

用法: python scripts/clean_words_v9.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'data', 'words.json')

# ---- 1) 基础词停用表（小学/初中水平；含熟词僻义的保留，不在表内） ----
BASIC = """answer bathroom black brother child city close cold come door girl good happy help like
long love money morning night open read road small street talk tell town water white window woman
year young say see that this eat walk sit sing dance jump play give""".split()
# 常见屈折后缀扩展
def inflections(w):
    out = {w+'s', w+'es', w+'ed', w+'ing', w+'er', w+'est'}
    if w.endswith('e'):
        out |= {w[:-1]+'ing', w[:-1]+'ed'}
    if w.endswith('y'):
        out |= {w[:-1]+'ies', w[:-1]+'ied'}
    if w.endswith('d') or w.endswith('t'):
        out.add(w+'ted' if w.endswith('t') else w+'ded')
    return out

# ---- 2) v9 高频补充词：word|pos|translation|exam_meaning ----
CORE = """
anonymous|adj.|匿名的；无名的|常考匿名信源、匿名捐赠等阅读语境
arrogant|adj.|傲慢的；自大的|贬义形容词，常考人物态度题
barren|adj.|贫瘠的；不结果实的；无成效的|可指土地贫瘠或努力无果
bewilder|v.|使迷惑；使慌乱|常考令人困惑的复杂局面
bleak|adj.|荒凉的；黯淡的|常考前景、形势黯淡
blunder|n.|大错；失误|指因愚蠢或疏忽犯的大错
boycott|v./n.|（联合）抵制|社会经济语境高频
breach|n./v.|违反；破坏；缺口|高频搭配 breach of contract/trust
brisk|adj.|轻快的；兴隆的；凉爽的|高频搭配 brisk walk / brisk trade
brutal|adj.|野蛮的；残忍的|常考残酷竞争、粗暴对待
catastrophe|n.|大灾难；惨败|灾难与负面事件阅读高频
cater|v.|迎合；提供饮食|高频搭配 cater for/to
census|n.|人口普查|社会统计语境
chaos|n.|混乱；无秩序|高频搭配 in chaos
cherish|v.|珍惜；怀有（希望、记忆）|高频搭配 cherish the hope/memory
cling|v.|紧抓；坚持；依恋|高频搭配 cling to
clumsy|adj.|笨拙的；不得体的|形容动作或言辞
collide|v.|碰撞；冲突|高频搭配 collide with
commence|v.|开始|正式文体中 begin 的替换词
commute|v./n.|通勤；上下班路程|城市与交通语境
compact|adj.|紧凑的；简洁的 n.|协议|形容空间紧凑或文体简洁
competent|adj.|有能力的；胜任的|高频搭配 be competent for
compliment|n./v.|称赞；恭维|高频搭配 compliment sb on
compress|v.|压缩；浓缩|信息与数据压缩语境
compulsory|adj.|强制的；义务的|高频搭配 compulsory education
condense|v.|浓缩；压缩；精简|常考把长文浓缩为要点
confidential|adj.|机密的；保密的|文件、信息保密语境
conspicuous|adj.|显眼的；惹人注目的|高频搭配 conspicuous consumption
contempt|n.|轻蔑；蔑视|高频搭配 show contempt for
converge|v.|汇聚；趋同|常考观点、趋势趋同
corrupt|adj.|腐败的 v.|使腐败；腐蚀|政治语境高频
counterpart|n.|对应的人（物）|学术阅读超高频
cram|v.|塞满；临时抱佛脚|高频搭配 cram into / cram for
crumble|v.|崩溃；瓦解；碎裂|常考体制、信念崩塌
cushion|v.|缓冲；减轻 n.|垫子|经济语境"缓冲冲击"
dazzle|v.|使眼花缭乱；使赞叹
decent|adj.|体面的；正派的；像样的|生活语境高频
decisive|adj.|决定性的；果断的|高频搭配 play a decisive role
degrade|v.|降低；使退化；使丢脸|环境与尊严语境
denote|v.|表示；标志|学术与符号语境
deprive|v.|剥夺|高频搭配 deprive sb of sth
descend|v.|下降；是……的后代|高频搭配 descend from
designate|v.|指定；命名；任命|正式语境
destiny|n.|命运；天数
deteriorate|v.|恶化|常考健康、环境、关系恶化
devise|v.|设计；想出|高频搭配 devise a plan/method
diffuse|v.|扩散；传播 adj.|弥漫的|知识、技术扩散语境
diligent|adj.|勤奋的；勤勉的
discard|v.|丢弃；抛弃
discern|v.|辨别；察觉|常考辨别差异或真相
discrepancy|n.|差异；不一致|常考数据、说法出入
disguise|v./n.|伪装；掩饰|高频搭配 in disguise
disperse|v.|分散；驱散
displace|v.|取代；使流离失所|就业与人口语境
divert|v.|转移；使转向|高频搭配 divert attention from
doom|n.|厄运 v.|注定|高频搭配 be doomed to
drastic|adj.|激烈的；严厉的|高频搭配 drastic measures
dwell|v.|居住；老是想着|高频搭配 dwell on
eccentric|adj.|古怪的 n.|古怪的人
elevate|v.|提升；举起|常考地位、格调提升
elicit|v.|引出；诱出|高频搭配 elicit a response
eligible|adj.|有资格的；合适的|高频搭配 eligible for
embark|v.|着手；上船|高频搭配 embark on
endeavor|n./v.|努力；尽力|effort 的正式替换词
enrich|v.|使丰富；充实
enroll|v.|注册； enrol 招收|高频搭配 enroll in
entitle|v.|使有权；给……题名|高频搭配 be entitled to
equip|v.|装备；使有能力|高频搭配 be equipped with
erode|v.|侵蚀；逐渐削弱|常考信任、优势被侵蚀
eternal|adj.|永恒的；无休止的
evoke|v.|唤起（记忆、情感）
exemplify|v.|是……的典型；例证
exempt|v./adj.|免除；被豁免的|高频搭配 be exempt from
exquisite|adj.|精美的；精致的
extinct|adj.|灭绝的；不再存在的|高频搭配 become extinct
extinguish|v.|熄灭；扑灭
extract|v.|提取；抽取 n.|摘录；提取物
fabricate|v.|捏造；编造|常考编造证据、数据
fancy|v.|喜欢；想要 adj.|花哨的 n.|想象
forbid|v.|禁止|高频搭配 forbid sb to do
fragile|adj.|易碎的；脆弱的|常考生态、经济脆弱
fraud|n.|欺诈；骗局
frustrate|v.|使沮丧；挫败
furnish|v.|提供；配备家具|高频搭配 furnish sb with
fuse|n.|保险丝；导火线 v.|融合
gloomy|adj.|阴暗的；令人沮丧的|常考前景黯淡
grief|n.|悲伤；悲痛
harmony|n.|和谐；融洽|高频搭配 in harmony with
hazard|n.|危险；危害|高频搭配 health hazard
hinder|v.|阻碍；妨碍
humidity|n.|湿度；潮湿
identical|adj.|完全相同的|高频搭配 be identical to/with
illuminate|v.|照亮；阐明
impair|v.|损害；削弱|常考视力、听力、功能受损
imperative|adj.|极其重要的；必要的|高频句型 it is imperative that + 虚拟语气
impulse|n.|冲动；驱动力|高频搭配 on impulse
incidence|n.|发生率
incline|v.|（使）倾向 n.|斜坡|高频搭配 be inclined to
indignant|adj.|愤慨的|高频搭配 be indignant at/over
infect|v.|感染；影响
inferior|adj.|较差的；下级的|高频搭配 be inferior to
inflate|v.|使膨胀；使（通货）膨胀
influential|adj.|有影响力的
inherit|v.|继承；经遗传获得
inject|v.|注射；注入|高频搭配 inject...into
intact|adj.|完整无缺的
integral|adj.|不可或缺的|高频搭配 integral part
invalid|adj.|无效的；作废的
juvenile|adj.|青少年的 n.|青少年|高频搭配 juvenile delinquency
lag|v./n.|落后；滞后|高频搭配 lag behind
landscape|n.|风景；形势；格局|常考政治、经济格局引申义
latent|adj.|潜在的；潜伏的
limp|v./n.|跛行 adj.|软弱的
linger|v.|逗留；萦绕
lodge|v.|暂住；提出（投诉）|高频搭配 lodge a complaint
magnify|v.|放大；夸大
mandate|n./v.|授权；委任
manifest|v.|显现 adj.|明显的|高频搭配 manifest itself in
mediate|v.|调解；斡旋
merge|v.|合并；融合|高频搭配 merge with/into
minimize|v.|使减到最少；贬低
mobilize|v.|动员
molecule|n.|分子
momentum|n.|势头；动力|高频搭配 gain momentum
motivate|v.|激励；激发
multitude|n.|大量；民众|高频搭配 a multitude of
naive|adj.|天真的；幼稚的
notify|v.|正式通知|高频搭配 notify sb of
nourish|v.|滋养；培育
obscure|adj.|晦涩的；不出名的 v.|使模糊；掩盖|熟词：兼有"晦涩"与"掩盖"两义
obsess|v.|使痴迷；使心神不宁|高频搭配 be obsessed with
offset|v.|抵消；弥补|经济与环境语境高频
originate|v.|起源；发端|高频搭配 originate from/in
outweigh|v.|（在价值上）超过|高频搭配 benefits outweigh risks
overwhelm|v.|压倒；使不知所措|高频搭配 be overwhelmed by
partial|adj.|部分的；偏袒的|熟词僻义：be partial to 偏爱
patriot|n.|爱国者
peculiar|adj.|奇怪的；特有的|高频搭配 be peculiar to
pedestrian|n.|行人 adj.|平淡乏味的|熟词僻义：形容词"平淡的"
pending|adj.|未决的；待定的|高频搭配 pending investigation
persevere|v.|坚持不懈
petition|n./v.|请愿；请愿书
plague|n.|瘟疫；灾害 v.|困扰|高频搭配 be plagued by
plunge|v.|骤降；跳入；使陷入|高频搭配 plunge into
pollute|v.|污染
ponder|v.|思索；考虑|高频搭配 ponder on/over
postpone|v.|推迟；延期
potent|adj.|有效的；强有力的
precise|adj.|精确的；确切的
predecessor|n.|前任；前身
prestige|n.|威望；声望|形容词 prestigious
presume|v.|推测；擅自行事|高频搭配 presume on
probe|v./n.|探查；调查 n.|探测器
proclaim|v.|宣告；声明
prolong|v.|延长；拖延
punctual|adj.|准时的
rally|n./v.|集会；恢复；反弹|熟词僻义：市场、健康"回暖"
random|adj.|随机的；任意的|高频搭配 at random
rebel|n./v.|反叛；反抗
recede|v.|后退；逐渐减弱
refrain|v.|克制；避免|高频搭配 refrain from
refute|v.|驳斥；反驳
remedy|n./v.|补救办法；纠正|熟词僻义：药物、疗法
repel|v.|击退；排斥
resent|v.|怨恨；不满
reside|v.|居住；存在于|高频搭配 reside in
revive|v.|复苏；复兴|常考经济、产业复苏
skeptical|adj.|怀疑的|高频搭配 be skeptical about/of
sober|adj.|清醒的；冷静的
sole|adj.|唯一的；仅有的
solitary|adj.|独居的；孤独的
sophisticated|adj.|复杂的；先进的；老练的
spectacle|n.|景象；奇观； spectacle (pl.) 眼镜
spectrum|n.|光谱；范围；系列|高频搭配 a spectrum of
sphere|n.|球体；领域|高频搭配 sphere of influence
spontaneous|adj.|自发的；自然的
stagger|v.|蹒跚；使震惊；错开
stationary|adj.|静止的；不动的|考点：与 stationery（文具）区分
strain|n./v.|拉紧；压力； strains 菌株|高频搭配 put a strain on
stubborn|adj.|顽固的；执拗的
subsidize|v.|补贴；资助|名词 subsidy
subtle|adj.|微妙的；细微的
summon|v.|召唤；传唤
superficial|adj.|肤浅的；表面的
supervise|v.|监督；管理
surge|n./v.|激增；汹涌|高频搭配 a surge in
surpass|v.|超过；胜过
surrender|v./n.|投降；交出；放弃
susceptible|adj.|易受影响的；过敏的|高频搭配 be susceptible to
suspend|v.|暂停；中止；悬挂
synthesis|n.|综合；合成
tangible|adj.|有形的；切实的
tempt|v.|引诱；诱惑|高频搭配 be tempted to
terrify|v.|使恐惧；使惊吓
texture|n.|质地；口感
tolerate|v.|容忍；耐受
trait|n.|特征；特性|高频搭配 personality trait
triumphant|adj.|胜利的；得意洋洋的
turbulent|adj.|动荡的；混乱的|高频搭配 turbulent times
unanimous|adj.|全体一致的
uphold|v.|支持；维持（原判）
vague|adj.|模糊的；不明确的
verge|n.|边缘|高频搭配 on the verge of
versatile|adj.|多才多艺的；多用途的
vibration|n.|振动；颤动
vice|n.|恶习；副的； vice versa 反之亦然|考点：vice versa 高频短语
vigorous|adj.|有力的；精力充沛的
weary|adj.|疲惫的 v.|使厌烦|高频搭配 be weary of
wreck|n./v.|失事；破坏；残骸
""".strip().split('\n')

d = json.load(open(P, encoding='utf-8'))
words = d['words']
index = {w['word']: w for w in words}

# ---- 执行停用 ----
deactivated = []
def deactivate(w, reason):
    if w.get('active') is False:
        return
    w['active'] = False
    w['note'] = (w.get('note') or '') + ' [v9剔除:%s]' % reason
    deactivated.append(w['word'])

for b in BASIC:
    if b in index:
        deactivate(index[b], '基础词')
    for f in inflections(b):
        if f in index:
            deactivate(index[f], '基础词屈折')

for w in words:
    if w.get('tier') == '普通扩展':
        deactivate(w, '低频扩展')

# ---- 追加高频补充词 ----
added, skipped = [], []
for line in CORE:
    parts = [x.strip() for x in line.split('|')]
    if len(parts) < 3:
        continue
    word, pos, trans = parts[0], parts[1], parts[2]
    exam = parts[3] if len(parts) > 3 else ''
    if word in index:
        w = index[word]
        if w.get('active') is False:
            # 之前被判低频停用，但实为考研高频：恢复并升级
            w['active'] = True
            w['tier'] = '高频重点'
            w['tag'] = 'v9高频恢复'
            w['true_priority'] = '★★★★☆'
            if exam and not w.get('exam_meaning'):
                w['exam_meaning'] = exam
            w['note'] = (w.get('note') or '') + ' [v9恢复]'
            added.append(word)
        else:
            skipped.append(word)
        continue
    words.append({
        'word': word, 'phonetic': '', 'pos': pos, 'translation': trans,
        'tag': 'v9高频补充', 'example_en': '', 'example_zh': '',
        'tier': '高频重点', 'active': True, 'quality': 'curated-2026',
        'true_priority': '★★★★☆', 'exam_meaning': exam,
        'collocation_hint': '', 'note': 'v9 高频补充词',
        'studyEligible': True, 'secondary_meanings': '', 'source': 'manual-v9',
        'quality_score': 'B', 'exam_frequency': None, 'exam_years': [],
        'exam_types': [], 'exam_contexts': [],
    })
    added.append(word)

d['data_version'] = '4003-v9-slim'
json.dump(d, open(P, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

active = [w for w in words if w.get('active') is not False]
import collections
print('原词数:', len(words) - len(added), '| 本次停用:', len(deactivated), '| 恢复/新增:', len(added), '(恢复', len(added)-len([w for w in added if w not in [x["word"] for x in words if x.get("tag")=="v9高频补充"]]), ')')
print('当前总词条:', len(words), '| 有效词:', len(active))
print('分层分布:', dict(collections.Counter(w.get('tier') for w in active)))
print('样例-新增:', added[:10])
print('已存在跳过:', skipped[:20])
