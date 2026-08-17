# 英语一分层词库数据质量说明（v9）

## 词库规模（2026-08 重构：红宝书 2027 风格 6000 词）
- 主词库：**6013 个唯一词条**（4003 → 6013，按红宝书 2027 考研词汇范围重排：删除词形词条与罕见低价值词 363 个，新增考研大纲常见词 2365 个）。
- 核心高频：1000 ｜ 高频重点：1567（含补录基础高频词 108）｜ 重点扩展：2641 ｜ 普通扩展：805
- 词条唯一性：6013/6013，无重复。
- **全部 6013 词均含本地中文释义**。
- 删除规则：词形词条（复数/过去式/现在分词等派生词条，正则匹配 + 人工抽查，保护核心词 being/born/crew/found/thought 5 个）+ 罕见动物等考研不可能考察词（aardvark 土豚、abalone 鲍鱼、alligator 短吻鳄、alpaca 羊驼等 8 个）。

## 垃圾词清洗（junk_words.py）
原词库后半段（aachen 起的 3300 个"补全词"）混入大量无考研价值的内容，逐词人工核验后删除 1605 个：

| 类型 | 示例 | 数量级 |
|---|---|---|
| 人名 | aaker、abrahamson、ahmad、alvarez、alvin… | 约 1100 |
| 地名 | aachen、aarhus、abkhazia、alabama、albania、aguascalientes… | 约 250 |
| 公司/品牌 | adidas、accenture、aeroflot、alcatel、ameritech、amgen… | 约 130 |
| 机构/教派 | aipac、americorps、adventist、amish… | 约 30 |
| 非英语/外来词 | aerien、adios、agua、aguacate、amenaces… | 约 30 |
| 缩写/拼写错误 | adhd、adsl、alot、alred、allright、agregious… | 约 15 |
| 极端罕见技术词 | acetosyringone、acetylcholine、actinide、affricate、agonist… | 约 50 |

删除规则：只删无本地释义的补全区词条；有释义的词条受脚本保护不被误删。不确定的词一律保留。

## 数据版本与学习记录分离（v9）
- `DATA_VERSION = "6013-v9"`（`words.json` 顶层字段），前端读取后与本地学习记录版本比对，版本不一致时自动清理失效进度。
- **数据与学习记录彻底分离**：`data/words.json` 只存公共词库数据；学习进度、评分、复习队列、薄弱词等全部存浏览器 localStorage（`kaoyan_study_v3` 等），不进词库文件。词库更新不丢学习记录，学习记录损坏不影响词库。
- 预留字段（暂为空，不编造）：`exam_frequency: null`、`exam_years: []`、`exam_types: []`、`exam_contexts: []`——供未来接入真实真题数据时使用。当前**未填入任何伪造的真题统计**。

## 统一字段规范（v9）
| 字段 | 说明 | 示例 |
|---|---|---|
| word | 单词 | address |
| phonetic | 音标 | /əˈdres/ |
| pos | 词性（统一短格式 n./v./adj./adv. 等，多词性保留） | n./v. |
| translation | 中文释义 | 地址；演讲；处理，解决 |
| example_en | 英文例句（自然、语法正确、考研阅读难度，必须含目标词或其屈折形式） | The president addressed the nation on television. |
| example_zh | 中文例句（与英文对应） | 总统在电视上向全国发表讲话。 |
| tier | 分层：核心高频/高频重点/重点扩展/普通扩展 | 核心高频 |
| exam_meaning | 考研核心义（人工精选，词典可查实；不可靠留空，页面回退显示普通释义） | 处理，解决（address the problem） |
| secondary_meanings | 熟词僻义（只在考研中易被忽略的义项） | strike：罢工；打动；（疾病）侵袭 |
| collocation_hint | 高频搭配（2-5 个真实考研搭配，不凑数） | address the problem; address the issue |
| word_family | 词族（真实派生词） | address: addresses; addressed; addressing; addressable |
| synonyms / antonyms | 同义词 / 反义词（语义基本对应，不牵强） | 同义词 tackle, handle |
| confusable_words | 易混词（显示词义/词性/语境区别，同组双向挂载） | adapt / adopt 区别 |
| word_forms | 词形变化 | study, studies, studied, studying |
| source | 来源（ecdict/manual/curated 等） | manual |
| quality_score | 数据完整度等级 A/B/C/D（**不是考试频率**） | A |
| exam_frequency 等 4 项 | 预留真题字段（当前全为空） | null / [] |

不存在或不可靠的字段一律留空/省略，绝不编造；AI 生成内容不写入词库、不标记为真题。

## quality_score 计算规则（与站点展示一致）
7 个必选字段各 1 分：phonetic、pos、translation、exam_meaning、example_en、example_zh、collocation_hint；
3 个加分字段各 0.5 分：secondary_meanings、word_family、source 可靠性（manual/curated 0.5，ecdict 0.3）。
总分 ≥7.5 为 A，≥6.0 为 B，≥4.0 为 C，否则 D。

## 质量目标与本轮成果（v9）
| 指标 | 核心高频 1000 | 高频重点 1567 | 扩展词 3446 |
|---|---|---|---|
| 音标 | 100% | 99.6% | Pearson LDOCE5 + Free Dictionary API 抓取（词典可查实才写入，总覆盖率 95.3%） |
| 词性 | 100% | 100% | 95.2% |
| 中文释义 | 100% | 100% | 100%（人工编写） |
| 英文例句 | 100% | 100% | **100%（v9 补全全部 2365 条缺口，AI 生成并逐条校验含目标词）** |
| 中文例句 | 100% | 100% | 高频重点层随例句 |
| 考研核心义 | 100% | 83.5% | 精选词条 |
| 高频搭配 | 100% | 100% | 精选词条 |

- 例句全部为自然、完整、考研阅读语境的句子；通过"例句必须包含目标词（含屈折变形）"校验，170 处历史问题已清零。
- 词性格式统一为 n./v./adj./adv. 短格式（187 处 noun./verb. 等已统一）。
- 清洗 ECDICT 遗留问题：垃圾义项（imagination「听觉」、electricity「热情」）、重复义项（shelf「架子, 搁板；架子」、definition「清晰度; 清晰度」）、例句与词义不对应（adapters、fine、beyond、boot、employment 等 10 处）、多余空格（began 等 5 处）。

## 精选新字段（v9）
- word_family 词族：488 词（核心高频优先）
- synonyms 同义词：491 词 ｜ antonyms 反义词：346 词 ｜ word_forms 词形：420 词
- confusable_words 易混词：26 组 36 条目（affect/effect、adapt/adopt、economic/economical、personal/personnel、principal/principle、compliment/complement、precede/proceed、conscious/conscience、historic/historical、rise/raise/arise、considerable/considerate、continual/continuous、ensure/assure/insure、sensitive/sensible 等，含词义/词性/语境区别）

## 词库页组合筛选与详情页数据完整度（v9）
- 词库目录页（words.html）新增第二行数据筛选 chips：有音标 / 有词性 / 有核心义 / 有僻义 / 有搭配 / 有例句 / 有词族 / 有词形，可与 tier、字母、搜索**组合使用**（多选为 AND）。
- 查词详情页新增「数据完整度」徽章：`████████░░ 80% · B级`（按上述 10 分制计算，**与考频无关**，悬停显示缺失字段），并新增「词汇关联」面板展示词族/词形/同反义词/易混词。

## 考研核心义与熟词僻义
- `exam_meaning`：该词在考研英语一语境中最值得掌握的意思（人工精选 414+ 词，如 address→处理解决、account→解释/占比例、subject→使遭受）。
- `secondary_meanings`：熟词僻义（500+ 词，含 address/account/subject/issue/figure/claim/concern/interest/strike/credit/discipline/practice/approach/advance/engage/sustain/yield/reserve 等）。
- 全部为词典可查实义项，不编造真题数据；无法可靠判断的词留空，页面回退显示普通释义。

## 数据现状（v9，最终数字见 word-stats.js 输出）
| 指标 | 数量 |
|---|---|
| 总词条 | 6013（唯一性 100%） |
| 含本地中文释义 | 6013（100%） |
| 含考研核心义 | 2527（42%，人工精选） |
| 含熟词僻义 | 529（8.8%） |
| 含英文例句 | 6013（100%） |
| 含音标 | 5730（95.3%，核心 100% + 高频 99.6% + 扩展抓取命中） |
| 含词性 | 5727（95.2%） |

## 脚本用法
```bash
# 数据完整性检查（重复/空字段/类型/音标/例句含词/多余空格/搭配重复/字段规范）
node scripts/validate-words.js

# 覆盖率统计报告（总词数/各 tier/13 字段覆盖率/quality_score 分布）
node scripts/word-stats.js
```

## 学习算法（未改动，评分 3 键）
- 3 级评分：0=陌生→30 分钟再现（记 wrong/failStreak/hardCount）；1=模糊→1 天；2=认识→3 天；连续成功 ≥2/3/4/5 次间隔升级 7/15/30/60 天。
- 队列优先级：到期复习词 → 薄弱词 → 新词；薄弱词 = wrong≥3 或 failStreak≥3；顽固词 = 「再来一次」≥3 次。
- 使用设备本地日期，跨天自动重置；同词当天重复评分不重复计数；localStorage 损坏自动修复。
- 学习统计：连续打卡 + 近 14 天柱状图；词库版本更新自动清理失效进度。

## 离线使用（PWA）
manifest.webmanifest + sw.js + js/pwa.js：首次联网打开后缓存全部静态资源；断网仍可背诵、查词。需 HTTP 服务器访问。

## 代码检查
- js/app.js、js/study.js、js/catalog.js、js/pwa.js、sw.js、scripts/*.js：Node.js `--check` 通过
- 所有 JSON 解析通过；validate-words.js 全绿（✓ 未发现异常）
- test_study.js：45 项回归测试通过（进度持久化/跨天重置/本地日期/防重复计数/损坏容错/3 级评分/连续成功阶梯/薄弱词/队列优先级/旧数据兼容/词库版本清理）

## 数据与版权
- 音标与中文释义来自开源 ECDICT（MIT）；扩展层音标/词性来自 Free Dictionary API（Wiktionary，CC-BY-SA）与 Pearson LDOCE5。
- AI 内容按需生成，仅供学习参考，不写入词库。
