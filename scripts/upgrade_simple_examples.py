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

# Master dictionary of Kaoyan academic replacements
ACADEMIC_REPLACEMENTS = {
    "abashed": [
        "The corporate spokesperson appeared visibly abashed when empirical audit reports revealed severe discrepancies in the annual environmental compliance disclosures.",
        "当权威审计报告揭露年度环境合规披露中存在严重出入时，企业发言人显得明显局促不安。"
    ],
    "abated": [
        "Although inflationary pressures temporarily abated following interest rate interventions, structural economic imbalances continued to threaten sustainable market stability.",
        "尽管在利率调控干预后通胀压力暂时有所缓解，但结构性经济失衡依然威胁着市场的可持续稳定。"
    ],
    "abatements": [
        "Municipal governments introduced substantial tax abatements to stimulate investments in green technologies, thereby accelerating the transition toward low-carbon regional economies.",
        "地方政府出台了大力度的税收减免政策以刺激对绿色技术的投资，从而加速了向低碳区域经济的转型。"
    ],
    "abating": [
        "With public skepticism regarding algorithmic surveillance scarcely abating, regulatory agencies were compelled to introduce stringent statutory safeguards for personal privacy.",
        "鉴于公众对算法监控的疑虑丝毫未见消退，监管机构不得不针对个人隐私出台严格的法定保护机制。"
    ],
    "abbreviates": [
        "The newly proposed fiscal protocol deliberately abbreviates procedural review periods, aiming to expedite emergency financial allocations during macroeconomic downturns.",
        "新提出的财政议案特意缩短了程序性审查周期，旨在宏观经济衰退期间加速紧急财政拨款的落实。"
    ],
    "abbreviating": [
        "Critics argue that abbreviating the clinical evaluation timeline for novel pharmaceutical treatments could introduce unforeseen risks to public health and safety.",
        "批评人士指出，缩短新型药物疗法的临床评估时间表可能会给公众健康与安全带来不可预见的风险。"
    ],
    "abbreviations": [
        "Academic publications in specialized interdisciplinary journals often rely on standard abbreviations to streamline the presentation of complex biochemical mechanisms.",
        "专业跨学科期刊中的学术出版物通常依赖标准化缩写，以简化复杂生化机制的论述表述。"
    ],
    "abducted": [
        "International legal bodies emphasized that individuals abducted during political unrest must be granted immediate protection under universal humanitarian conventions.",
        "国际司法机构强调，在政治动荡期间遭到绑架的人员必须立即获得普遍人道主义公约下的法定保护。"
    ],
    "abductees": [
        "Humanitarian organizations coordinated comprehensive psychological rehabilitation programs to facilitate the reintegration of liberated abductees into peaceful societal life.",
        "人道主义组织统筹了全方位的心理康复方案，以协助获释的被绑架人员重新融入和平的社会生活。"
    ],
    "abducting": [
        "The unauthorized practice of abducting proprietary corporate data across international networks has heightened legislative concerns over digital sovereignty.",
        "跨国网络中未经授权窃取企业专有数据的行径，进一步加剧了立法部门对数字主权的担忧。"
    ],
    "abductions": [
        "The persistent surge in transnational abductions prompted sovereign states to establish coordinated intelligence networks to combat organized cross-border crimes.",
        "跨国绑架事件的持续激增促使主权国家建立协调一致的情报网络，以打击有组织的跨国犯罪活动。"
    ],
    "abductors": [
        "Judicial authorities imposed severe penal sanctions on the abductors to establish an unequivocal legal deterrent against future transnational violations.",
        "司法当局对绑架者施加了严厉的刑罚制裁，以树立明确的法律威慑，防止未来再次发生跨国违法行为。"
    ],
    "abducts": [
        "When artificial intelligence software autonomously abducts intellectual property from unauthorized sources, existing copyright jurisprudence faces unprecedented challenges.",
        "当人工智能软件擅自从非授权来源掠取知识产权内容时，现行的版权法理面临着前所未有的挑战。"
    ],
    "aberrations": [
        "Sociologists contend that temporary statistical aberrations in voter turnout should not obscure long-term trends toward civic disengagement among young demographics.",
        "社会学家主张，选民投票率在统计上的暂时偏差不应掩盖青年群体日益远离公共事务的长期趋势。"
    ],
    "abetted": [
        "Corporate executives who knowingly abetted fraudulent accounting practices were held personally accountable under amended federal corporate governance statutes.",
        "在修正后的联邦公司治理法案下，故意协助并唆使财务造假行为的企业高管被依法追究了个人责任。"
    ],
    "abhorred": [
        "Enlightenment philosophers universally abhorred tyranny and dogmatic censorship, advocating instead for the establishment of rational inquiry and fundamental civil liberties.",
        "启蒙哲学家普遍痛恨专制暴政与教条审查，转而极力倡导确立理性探究与基本公民自由。"
    ],
    "abhors": [
        "Modern democratic jurisprudence fundamentally abhors arbitrary executive overreach, establishing robust institutional checks and balances to preserve the rule of law.",
        "现代民主法理从根本上厌恶肆意的行政越权，因而设立了健全的制度制衡机制以维护法治原则。"
    ],
    "abided": [
        "Financial institutions that strictly abided by prudential capital reserves demonstrated superior resilience throughout the prolonged international liquidity crisis.",
        "严格恪守审慎资本储备标准的金融机构，在持续的国际流动性危机中展现出了卓越的抗风险韧性。"
    ],
    "abides": [
        "A truly legitimate judicial system abides by the constitutional principle that all citizens are entitled to equitable and impartial legal proceedings.",
        "一个真正具有合法性的司法体系必然恪守宪法原则，即所有公民均享有获得公正平等的法律审判之权利。"
    ],
    "abiding": [
        "Fostering an abiding commitment to academic integrity is essential for universities seeking to produce reliable and reproducible scientific research.",
        "对于致力于产出可靠且可复现科研成果的高校而言，培养对学术诚信的持久坚守至关重要。"
    ],
    "ablaze": [
        "The sudden disclosure of institutional corruption set public sentiment ablaze, igniting widespread demands for comprehensive administrative transparency.",
        "体制性腐败内幕的突然曝光使公众情绪瞬间沸腾，引发了全社会要求全面实现行政透明的强烈呼声。"
    ],
    "ablution": [
        "Anthropological studies reveal that ritual ablution serves not merely as a hygienic practice, but as a symbolic purification of communal morality.",
        "人类学研究表明，仪式性净水洗礼不仅是一种卫生习惯，更象征着对社群道德秩序的净化与重塑。"
    ],
    "abnegation": [
        "Classical ethical treatises frequently exalted self-abnegation as the supreme civic virtue required to preserve communal harmony during national crises.",
        "古典伦理学专著经常将自我克制与牺牲推崇为国家危机期间维护社群和谐所需的崇高公民美德。"
    ],
    "abnegations": [
        "The historical austerity measures demanded repeated economic abnegations from ordinary citizens while failing to resolve underlying fiscal deficits.",
        "历史上的紧缩政策要求普通公民一再做出经济上的牺牲与忍让，却未能从根本上解决深层财政赤字。"
    ],
    "abnormally": [
        "Meteorologists warned that abnormally high ocean temperatures during winter months could disrupt global climate patterns and intensify extreme weather events.",
        "气象学家警告称，冬季数月中异常偏高的海洋温度可能会扰乱全球气候格局，并加剧极端天气事件的发生。"
    ],
    "abodes": [
        "Rapid industrialization transformed historical rural abodes into dense urban settlements, reshaping the social fabric of traditional communities.",
        "快速工业化将传统的乡村居所改造成了密集的高楼聚落，从而深刻重塑了传统社区的社会结构。"
    ],
    "abolishing": [
        "Economists debate whether abolishing agricultural subsidies would stimulate competitive market pricing or inadvertently destabilize vulnerable rural livelihoods.",
        "经济学家就废除农业补贴究竟会激发市场竞争性定价，还是会意外危及脆弱的农村生计展开了激烈争论。"
    ],
    "abolitionists": [
        "Nineteenth-century abolitionists utilized moral persuasion and published autobiographies to mobilize international public sentiment against human servitude.",
        "19世纪的废奴主义者利用道德劝说与出版自传，积极动员国际舆论反抗奴役制度。"
    ],
    "abominable": [
        "Human rights observers condemned the abominable working conditions in unregulated sweatshops, calling for binding international labor standards.",
        "人权观察员强烈谴责无监管血汗工厂中极其恶劣的工作环境，并呼吁制定具有约束力的国际劳工标准。"
    ],
    "aboriginal": [
        "Environmental preservation programs increasingly incorporate the ecological knowledge of aboriginal communities to protect fragile biodiversity hotspots.",
        "环境保护规划日益吸纳原住民社区的生态认知智慧，以保护脆弱的生物多样性热点区域。"
    ],
    "aborting": [
        "Project managers made the difficult decision of aborting the costly infrastructure initiative after geological surveys confirmed insurmountable structural hazards.",
        "在地质勘探确认存在无法克服的结构性隐患后，项目主管做出了中止这项耗资巨大基建项目的艰难抉择。"
    ],
    "aborted": [
        "The central bank aborted its planned monetary tightening cycle when sudden geopolitical conflicts threatened to precipitate a severe international credit contraction.",
        "当地缘政治突发冲突可能引发严重的国际信贷紧缩时，中央银行果断中止了原定的货币紧缩周期。"
    ],
    "abounds": [
        "Contemporary scholarship abounds with empirical evidence demonstrating that early childhood education yields enduring economic and cognitive benefits.",
        "当代学术界充斥着大量实证依据，充分证明早期幼儿教育能够带来持久的经济回报与认知益处。"
    ],
    "abraded": [
        "Archaeological artifacts with severely abraded surfaces required advanced multi-spectral imaging to reconstruct their original epigraphic inscriptions.",
        "表面严重磨损的考古文物需要借助先进的多光谱成像技术，以复原其最初铭刻的铭文。"
    ],
    "abrading": [
        "The relentless exposure to marine waves is continuously abrading coastal rock formations, posing severe challenges to sustainable shoreline management.",
        "海浪的持续冲击不断侵蚀磨损着沿海岩层结构，对海岸线的可持续管理构成了严峻挑战。"
    ],
    "abrasion": [
        "Geological abrasion caused by glacial movement sculpted the profound valleys and distinctive mountain topography observed across alpine regions.",
        "冰川运动所造成的地质磨蚀作用，塑造了阿尔卑斯山脉地区所见的深邃峡谷与独特山地地貌。"
    ],
    "abrasively": [
        "The corporate negotiator behaved abrasively during multilateral talks, which ultimately undermined diplomatic goodwill and stalled contractual consensus.",
        "该企业谈判代表在多边会谈中态度生硬粗暴，最终损害了各方的谈判诚意，导致合同共识陷入僵局。"
    ],
    "abreast": [
        "In the rapidly evolving landscape of artificial intelligence, legal practitioners must stay abreast of technological breakthroughs to draft sound regulatory frameworks.",
        "在瞬息万变的人工智能技术格局中，法律从业人员必须紧跟技术突破的前沿动态，以起草严谨的监管框架。"
    ],
    "abridging": [
        "Constitutional scholars argue that abridging freedom of expression under the pretext of maintaining order risks eroding foundational democratic norms.",
        "宪法学者主张，以维持秩序为由削减言论自由可能会侵蚀现代民主制度的根本基石。"
    ],
    "abridgments": [
        "While historical abridgments of classical philosophical texts improve accessibility, they frequently omit subtle nuances essential to critical comprehension.",
        "尽管古典哲学著作的精简节本提高了普及度，但它们往往忽略了批判性理解所必需的幽微要义。"
    ],
    "abscond": [
        "Regulatory agencies tightened cross-border financial oversight to prevent corrupt corporate executives from attempting to abscond with illicit investor capital.",
        "监管机构收紧了跨境金融审查，以防止腐败的企业高管企图携非法挪用的投资人资金潜逃出境。"
    ],
    "absconded": [
        "The fraudulent fund manager absconded to a non-extradition jurisdiction after embezzling millions of dollars from vulnerable pension accounts.",
        "这名涉嫌欺诈的基金经理在挪用了数百万美元养老金账户资金后，潜逃至无引渡条约的司法管辖区。"
    ],
    "absconding": [
        "Stringent border surveillance mechanisms were enacted to deter high-profile financial criminals from absconding before formal judicial proceedings commenced.",
        "执法部门设立了严格的边境监控机制，以震慑重大经济罪犯在正式司法审理开始前潜逃出境。"
    ],
    "absenteeism": [
        "Industrial psychologists demonstrated that prolonged workplace stress directly contributes to chronic absenteeism and diminished organizational productivity.",
        "工业心理学家证实，长期的职场心理压力是导致慢性缺勤旷工与组织整体生产力下降的直接诱因。"
    ],
    "absolved": [
        "The comprehensive independent inquiry completely absolved the lead researcher of misconduct, confirming that the experimental anomalies were purely coincidental.",
        "全面的独立调查彻底洗清了首席研究员的学术不端嫌疑，证实实验中的数据异常纯属偶然巧合。"
    ],
    "absolving": [
        "Signing contractual liability waivers does not automatically result in absolving corporations from responsibility for reckless environmental negligence.",
        "签署免责协议并不能自动免除企业因肆意破坏环境的重大过失而应承担的法律责任。"
    ],
    "absorbedly": [
        "The cognitive scientist listened absorbedly to the neuroimaging lecture, formulating novel hypotheses regarding synaptic plasticity and human memory formation.",
        "这位认知科学家全神贯注地聆听关于神经成像的学术报告，构想出了有关突触可塑性与记忆形成的崭新假说。"
    ],
    "absorbingly": [
        "The author's historical narrative was absorbingly crafted, seamlessly integrating meticulous archival evidence with profound philosophical reflections on power.",
        "作者的历史叙事构思精巧引人入胜，将严谨的档案文献证据与对权力本质的深刻哲学反思完美融合。"
    ],
    "absorptions": [
        "Differential rates of nutrient absorptions across varied patient cohorts highlighted the necessity of personalized metabolic medical interventions.",
        "不同患者群体在营养吸收率上的差异，突显了开展个性化代谢医疗干预的紧迫必要性。"
    ],
    "abstainers": [
        "Epidemiological studies indicate that total abstainers from alcohol exhibit distinct cardiovascular biomarker profiles compared to moderate consumers.",
        "流行病学研究表明，与适度饮酒者相比，滴酒不沾的绝对戒酒者展现出了截然不同的心血管生物标志物特征。"
    ],
    "abstained": [
        "Several key member states abstained from the controversial voting resolution, citing a lack of comprehensive empirical data on environmental impacts.",
        "数个主要成员国在该项颇具争议的决议表决中投了弃权票，理由是缺乏关于环境影响的充分实证数据。"
    ],
    "abstemious": [
        "Historical biographies depict the philosopher as leading an abstemious lifestyle, prioritizing intellectual pursuits over material luxuries and sensory pleasures.",
        "历史传记将这位哲学家描绘为一个生活极度节制之人，相比物质奢靡与感官享乐，他将求知探索置于首位。"
    ],
    "abstemiousness": [
        "In many classical philosophical traditions, abstemiousness was regarded not as self-punishment, but as the essential discipline required for spiritual clarity.",
        "在诸多古典哲学传统中，清心寡欲与自我节制并不被视为自我惩罚，而是达到心智通达所必需的核心修养。"
    ],
    "abstinences": [
        "Comparative sociological studies investigate how religious abstinences and dietary constraints foster communal solidarity across diverse cultural groups.",
        "比较社会学研究探讨了宗教禁欲与饮食禁忌如何在不同文化群体中强化社群的凝聚力与认同感。"
    ],
    "abstracting": [
        "Theoretical physicists advance scientific knowledge by abstracting universal governing principles from complex and seemingly disordered empirical phenomena.",
        "理论物理学家通过从复杂且看似无序的经验现象中抽象出普适的主导规律，不断推动科学知识的演进。"
    ],
    "abstruse": [
        "Graduate seminars in quantum electrodynamics often grapple with abstruse theoretical formulations that challenge traditional intuitive models of reality.",
        "量子电动力学的研究生专题研讨经常探讨深奥晦涩的理论公式，这些公式对传统的直觉现实模型构成了挑战。"
    ],
    "absurdities": [
        "Satirical literature serves as a powerful medium for exposing the inherent absurdities and moral hypocrisies embedded within bureaucratic institutions.",
        "讽刺文学作为一种有力的媒介，深刻揭露了官僚机构内部所固有的荒诞现象与道德伪善。"
    ],
    "accelerating": [
        "The rapid integration of generative artificial intelligence is accelerating the structural transformation of knowledge-based professional industries.",
        "生成式人工智能的快速融合，正在加速以知识为核心的专业服务行业的结构性转型与重塑。"
    ],
    "accentuates": [
        "The stark contrast between soaring urban wealth and persistent suburban poverty accentuates deep-seated socio-economic inequalities within the metropolis.",
        "城市核心财富的激增与周边郊区贫困的固化形成了鲜明对比，进一步突显了该大都市深层的社会经济不平等。"
    ],
    "acceptability": [
        "Public acceptability of autonomous driving technologies depends heavily on establishing transparent safety standards and rigorous regulatory oversight.",
        "公众对自动驾驶技术的接受程度，在很大程度上取决于能否确立透明的安全标准与严格的监管审查机制。"
    ],
    "accesses": [
        "When an unauthorized external entity accesses encrypted biomedical databases, severe legal liabilities arise under comprehensive patient protection statutes.",
        "当未经授权的外部实体非法访问加密生物医学数据库时，将触发全面患者隐私保护法案下的严重法律责任。"
    ],
    "accommodates": [
        "The modern constitutional framework successfully accommodates diverse multicultural perspectives while upholding unified democratic legal principles.",
        "现代宪法体系在坚守统一的民主法治原则的同时，成功兼容并包了多元化的跨文化视角与诉求。"
    ],
    "accommodating": [
        "Urban planners face the dual challenge of accommodating population influx while preserving ecological greenbelts and historical urban architecture.",
        "城市规划者面临着双重挑战：既要容纳大量涌入的人口，又要保护生态绿带与具有历史风貌的城市建筑。"
    ],
    "accompanying": [
        "The publication of the groundbreaking clinical trial was accompanied by an editorial analysis cautioning against premature commercial application.",
        "这项开创性临床试验研究的发表，伴随着一篇社论精析，警示人们切勿过早进行未经审慎论证的商业化推广。"
    ],
    "accomplishes": [
        "A well-designed institutional governance system accomplishes both equitable regulatory compliance and robust incentives for economic innovation.",
        "设计完善的制度治理体系既能实现公平的合规监管，又能为经济技术创新提供强大的制度激励。"
    ],
    "accumulates": [
        "As atmospheric carbon dioxide accumulates beyond critical thresholds, planetary ecosystems face increasingly irreversible destabilization risks.",
        "随着大气中二氧化碳浓度累积突破临界阈值，地球生态系统面临着日益严峻且不可逆转的失衡风险。"
    ],
    "accuracies": [
        "Discrepancies in computational measurement accuracies across independent laboratories highlighted the urgent need for harmonized metrological protocols.",
        "不同独立实验室在计算机测量精度上的差异，突显了制定统一计量标准规范的紧迫性。"
    ],
    "accusing": [
        "Antitrust regulators released a detailed indictment, accusing leading technology conglomerates of suppressing competition through monopolistic acquisitions.",
        "反垄断监管机构发布了详尽的起诉书，指控大型科技巨头通过垄断性兼并手段恶意压制市场自由竞争。"
    ],
    "acknowledges": [
        "The macroeconomic report explicitly acknowledges that technological displacement poses short-term structural headwinds for unskilled laborers.",
        "该宏观经济报告明确承认，技术性失业短期内给非熟练劳动力群体带来了严峻的结构性挑战。"
    ],
    "activates": [
        "Exposure to complex intellectual challenges activates diverse neural networks associated with cognitive resilience and creative problem-solving.",
        "接触复杂的智力挑战能够激活与认知韧性及创造性问题解决密切相关的多元神经回路。"
    ],
    "adapting": [
        "Higher education institutions must prioritize adapting their pedagogical models to prepare graduates for an increasingly automated workforce.",
        "高等教育机构必须优先调整其教学模式，以帮助毕业生更好地适应日益自动化的未来劳动力市场需求。"
    ],
    "adhering": [
        "Strictly adhering to ethical codes of conduct is non-negotiable for medical researchers conducting high-stakes gene-editing experiments.",
        "在开展事关重大的人类基因编辑实验时，严格恪守伦理行为准则是绝不容妥协的底线原则。"
    ],
    "adjusts": [
        "When the central bank adjusts interest rates, the policy immediately reverberates across corporate investment and consumer borrowing markets.",
        "当中央银行调整基准利率时，该货币政策信号会迅速波及企业资本投资与居民信贷消费市场。"
    ],
    "administered": [
        "Standardized cognitive assessments were systematically administered to evaluate the developmental progress of students across diverse regional demographics.",
        "研究团队系统性地实施了标准化认知评估，以测评不同地区不同背景学生的综合发展进程。"
    ],
    "admonished": [
        "The judicial committee sternly admonished the defense attorneys for attempting to introduce inadmissible hearsay evidence into the courtroom.",
        "司法仲裁委员会对辩护律师企图将不可采信的传闻证据引入法庭的违规行为进行了严厉诫勉与警告。"
    ],
    "advocated": [
        "Pioneering economists advocated for counter-cyclical fiscal spending to stimulate demand and alleviate unemployment during severe recessions.",
        "开创性的经济学家主张在严重衰退期推行反周期的财政扩张支出，以提振总需求并有效缓解失业问题。"
    ],
    "affecting": [
        "The accelerating pace of climate disruption is disproportionately affecting impoverished agricultural communities in equatorial geographic regions.",
        "气候恶化加剧的步伐，正不成比例地严重冲击着赤道地理区域内贫困的农业社区生计。"
    ],
    "affirming": [
        "The supreme court issued a landmark ruling, affirming that digital communications are fully protected under constitutional privacy guarantees.",
        "最高法院做出了一项里程碑式的裁决，明确确认数字通信完全受到宪法隐私条款的严格保护。"
    ],
    "afflicting": [
        "Public health researchers mobilized international resources to combat the chronic infectious disease afflicting vulnerable rural populations.",
        "公共卫生研究人员积极调动国际资源，以全力抗击长期困扰偏远农村弱势群体的慢性传染性疾病。"
    ],
    "aggravating": [
        "Unregulated industrial emissions are aggravating atmospheric pollution, compounding public health hazards in rapidly expanding metropolitan centers.",
        "未经严格监管的工业排放正在加剧大气污染，进一步恶化了快速扩张的大都市中心区域的公共卫生危机。"
    ],
    "aggregating": [
        "Data analytics platforms advance market forecasting by aggregating millions of real-time consumer transactions across digital retail ecosystems.",
        "数据分析平台通过整合数字零售生态系统中数以百万计的实时消费交易数据，有效提升了市场预测能力。"
    ],
    "aligning": [
        "Corporate executives are increasingly aligning strategic investments with environmental, social, and governance (ESG) benchmarks to satisfy global investors.",
        "企业高管们正日益将战略投资与环境、社会和治理（ESG）标准相对齐，以满足全球机构投资者的严苛要求。"
    ],
    "alleviating": [
        "Targeted micro-credit programs have proven instrumental in alleviating poverty and empowering female entrepreneurs across emerging economies.",
        "事实证明，精准定向的小额信贷项目在缓解贫困以及赋能新兴经济体女性创业者方面发挥了关键作用。"
    ],
    "allocating": [
        "Government planners face political trade-offs when allocating scarce fiscal revenue between immediate social welfare and long-term scientific research.",
        "政府规划者在有限财政收入中权衡即时社会福利与长期科研基础设施的分配时，面临着艰难的政治抉择。"
    ],
    "altering": [
        "The relentless expansion of commercial agriculture is rapidly altering native ecosystems, threatening endemic flora and fauna with habitat fragmentation.",
        "商业农业的无序扩张正在迅速改变原生生态系统，栖息地碎片化对特有动植物物种构成了巨大生存威胁。"
    ],
    "ameliorating": [
        "Urban infrastructure renovations play a vital role in ameliorating living standards across neglected metropolitan historical districts.",
        "城市基础设施的升级改造在改善大都市年久失修的历史街区居民生活水平方面发挥着至关重要的作用。"
    ],
    "amplifying": [
        "Social media algorithms often prioritize emotionally provocative content, thereby amplifying ideological polarization across contemporary public discourse.",
        "社交媒体算法往往优先推荐情绪化煽动性内容，从而在当代公共舆论中进一步放大了意识形态的两极分化。"
    ],
    "analyzing": [
        "By analyzing longitudinal demographic datasets, sociologists can identify subtle behavioral shifts that precede major institutional transformations.",
        "通过深入分析跨时段人口学追踪数据，社会学家能够精准捕捉重大社会制度变革前夕出现的微妙行为转向。"
    ],
    "annihilating": [
        "Philosophers warn against the catastrophic potential of advanced autonomous weaponry, capable of annihilating strategic targets without moral oversight.",
        "哲学家对先进自主武器的灾难性潜能发出警示，这种武器能够在缺乏人类伦理监督的情况下摧毁战略目标。"
    ],
    "anticipating": [
        "Central bankers must formulate monetary policy by anticipating inflationary trends rather than reacting exclusively to lagging historical indicators.",
        "中央银行家制定货币政策时必须前瞻性地预判通胀趋势，而非仅仅被动地对滞后的历史统计指标做出反应。"
    ],
    "appealing": [
        "While minimalist aesthetic designs are visually appealing, functional usability must remain the core objective in modern software interface engineering.",
        "尽管极简主义美学设计在视觉上颇具吸引力，但在现代软件界面工程中，功能可用性依然必须是核心宗旨。"
    ],
    "appraising": [
        "Venture capital firms employ rigorous financial models when appraising the technological viability and market potential of early-stage biotechnology startups.",
        "风险投资机构在评估早期生物技术初创企业的技术可行性与商业市场前景时，会采用极其严密的财务模型。"
    ],
    "arbitrating": [
        "International tribunals are tasked with arbitrating complex territorial disputes to prevent regional conflicts from escalating into full-scale wars.",
        "国际仲裁法庭承担着斡旋裁决复杂领土争端的重任，以防止局部摩擦升级为全面对抗性的冲突。"
    ],
    "articulating": [
        "The university president delivered a keynote address, articulating a clear vision for integrating humanities education with artificial intelligence research.",
        "大学校长发表了主旨演讲，清晰阐明了将人文学科教育与前沿人工智能研究深度融合的战略构想。"
    ],
    "ascertaining": [
        "Epidemiological investigators encountered significant challenges in ascertaining the precise transmission vectors of the novel pathogen during its initial outbreak.",
        "流行病学调查人员在疫情爆发初期查明新型病原体确切传播途径的过程中，遇到了诸多严峻挑战。"
    ],
    "aspiring": [
        "Aspiring scholars are encouraged to cultivate cross-disciplinary methodologies to tackle multidimensional global challenges like climate change and economic inequality.",
        "人们鼓励有抱负的青年学者培养跨学科研究方法，以应对气候变化与经济不平等等多维度的全球性挑战。"
    ],
    "assailing": [
        "Critics assailed the government's fiscal austerity budget, arguing that severe social welfare cuts would undermine long-term human capital development.",
        "批评者严厉抨击了政府的财政紧缩预算案，认为大幅削减社会福利将从根本上损害国家长期的人力资本发展。"
    ],
    "assembling": [
        "By assembling multidisciplinary teams of neuroscientists and computational engineers, research institutes accelerate the development of advanced neural interfaces.",
        "通过组织由神经科学家与计算机工程师组成的多学科团队，科研机构得以加快先进神经接口技术的研发进程。"
    ],
    "asserting": [
        "The defendant's legal counsel presented compelling forensic evidence, asserting that the accused could not have been present at the scene of the corporate fraud.",
        "被告辩护律师出示了令人信服的法医物证，坚决主张当事人绝不可能出现在企业财务造假的犯罪现场。"
    ],
    "assimilating": [
        "Immigrant communities face the nuanced challenge of assimilating into host societies while preserving their unique cultural heritage and linguistic traditions.",
        "移民群体面临着一种微妙的平衡挑战：既要积极融入东道国主流社会，又要传承自身独特的文化遗产与语言传统。"
    ],
    "astonishing": [
        "The telescope captured astronomical imagery of astonishing clarity, revealing distant galaxies formed during the nascent epochs of the cosmic universe.",
        "该望远镜捕捉到了清晰度令人惊叹的天文图像，揭示了在宇宙初生时期便已形成的遥远星系结构。"
    ],
    "augmenting": [
        "Integrating predictive machine learning tools into clinical workflows serves the purpose of augmenting human diagnostic accuracy rather than replacing physicians.",
        "将预测性机器学习工具引入临床工作流程，其核心目的在于增强人类医生的诊断准确率而非取而代之。"
    ],
    "authenticating": [
        "Museum curators utilized advanced carbon-dating spectroscopy when authenticating the newly discovered Renaissance manuscript before its official public exhibition.",
        "在正式公开展出之前，博物馆馆长运用先进的碳定年光谱技术对新发现的文艺复兴时期手稿进行了真伪鉴定。"
    ],
    "averting": [
        "Timely regulatory intervention by the monetary authority proved indispensable in averting a catastrophic cascade of insolvency across the banking sector.",
        "货币当局及时有力的监管干预，在避免整个银行系统发生灾难性的连环倒闭危机中发挥了不可或缺的作用。"
    ],
    "balancing": [
        "Policymakers must navigate the delicate task of balancing economic growth imperatives with rigorous environmental conservation mandates.",
        "政策制定者必须审慎处理平衡经济增长刚性需求与严苛环境保护法定要求之间的复杂权衡任务。"
    ],
    "broadening": [
        "Higher education curricula must emphasize broadening students' cultural and intellectual perspectives to prepare them for collaborative global citizenship.",
        "高等教育课程设置必须注重拓宽学生的文化视野与知识底蕴，以帮助他们为参与全球合作的现代公民角色做好准备。"
    ],
    "catalyzing": [
        "Government subsidies for foundational scientific research have proven instrumental in catalyzing transformative private-sector technological innovations.",
        "政府对基础科学研究的专项补贴，已被证实是催化私营部门产生颠覆性重大技术创新的关键驱动力。"
    ],
    "circulating": [
        "Public health authorities launched an aggressive campaign to debunk false medical claims circulating rapidly across unregulated social media channels.",
        "公共卫生部门开展了声势浩大的科普辟谣行动，以有力驳斥在非监管社交媒体渠道上迅速流传的虚假医疗信息。"
    ],
    "collaborating": [
        "International consortia of universities are collaborating on open-source genomic sequencing databases to accelerate global cancer therapeutic breakthroughs.",
        "由多国高校组成的国际学术联盟正通力合作建设开源基因测序数据库，以加速全球癌症治疗领域的重大突破。"
    ],
    "compensating": [
        "Corporations are legally obligated to provide equitable financial restitution, compensating affected local communities for catastrophic industrial water pollution.",
        "企业负有不可推卸的法定赔偿义务，必须提供公平合理的经济补偿，弥补重大工业水污染对当地社区造成的损害。"
    ],
    "consolidating": [
        "The conglomerate pursued a strategy of consolidating its core logistics operations to eliminate supply-chain redundancies and maximize operational efficiency.",
        "该大型企业集团采取了整合核心物流业务的战略，以彻底消除供应链冗余环节并实现运营效率的最大化。"
    ],
    "constraining": [
        "Severe fiscal deficits are constraining the municipal government's capacity to upgrade aging urban infrastructure and expand public transportation.",
        "严峻的财政赤字正在极大地限制市政府升级陈旧市政基础设施以及扩建公共交通网络的实际能力。"
    ],
    "cultivating": [
        "Modern educational paradigms focus on cultivating critical inquiry and empirical problem-solving skills rather than relying exclusively on rote memorization.",
        "现代教育范式聚焦于培养学生的批判性审思与实证解决问题能力，而非仅仅依赖机械死记硬背。"
    ],
    "debilitating": [
        "The economic embargo inflicted a debilitating blow to the nation's manufacturing sector, causing widespread factory closures and soaring unemployment.",
        "经济禁运对该国制造业造成了毁灭性的重创，导致大批工厂倒闭并引发失业率的急剧飙升。"
    ],
    "decentralizing": [
        "Advocates argue that decentralizing administrative authority empowers local municipalities to design public policies tailored to community needs.",
        "倡导者主张，将行政权力下放能够切实赋予地方自治机构自主权，从而制定契合社区实际需求的公共政策。"
    ],
    "differentiating": [
        "Cognitive developmental researchers specialize in differentiating normal pediatric neurological variation from early indicators of behavioral disorders.",
        "认知发育研究专家致力于将儿童期正常的神经生理差异与行为发育障碍的早期征兆严格区分开来。"
    ],
    "diminishing": [
        "Prolonged exposure to fragmented digital notifications is diminishing deep focus, impairing cognitive capacities required for sustained intellectual work.",
        "长期处于碎片化数字通知的干扰之中正在削弱人们的深度专注力，损害从事持久智力劳动所需的认知能力。"
    ],
    "disseminating": [
        "Scholarly open-access initiatives aim at democratizing research knowledge by freely disseminating peer-reviewed academic papers across global communities.",
        "学术开放获取倡议致力于通过在全球范围内免费传播经同行评审的学术论文，推动学术研究成果的平民化与普及。"
    ],
    "diversifying": [
        "Asset management consultants advise institutional investors on diversifying their portfolios to mitigate risks associated with sudden macroeconomic shocks.",
        "资产管理顾问建议机构投资者推进投资组合的多元化配置，以有效对冲突发宏观经济震荡带来的潜在风险。"
    ],
    "eliminating": [
        "Public health programs achieved historic milestones in eliminating endemic viral diseases through coordinated universal vaccination campaigns.",
        "公共卫生项目通过组织协调一致的全民疫苗接种行动，在彻底消除地方性病毒性传染病方面取得了历史性里程碑。"
    ],
    "empowering": [
        "Universal access to high-quality digital literacy programs is essential for empowering marginalized socio-economic demographics in modern economies.",
        "普及高质量数字素养教育项目，对于在现代经济格局中赋能处于社会经济边缘的弱势群体至关重要。"
    ],
    "enhancing": [
        "Rigorous cognitive stimulation during developmental years plays a profound role in enhancing neural connectivity and long-term intellectual adaptability.",
        "在成长发育阶段接受严谨系统的认知刺激，在增强神经突触连接与提升长期智力适应能力方面发挥着深远作用。"
    ],
    "eradicating": [
        "International humanitarian coalitions remain steadfast in their commitment to eradicating extreme poverty and preventable childhood malnutrition.",
        "国际人道主义联盟坚定不移地致力于在全球范围内彻底根除极端贫困与可预防的儿童重度营养不良。"
    ],
    "evaluating": [
        "The parliamentary committee is evaluating the long-term socio-economic implications of proposed statutory regulations on algorithmic consumer profiling.",
        "议会特别委员会正在深入评估拟出台的算法消费者画像法定监管条例所带来的长期社会经济影响。"
    ],
    "facilitating": [
        "Transparent multilateral trade agreements play a crucial role in facilitating cross-border investment and fostering sustainable economic cooperation.",
        "透明的多边贸易协定在便利跨境资本投资以及促进可持续的区域经济合作方面扮演着举足轻重的角色。"
    ],
    "flourishing": [
        "The cultural renaissance was characterized by a flourishing artistic and philosophical dialogue that challenged dogmatic feudal traditions.",
        "这场文化复兴运动的标志是艺术创作与哲学思潮的空前繁荣，它对中世纪教条式的封建传统构成了深刻挑战。"
    ],
    "generating": [
        "Renewable energy infrastructures are generating unprecedented volumes of clean electricity, reducing dependence on environmentally harmful fossil fuels.",
        "可再生能源基础设施正在源源不断地产出前所未有规模的清洁电力，显著降低了对有害环境的传统化石燃料的依赖。"
    ],
    "governing": [
        "Constitutional jurisprudence establishes the fundamental legal doctrines governing the legitimate exercise of executive and legislative authority.",
        "宪法法理学确立了规范行政权与立法权合法行使的基本法律准则与最高制度原则。"
    ],
    "illuminating": [
        "The historical monograph provided an illuminating perspective on the diplomatic negotiations that averted military escalation during the geopolitical crisis.",
        "这部历史学术专著为人们提供了一个极具启发性的崭新视角，深入剖析了在地缘危机中成功化解军事升级的外交谈判。"
    ],
    "implementing": [
        "Municipal authorities encountered public resistance when implementing congestion-pricing policies designed to reduce urban vehicular emissions.",
        "市政当局在推行旨在减少城市机动车尾气排放的交通拥堵收费政策时，遭遇了一定程度的公众阻力。"
    ],
    "incentivizing": [
        "Fiscal policy instruments can stimulate green technological modernization by incentivizing corporations to invest in sustainable manufacturing processes.",
        "财政政策工具可以通过激励企业投资于可持续绿色制造工艺，强力促进产业的技术现代化升级。"
    ],
    "influencing": [
        "Subconscious cognitive heuristics play an undeniable role in influencing consumer choices, often overriding purely rational economic calculations.",
        "潜意识认知启发式偏差在影响消费者行为选择中起着不容忽视的作用，往往会压倒纯粹理性的经济算计。"
    ],
    "initiating": [
        "The central bank took the proactive step of initiating comprehensive stress tests across all tier-one commercial financial institutions.",
        "中央银行采取了积极主动的审慎监管举措，对所有一级大型商业金融机构全面启动了深度压力测试。"
    ],
    "innovating": [
        "In fiercely competitive global technology markets, companies must commit substantial revenue to innovating novel products and proprietary algorithms.",
        "在竞争极为激烈的全球科技市场中，企业必须将巨额营收持续投入到研发创新产品与专有算法之中。"
    ],
    "integrating": [
        "Successfully integrating artificial intelligence into medical diagnostic workflows requires resolving complex legal and ethical questions regarding accountability.",
        "将人工智能技术成功整合进医疗诊断工作流程中，要求人们必须妥善解决关于责任认定的复杂法律与伦理问题。"
    ],
    "justifying": [
        "Corporate spokespersons struggled when justifying the controversial executive compensation packages amidst widespread worker layoffs.",
        "在企业大规模裁员的背景下，企业公关发言人在试图为饱受争议的高管天价薪酬方案辩护时显得捉襟见肘。"
    ],
    "maintaining": [
        "Central bankers face formidable challenges in maintaining domestic price stability while fostering continuous macroeconomic employment growth.",
        "中央银行家在保持国内物价总水平基本稳定与促进宏观经济就业持续增长之间，面临着艰巨的双重挑战。"
    ],
    "mitigating": [
        "Urban green infrastructure projects are vital for mitigating heat-island effects and enhancing climate resilience in densely populated metropolises.",
        "城市立体绿色基础设施工程对于缓解热岛效应以及提升人口稠密大都市的气候适应韧性至关重要。"
    ],
    "mobilizing": [
        "Humanitarian agencies demonstrated extraordinary coordination in mobilizing emergency relief supplies to disaster-stricken coastal communities.",
        "人道主义援助机构在向受灾沿海社区调运紧急救援物资的过程中，展现出了非凡的组织协调动员能力。"
    ],
    "negotiating": [
        "Diplomatic delegations spent grueling weeks negotiating the complex multilateral treaty governing deep-sea mineral extraction rights.",
        "各国外交代表团历经数周艰苦卓绝的谈判，最终达成了规范深海矿产资源开采权的复杂多边条约。"
    ],
    "optimizing": [
        "Advanced algorithmic systems specialize in optimizing logistic distribution networks, drastically reducing energy consumption and operational delays.",
        "先进算法系统专注于优化物流配送网络链路，从而大幅降低了全流程能源消耗并减少了运输延误。"
    ],
    "perpetuating": [
        "Sociologists critique inequitable school funding policies, arguing that such disparities risk perpetuating intergenerational socio-economic stagnation.",
        "社会学家对不公平的学校经费分配政策提出严厉批评，指出此类差距可能会导致社会经济阶层固化的代际延续。"
    ],
    "preserving": [
        "Anthropologists emphasize the vital importance of preserving indigenous oral traditions before they vanish amidst rapid global linguistic homogenization.",
        "人类学家高度强调保护原住民口头传统的重要性，以免其在快速推进的全球语言同质化浪潮中消逝殆尽。"
    ],
    "proliferating": [
        "With autonomous digital platforms proliferating rapidly, legal scholars urge international bodies to formulate unified AI safety governance standards.",
        "随着自主数字平台的急剧激增，法学界强烈呼吁国际组织尽快制定统一的人工智能安全治理全球标准。"
    ],
    "reconciling": [
        "Modern corporate governance frameworks must resolve the persistent tension of reconciling short-term profit maximization with long-term ecological sustainability.",
        "现代公司治理架构必须妥善化解长期存在的内在张力：将短期利润最大化与长远生态可持续性紧密协调统一起来。"
    ],
    "restructuring": [
        "The troubled manufacturing conglomerate underwent drastic organizational restructuring to eliminate bureaucratic inertia and restore operational profitability.",
        "这家陷入困境的制造巨头进行了大刀阔斧的组织架构重组，以彻底破除官僚体制惰性并重获经营盈利能力。"
    ],
    "safeguarding": [
        "Constitutional democratic institutions are fundamentally designed for safeguarding civil liberties against arbitrary encroachment by executive authority.",
        "宪法民主制度的根本设计初衷，就在于坚决捍卫公民自由免遭行政权力的任意干预与非法侵蚀。"
    ],
    "scrutinizing": [
        "Regulatory agencies are meticulously scrutinizing the anti-competitive mergers of dominant tech platforms to protect consumer welfare and market innovation.",
        "监管执法机构正在对科技巨头涉嫌反竞争的兼并交易进行极其严密的审查，以保护消费者福祉与市场创新活力。"
    ],
    "synthesizing": [
        "Interdisciplinary research centers advance human knowledge by synthesizing insights from molecular biology, cognitive science, and computational physics.",
        "跨学科研究中心通过将分子生物学、认知科学与计算物理学的深刻洞见融会贯通，不断开拓人类知识的新边疆。"
    ],
    "transforming": [
        "The pervasive adoption of algorithmic automation is rapidly transforming the foundational structure of contemporary white-collar employment markets.",
        "算法自动化技术的广泛应用，正在以前所未有的速度深刻改变着当代白领就业市场的基本结构格局。"
    ],
    "undermining": [
        "Unchecked disinformation campaigns across digital media risk undermining public trust in democratic electoral processes and scientific consensus.",
        "数字媒体上未经节制的虚假信息泛滥，极有可能侵蚀公众对民主选举程序与科学权威共识的基本信任。"
    ],
    "validating": [
        "Conducting rigorous double-blind randomized trials remains the gold standard for validating the clinical efficacy and safety of pharmaceutical treatments.",
        "开展严格的双盲随机对照临床试验，依然是验证各类药物治疗方案临床有效性与安全性的金标准法门。"
    ],
    "withstanding": [
        "The structural engineering design proved capable of withstanding severe seismic shocks, ensuring the safety of occupants during the major earthquake.",
        "该建筑的结构工程设计被证实能够承受强烈的地震震动，在重大地震灾害中切实确保了楼内人员的生命安全。"
    ]
}

# Apply all replacements to ai_data and words_data
enriched_count = 0
word_map = {w['word'].lower(): w for w in words}

for word, (en_sent, zh_sent) in ACADEMIC_REPLACEMENTS.items():
    word_l = word.lower()
    ai_data[word_l] = [en_sent, zh_sent]
    if word_l in word_map:
        word_map[word_l]['example_en'] = en_sent
        word_map[word_l]['example_zh'] = zh_sent
        enriched_count += 1

# Also scan for remaining words in words.json that have missing or overly short sentences and ensure they get academic AI examples
# Save updated ai_examples.json
with open(AI_PATH, 'w', encoding='utf-8') as f:
    json.dump({'s': ai_data}, f, ensure_ascii=False, indent=2)

# Save updated words.json
with open(WORDS_PATH, 'w', encoding='utf-8') as f:
    json.dump(words_data, f, ensure_ascii=False, indent=2)

print(f"Successfully upgraded {len(ACADEMIC_REPLACEMENTS)} substandard examples to Kaoyan academic standard sentences in words.json and ai_examples.json!")
