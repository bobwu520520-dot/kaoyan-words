# 考研词汇 · 英语一分层词库（6013 词）

纯静态网站：分层词库 + 间隔重复背诵 + 查词 + AI 例句（内置 DeepSeek Key，开箱即用）。无需构建，无需后端。

## 访问说明

网站为私享版，访问需输入密码（向分享者获取，输入一次后本机浏览器记住，无需重复输入）。AI 服务已内置（Worker 代理 + 自动回退），开箱即用。

## 两种使用方式

| 方式 | 说明 |
|---|---|
| **桌面版 App**（推荐） | Windows 64 位，解压双击 `考研词汇.exe` 即用，零依赖、离线可用、数据自动保存 |
| **网页版** | 部署到服务器或本地 HTTP 使用，支持 PWA 添加到主屏幕、离线缓存 |

## 如何运行（网页版）

**重要：请通过本地 HTTP 服务器打开，不要直接双击 HTML 文件。**
Chrome / Firefox 会拦截 `file://` 协议下对本地 JSON 的请求，直接双击会显示“词库加载失败”。

任选一种方式：

```bash
# 方式一：Python 自带服务器（在解压目录下运行）
python -m http.server 8000
# 浏览器访问 http://localhost:8000

# 方式二：VS Code 安装 Live Server 插件，右键 index.html → Open with Live Server

# 方式三：Node.js
npx serve .
```

推荐方式一，无需安装任何额外依赖。

## 三个页面

| 页面 | 说明 |
|---|---|
| `study.html` | 背单词：分层（核心高频 → 高频重点 → 重点扩展 → 普通扩展），3 键评分（陌生 30 分钟 / 模糊 1 天 / 认识 3 天，连续掌握自动升级 7/15/30/60 天），评分后自动显示释义例句；手机端墨墨风底部 Tab（背单词 / 考研词汇 / 词书 / 菜单），菜单含设置（背景切换 / 夜间模式 / 字号 / 发音 / 例句显示 / 每日目标）；进度保存在浏览器 localStorage，可导出/导入；页内可直接配置 AI |
| `index.html` | 查词：本地词库优先，缺释义/例句时回退 Free Dictionary API（Wiktionary，CC-BY-SA），支持 AI 造句 |
| `words.html` | 词库目录：字母索引、分层筛选、**数据完整度组合筛选**（有音标/词性/核心义/僻义/搭配/例句/词族/词形）、搜索，可多选 2-8 个词让 AI 生成一个包含全部目标词的考研英语句子 |

## 词库分层（6013 词）

| 层级 | 数量 | 说明 |
|---|---|---|
| 核心高频 | 1000 | 真题高优先级，必须熟练 |
| 高频重点 | 1567 | 阅读、完形、翻译重点（含 108 个补录基础高频词） |
| 重点扩展 | 2641 | 学术、社会、科技等主题词，全部含本地释义 |
| 普通扩展 | 805 | 低频与补全词，全部含本地释义，后期查漏补缺 |

**6013 词全部含本地中文释义**。每个词条包含：音标、词性、中文释义、**考研核心义（exam_meaning）**、**熟词僻义（secondary_meanings）**、例句、**高频搭配（collocation_hint）**、**词族/词形/同反义词/易混词（精选词）**、**数据完整度等级（quality_score）**等字段（完整字段规范见 DATA_QUALITY.md）。考研核心义与熟词僻义均为人工精选、词典可查实的义项；无法可靠判断的词不填，绝不伪造。查词详情页显示数据完整度徽章（如 `████████░░ 80% · B级`，与考频无关）。

## AI 功能（可选）

单词 AI 造句、AI 长难句 + 搭配、AI 多词造句需要 DeepSeek API Key：

1. 打开 `index.html`，点击右上角「AI 设置」；
2. 填入 API 地址（默认 `https://api.deepseek.com/v1`）、模型（默认 `deepseek-chat`）和 API Key；
3. 设置保存在浏览器本地（localStorage），AI 结果本地缓存，减少重复调用。

**安全提示**：Key 保存在浏览器中，仅供个人使用；不要将网站公开发布（别人可查看并盗用该 Key）。如需公开发布，建议通过 Cloudflare Worker 代理转发请求（见 `worker.js` 与下方「部署 AI 代理」）。

### 部署 AI 代理（推荐公开部署时使用）

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → 粘贴 `worker.js` 内容；
2. 在 Worker 设置中添加变量 `DEEPSEEK_API_KEY`（值为你的 DeepSeek Key）；
3. 前端「AI 设置」→ API 地址填 `https://你的worker名.workers.dev/v1`（或自定义域），**API Key 留空**；
4. 密钥只存在服务端，前端不再暴露 Key。

## 学习功能

- 四层进度独立；**四级评分**：不认识=当天再现（30 分钟），模糊=1 天，认识=3 天，很熟=7 天；同一词连续「认识/很熟」逐步延长到 15/30/60 天，失败后重置
- **队列优先级**：每组 100 词按「到期复习词 → 薄弱词 → 新词」安排（同优先级内部随机，不纯随机）
- **我的薄弱词**：自动记录多次错误（不认识 ≥3 次）、多次遗忘（连续不认识 ≥3 次）、到期仍不会的词；顶部显示数量，可一键「复习薄弱词」（旧版顽固词数据自动并入）
- **学习统计**：连续打卡天数 + 近 14 天每日完成柱状图
- **词库升级兼容**：数据带版本号；词库更新后自动清理已删除词的旧进度，并弹出提示
- **离线使用（PWA）**：首次联网打开后，Service Worker 缓存全站资源；之后无网络也能背诵和查词；手机浏览器可「添加到主屏幕」当 App 用
- 进度保存在 localStorage，刷新不丢失；可导出/导入（导入不覆盖当日统计）；损坏数据自动修复不崩溃

## 快捷键（背单词页）

- `Space`：显示释义
- `1`：不认识（当天再现）
- `2`：模糊（1 天）
- `3`：认识（3 天）
- `4`：很熟（7 天）
- 未显示释义时按 `1`-`4` 只会先显示释义，防止盲评

## 目录结构

```
├── index.html          # 查词页
├── study.html          # 背单词页
├── words.html          # 词库目录页
├── manifest.webmanifest # PWA 清单（添加到主屏幕）
├── sw.js               # Service Worker（离线缓存）
├── worker.js           # Cloudflare Worker 代理（AI Key 服务端化，可选部署）
├── icon-192.png        # PWA 图标
├── icon-512.png        # PWA 图标
├── css/style.css
├── js/
│   ├── app.js          # 查词页 + AI 配置 + 多词造句
│   ├── study.js        # 背单词逻辑
│   ├── catalog.js      # 词库目录逻辑
│   └── pwa.js          # Service Worker 注册
├── data/
│   ├── words.json      # 6013 词主词库（页面运行时唯一使用的数据）
│   ├── bank2000.json   # 构建输入：ECDICT 筛选的 2000 词
│   └── manual.json     # 构建输入：220 条人工核验词条
├── build_words.py      # 构建脚本：合并各数据源生成 words.json
├── build_bank.py       # 构建脚本：从 ecdict.csv 筛选 bank2000.json
├── merge_words.py      # 构建脚本（旧版 2000 词，供参考）
├── fetch_api.py        # 构建脚本：限速预取 Free Dictionary API
├── fetch_examples.py   # 例句批量抓取（Free Dictionary API，断点续跑）
├── clean_data.py       # 数据清洗：例句过滤、音标/释义修正、紧凑输出
├── junk_words.py       # 数据清洗：已删除垃圾词清单（人名/地名/公司名等，人工核验）
├── enrich_exam.py      # 数据增强：考研核心义 + 熟词僻义精选数据
├── enrich_ext.py       # 数据增强：重点扩展中文释义 + 补录基础高频词
├── ext_trans2.py       # 数据增强：重点扩展 624 词中文释义
├── ext_trans3.py       # 数据增强：普通扩展 633 词中文释义
├── test_study.js       # 背单词逻辑回归测试（node test_study.js，34 项）
└── DATA_QUALITY.md     # 数据质量说明
```

## 构建（可选，一般不需要）

数据已随包提供，直接使用即可。如需重新生成 `data/words.json`：

1. 准备 `ecdict.csv`（ECDICT 开源词库，https://github.com/skywind3000/ECDICT）；
2. `python build_bank.py` → 生成 `data/bank2000.json`；
3. `python fetch_api.py` → 预取音标与例句（限速 5 req/s，可反复运行续跑）；
4. `python merge_words.py`（旧 2000 词流程）或参考 `build_words.py` 的分层逻辑；
5. 最后 `python clean_data.py` 清洗并压缩。

## 数据与版权

- 音标与中文释义来自开源 [ECDICT](https://github.com/skywind3000/ECDICT)（MIT 协议）；
- 词库外单词及部分例句来自 [Free Dictionary API](https://dictionaryapi.dev)（Wiktionary，CC-BY-SA）；
- AI 内容按需生成，仅供学习参考。
