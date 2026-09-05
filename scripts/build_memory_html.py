import re

memory_html = '''<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>我的 · 考研数据中心与个性化设置</title>
  <meta name="description" content="考研英语（一）大纲数据中心，手机系统设置式三级层级导航，学习统计、生词本、学习记录与系统偏好。" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <link rel="manifest" href="manifest.webmanifest" />
  <meta name="theme-color" content="#1d5a63" />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231d5a63' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E" />
  <style>
    .due-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; text-align: center; }
    .due-cell { background: var(--color-surface-offset); border-radius: 10px; padding: 8px 4px; }
    .due-cell b { display: block; font-size: 15px; color: var(--color-text); }
    .due-cell.hot b { color: var(--color-primary); }
    .due-cell span { font-size: 11px; color: var(--color-text-muted); }
    .dist { display: flex; align-items: flex-end; gap: 8px; height: 130px; padding: 0 4px; }
    .dist .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .dist .bar i { display: block; width: 100%; max-width: 42px; background: var(--color-core-soft); border-radius: 6px 6px 0 0; position: relative; transition: height .3s; }
    .dist .bar.cur i { background: var(--color-primary); }
    .dist .bar em { font-style: normal; font-size: 10px; color: var(--color-text-muted); }
    .dist .bar u { text-decoration: none; font-size: 11.5px; color: var(--color-text); font-weight: 600; }
    .weak-list { display: flex; flex-direction: column; }
    .weak-item { display: flex; align-items: center; gap: 8px; padding: 8px 6px; border-bottom: 1px solid var(--color-divider); text-decoration: none; color: var(--color-text); }
    .weak-item:last-child { border-bottom: none; }
    .weak-item:hover { background: var(--color-surface-offset); }
    .weak-item .w { font-weight: 700; min-width: 100px; font-size: 13.5px; }
    .weak-item .t { flex: 1; font-size: 12px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .weak-item .c { flex: none; font-size: 11px; color: #ef4444; background: rgba(239,68,68,0.12); border-radius: 999px; padding: 2px 8px; font-weight: 700; }
    .legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 8px; font-size: 11.5px; color: var(--color-text-muted); }
    .legend i { display: inline-block; width: 16px; height: 4px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
    .legend .l1 i { background: var(--color-accent); }
    .legend .l2 i { background: var(--color-primary); }
    .legend .l3 i { background: var(--color-text-faint); }
    .grid-stats-box { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 10px 0; }
    .stat-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 10px 8px; text-align: center; }
    .stat-card b { font-size: 16px; display: block; line-height: 1.25; color: var(--color-text); }
    .stat-card b.em { color: var(--color-primary); }
    .stat-card span { color: var(--color-text-muted); font-size: 11px; margin-top: 2px; display: block; }
    @media(max-width:600px){
      .grid-stats-box { grid-template-columns: repeat(3, 1fr); }
      .due-row { grid-template-columns: repeat(5, 1fr); }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#mem-view-home">跳到主内容</a>

  <header class="site-header" style="background:var(--color-surface);border-bottom:1px solid var(--color-border);position:sticky;top:0;z-index:90">
    <div class="header-inner" style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px">
      <div class="site-header-title-box" style="display:flex;align-items:center;gap:8px;min-width:0;flex:1 1 auto;overflow:hidden">
        <span class="site-header-title" style="font-size:16px;font-weight:800;color:var(--color-text);white-space:nowrap;flex-shrink:0">👤 我的数据中心</span>
        <span class="cat-chip tier site-header-badge" style="font-size:11px;padding:2px 8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:1">个人设置与统计</span>
      </div>
      <div class="site-header-actions" style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:8px">
        <button class="theme-toggle" data-theme-toggle aria-label="切换到深色模式" type="button"></button>
        <button class="nav-menu-toggle-btn" id="mem-menu-toggle" data-nav-menu-toggle type="button" title="☰ 考研导航菜单">☰</button>
      </div>
    </div>
  </header>

  <!-- 顶部考研导航菜单下拉收纳盒 -->
  <div id="mem-top-nav-box" class="unified-nav-dropdown-card" data-nav-menu-box hidden>
    <div style="font-size:11.5px;font-weight:700;color:var(--color-text-muted);margin-bottom:8px">🎯 考研核心模块直达</div>
    <div class="unified-nav-grid-pills">
      <a class="nav-grid-pill" href="study.html">📖 智能背单词</a>
      <a class="nav-grid-pill" href="exam.html">📝 英一题型工坊</a>
      <a class="nav-grid-pill" href="words.html">📚 考研词库检索</a>
      <a class="nav-grid-pill active" href="memory.html">👤 我的数据中心</a>
    </div>
    <div style="height:1px;background:var(--color-border);margin:10px 0"></div>
    <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-bottom:6px">⚡ 快捷工具</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <a class="nav-grid-pill" href="study.html" style="flex:1">⚡ 立即开始背词</a>
      <a class="nav-grid-pill" href="words.html#list/core" style="flex:1">⭐ 核心高频词库</a>
    </div>
  </div>

  <main class="tier-app-container">
    <!-- ======================================================= -->
    <!-- 第一级：个人中心首页 (Tier 1: 个人数据概览与设置列表) -->
    <!-- ======================================================= -->
    <section class="tier-view active" id="mem-view-home">
      <div style="padding: 12px 14px 20px">
        <!-- 用户数据概览 Hero 卡片 (头像/昵称 + 打卡天数 + 已掌握词数 + 倒计时) -->
        <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="icon-192.png" alt="金毛背单词" style="width:48px;height:48px;border-radius:12px;object-fit:cover;border:2px solid var(--color-primary);box-shadow:0 2px 8px rgba(0,0,0,0.08)">
            <div>
              <div style="display:flex;align-items:center;gap:6px">
                <strong style="font-size:15px;color:var(--color-text)">考研上岸 · 金毛伴学</strong>
                <span style="font-size:10.5px;font-weight:700;background:color-mix(in oklab, var(--color-primary) 15%, transparent);color:var(--color-primary);padding:2px 6px;border-radius:999px">PRO 旗舰版</span>
              </div>
              <p style="margin:3px 0 0;font-size:11.5px;color:var(--color-text-muted)">考研英语（一）5,619 词大纲 · 艾宾浩斯智能记忆调度</p>
            </div>
          </div>
          <div class="countdown-badge" style="background:var(--color-surface-offset);border:1px solid var(--color-border);padding:6px 12px;border-radius:10px;display:inline-flex;align-items:center;gap:6px">
            <span style="font-size:11.5px;color:var(--color-text-muted)">🎯 距初试</span>
            <b style="font-size:17px;color:var(--color-primary)" id="kaoyan-days">--</b>
            <span style="font-size:11px;color:var(--color-text-muted)">天</span>
          </div>
        </div>

        <!-- 3 大核心数字快览条 -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:10px;text-align:center;box-shadow:var(--shadow-sm)">
            <span style="font-size:11px;color:var(--color-text-muted)">连续打卡</span>
            <b style="font-size:17px;display:block;color:var(--color-primary);margin-top:2px" id="s-streak">-- 天</b>
          </div>
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:10px;text-align:center;box-shadow:var(--shadow-sm)">
            <span style="font-size:11px;color:var(--color-text-muted)">已掌握词数</span>
            <b style="font-size:17px;display:block;color:var(--color-text);margin-top:2px" id="s-mastered">--</b>
          </div>
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:10px;text-align:center;box-shadow:var(--shadow-sm)">
            <span style="font-size:11px;color:var(--color-text-muted)">已学总词量</span>
            <b style="font-size:17px;display:block;color:var(--color-text);margin-top:2px" id="s-total">--</b>
          </div>
        </div>

        <!-- 每日萌犬伴学打卡与签到中心 -->
        <div class="panel checkin-panel" id="daily-checkin-panel" style="margin-bottom:14px;border-radius:14px;padding:14px 16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div>
              <div style="font-size:14px;margin:0;color:var(--color-text);font-weight:800;display:flex;align-items:center;gap:6px">
                <span style="font-size:18px">🐾</span> 每日伴学萌犬 · 手动签到
              </div>
              <p style="margin:2px 0 0;font-size:11.5px;color:var(--color-text-muted)">每日签到领专属学伴犬（金毛/边牧/萨摩耶 30款大头照）</p>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="badge" style="background:color-mix(in oklab, var(--color-primary) 14%, transparent);color:var(--color-primary);font-weight:700;font-size:11.5px;padding:3px 8px;border-radius:999px" id="checkin-streak-badge">连续 0 天</span>
            </div>
          </div>
          <!-- 今日签到卡片 -->
          <div id="checkin-today-card" style="background:var(--color-surface-offset);border:1px solid var(--color-border);border-radius:12px;padding:12px 14px">
            <!-- 由 js/memory.js 动态填充 -->
          </div>
        </div>

        <div style="font-size:12px;font-weight:700;color:var(--color-text-muted);margin:0 0 8px 4px">⚙️ 个人中心与功能设置</div>

        <!-- 手机系统设置风格列表群组 (高度 56px，图标 24px，右箭头 ›) -->
        <div class="settings-list-group">
          <!-- 1. 学习统计 -->
          <a class="settings-nav-item" href="#stats">
            <div class="sni-left">
              <span class="sni-icon">📊</span>
              <div class="sni-info">
                <span class="sni-title">学习统计</span>
                <span class="sni-desc">连续打卡天数、近14天柱状图、掌握进度、薄弱词数量</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge" id="menu-badge-stats">查看看板</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 2. 生词本 -->
          <a class="settings-nav-item" href="#favs">
            <div class="sni-left">
              <span class="sni-icon">⭐</span>
              <div class="sni-info">
                <span class="sni-title">专属生词本</span>
                <span class="sni-desc">查词与背词时随手收藏的生词、支持词条详解与专项消灭</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge" id="menu-badge-favs">0 词</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 3. 学习记录/历史 -->
          <a class="settings-nav-item" href="#history">
            <div class="sni-left">
              <span class="sni-icon">📅</span>
              <div class="sni-info">
                <span class="sni-title">学习记录与足迹</span>
                <span class="sni-desc">按日期倒序的历史记录、每天完成词数与萌犬足迹</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge">每日明细</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 4. 背词偏好设置 -->
          <a class="settings-nav-item" href="#settings-study">
            <div class="sni-left">
              <span class="sni-icon">🎯</span>
              <div class="sni-info">
                <span class="sni-title">背词偏好设置</span>
                <span class="sni-desc">每日目标词量、目标考年、大纲出词范围、智能乱序算法</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge" id="menu-badge-study-goal">每日 30 词</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 5. 发音与触感设置 -->
          <a class="settings-nav-item" href="#settings-audio">
            <div class="sni-left">
              <span class="sni-icon">🔊</span>
              <div class="sni-info">
                <span class="sni-title">发音与触感设置</span>
                <span class="sni-desc">英美口音切换、语速滑块调节、自动朗读、振动触感反馈</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge">美音 · 0.92x</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 6. 界面外观设置 -->
          <a class="settings-nav-item" href="#settings-display">
            <div class="sni-left">
              <span class="sni-icon">🎨</span>
              <div class="sni-info">
                <span class="sni-title">界面外观设置</span>
                <span class="sni-desc">主题配色（浅色/深色/纯黑OLED）、字号大小、遮挡模式</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge">自适应</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 7. 数据备份与恢复 -->
          <a class="settings-nav-item" href="#settings-backup">
            <div class="sni-left">
              <span class="sni-icon">💾</span>
              <div class="sni-info">
                <span class="sni-title">数据备份与恢复</span>
                <span class="sni-desc">6位跨设备云端免密同步码、JSON 文件导出与恢复、清空重置</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge">本地安全</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>

          <!-- 8. 关于与大纲版本 -->
          <a class="settings-nav-item" href="#settings-about">
            <div class="sni-left">
              <span class="sni-icon">ℹ️</span>
              <div class="sni-info">
                <span class="sni-title">关于与大纲版本</span>
                <span class="sni-desc">版本 v9.65 · 考研 5,619 词大纲说明 · 30 款萌犬大头照图鉴</span>
              </div>
            </div>
            <div class="sni-right">
              <span class="sni-badge">v9.65</span>
              <span class="sni-arrow">›</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- ======================================================= -->
    <!-- 第二级：各功能详情页 (Tier 2: 子功能/设置视图) -->
    <!-- ======================================================= -->
    <section class="tier-view" id="mem-view-sub">
      <div class="tier-header">
        <button class="tier-back-btn" id="mem-sub-back-btn" type="button">‹ 返回</button>
        <span class="tier-header-title" id="mem-sub-header-title">功能详情</span>
        <div class="tier-header-action">
          <span id="mem-sub-badge" class="sni-badge"></span>
        </div>
      </div>

      <div style="padding: 12px 14px 20px" id="mem-sub-content-box">
        <!-- 1. 学习统计子视图 (#sub-stats) -->
        <div class="mem-sub-pane" id="sub-stats-pane" style="display:none">
          <div class="grid-stats-box">
            <div class="stat-card"><b class="em" id="st-total">—</b><span>已学总词</span></div>
            <div class="stat-card"><b id="st-mastered">—</b><span>已掌握</span></div>
            <div class="stat-card"><b id="st-streak">—</b><span>连续打卡</span></div>
            <div class="stat-card"><b id="st-retention">—</b><span>复习完成率</span></div>
            <div class="stat-card"><b id="st-weak">—</b><span>薄弱词</span></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">📈 艾宾浩斯遗忘与保持曲线</h3>
            <p style="color:var(--color-text-muted);font-size:11.5px;margin:0 0 10px">按 1 → 3 → 7 → 15 → 30 → 60 天安排智能复习，有效拉回记忆</p>
            <div id="curve-box" style="width:100%;overflow-x:auto"></div>
            <div class="legend"><span class="l1"><i></i>自然遗忘</span><span class="l2"><i></i>本应用复习保持</span><span class="l3"><i></i>复习点</span></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">📊 记忆等级分布</h3>
            <p style="color:var(--color-text-muted);font-size:11.5px;margin:0 0 10px">按记忆熟练度递进：0级（生疏）➔ 4级以上（已掌握）</p>
            <div class="dist" id="dist"></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">⏰ 到期复习日程</h3>
            <p style="color:var(--color-text-muted);font-size:11.5px;margin:0 0 10px">按每词下次到期时间统计，背单词页面自动优先调度</p>
            <div class="due-row" id="due-row"></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">🔥 重点薄弱词排行榜（点击查看详情）</h3>
            <p style="color:var(--color-text-muted);font-size:11.5px;margin:0 0 10px">多次忘记或评分较低的词汇汇总</p>
            <div class="weak-list" id="weak-list"></div>
          </div>
        </div>

        <!-- 2. 生词本子视图 (#sub-favs) -->
        <div class="mem-sub-pane" id="sub-favs-pane" style="display:none">
          <div style="margin-bottom:10px">
            <input id="favs-search-input" type="search" placeholder="在生词本中过滤搜索..." style="width:100%;box-sizing:border-box;height:40px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);padding:0 12px;font-size:13px;color:var(--color-text);outline:none" />
          </div>
          <div class="tier2-word-list" id="favs-word-list">
            <!-- 动态渲染生词本单词列表 -->
          </div>
        </div>

        <!-- 3. 学习记录子视图 (#sub-history) -->
        <div class="mem-sub-pane" id="sub-history-pane" style="display:none">
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">📅 近 30 天背词活跃度趋势</h3>
            <p style="color:var(--color-text-muted);font-size:11.5px;margin:0 0 12px">柱高代表每日完成词数，主题色代表今天</p>
            <div class="bars" id="bars" style="display:flex;align-items:flex-end;gap:4px;height:90px"></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;margin-bottom:12px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 4px;font-size:14.5px;color:var(--color-text)">🐾 近 7 日打卡萌犬足迹</h3>
            <div class="checkin-trail-grid" id="checkin-trail-grid" style="margin-top:8px"></div>
          </div>

          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:14px 16px;box-shadow:var(--shadow-sm)">
            <h3 style="margin:0 0 8px;font-size:14.5px;color:var(--color-text)">📜 历史打卡日志明细</h3>
            <div id="history-log-list"></div>
          </div>
        </div>

        <!-- 4. 背词偏好设置子视图 (#sub-settings-study) -->
        <div class="mem-sub-pane" id="sub-settings-study-pane" style="display:none">
          <div class="sub-settings-card">
            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">每日新词量</span>
                <span class="ssr-desc">每天计划学习的新词目标量</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" data-set-daily="20" type="button">20</button>
                <button class="nav-btn" data-set-daily="30" type="button">30</button>
                <button class="nav-btn" data-set-daily="50" type="button">50</button>
                <button class="nav-btn" data-set-daily="80" type="button">80</button>
                <button class="nav-btn" data-set-daily="100" type="button">100</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">目标统考年份</span>
                <span class="ssr-desc">关联倒计时与大纲考频加权</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-examyear="2026" type="button">2026 统考</button>
                <button class="nav-btn" data-set-examyear="2027" type="button">2027 统考</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">默认出词范围</span>
                <span class="ssr-desc">背单词时优先调取的词库梯队</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-corpushierarchy="all" type="button">全大纲</button>
                <button class="nav-btn" data-set-corpushierarchy="core" type="button">高频核心</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">出词排序模式</span>
                <span class="ssr-desc">智能乱序或高频优先排列</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-studyorder="random" type="button">🎲 智能乱序</button>
                <button class="nav-btn" data-set-studyorder="freq" type="button">🔥 考频优先</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">复习调度节奏</span>
                <span class="ssr-desc">艾宾浩斯复现时间间隔算法</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-ebbpaces="standard" type="button">经典标准</button>
                <button class="nav-btn" data-set-ebbpaces="sprint" type="button">考前冲刺</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">忘记自动入生词本</span>
                <span class="ssr-desc">左滑标记「需重背」时自动收藏</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-autofav="1" type="button">开启</button>
                <button class="nav-btn" data-set-autofav="0" type="button">关闭</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. 发音与触感设置子视图 (#sub-settings-audio) -->
        <div class="mem-sub-pane" id="sub-settings-audio-pane" style="display:none">
          <div class="sub-settings-card">
            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">真题朗读口音</span>
                <span class="ssr-desc">美式发音或英式正统口音</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" data-set-lang="en-US" type="button">🇺🇸 美音</button>
                <button class="nav-btn" data-set-lang="en-GB" type="button">🇬🇧 英音</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">发音播放语速</span>
                <span class="ssr-desc">慢速精听至常速磨耳朵档位</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" data-set-rate="0.75" type="button">0.75x</button>
                <button class="nav-btn" data-set-rate="0.92" type="button">0.92x</button>
                <button class="nav-btn" data-set-rate="1.0" type="button">1.0x</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">切词自动发音</span>
                <span class="ssr-desc">翻到新单词卡片时自动朗读音频</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-autopronounce="1" type="button">开启</button>
                <button class="nav-btn" data-set-autopronounce="0" type="button">关闭</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">触觉振动反馈</span>
                <span class="ssr-desc">左右滑动评分时触发微触感振动</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-haptic="1" type="button">开启</button>
                <button class="nav-btn" data-set-haptic="0" type="button">关闭</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">长难词慢读试听</span>
                <span class="ssr-desc">点击测试当前发音引擎与声道效果</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" id="mem-audition-btn" type="button" style="color:var(--color-primary);font-weight:700">▶️ 试听发音</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. 界面外观设置子视图 (#sub-settings-display) -->
        <div class="mem-sub-pane" id="sub-settings-display-pane" style="display:none">
          <div class="sub-settings-card">
            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">视觉色彩主题</span>
                <span class="ssr-desc">日间浅白 / 夜间暗黑 / OLED 纯黑护眼</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" data-set-theme="light" type="button">☀️ 浅白</button>
                <button class="nav-btn" data-set-theme="dark" type="button">🌙 暗黑</button>
                <button class="nav-btn" data-set-theme="oled" type="button">🖤 纯黑</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">释义字号排版</span>
                <span class="ssr-desc">单词释义与例句字体大小</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" data-set-fs="normal" type="button">标准</button>
                <button class="nav-btn" data-set-fs="large" type="button">中号</button>
                <button class="nav-btn" data-set-fs="xl" type="button">大号</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">例句中文遮挡自测</span>
                <span class="ssr-desc">先遮挡例句翻译，点击后再显示</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-masktranslation="1" type="button">🙈 遮挡</button>
                <button class="nav-btn" data-set-masktranslation="0" type="button">👁️ 显示</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">左右边缘滑动防误触保护</span>
                <span class="ssr-desc">仅在左右边缘 15% 区域内滑动触发评分</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn primary" data-set-edgeprotect="1" type="button">开启 15%</button>
                <button class="nav-btn" data-set-edgeprotect="0" type="button">全屏</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. 数据备份与恢复子视图 (#sub-settings-backup) -->
        <div class="mem-sub-pane" id="sub-settings-backup-pane" style="display:none">
          <div class="sub-settings-card">
            <div style="padding:14px 16px;border-bottom:1px solid var(--color-divider)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <strong style="font-size:14px;color:var(--color-text)">☁️ 免注册 6 位云端同步码</strong>
                <span id="mem-cloud-status-badge" style="font-size:11px;font-weight:700;color:var(--color-primary);background:color-mix(in oklab, var(--color-primary) 12%, transparent);padding:2px 8px;border-radius:6px">🟢 云端就绪</span>
              </div>
              <div style="background:var(--color-surface-offset);border:1px solid var(--color-border);border-radius:10px;padding:10px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:11px;color:var(--color-text-muted)">专属同步码</div>
                  <div id="mem-cloud-code-display" style="font-size:16px;font-weight:800;color:var(--color-primary);letter-spacing:1px">未生成</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px;color:var(--color-text-muted)">最后同步时间</div>
                  <div id="mem-cloud-time-display" style="font-size:11.5px;font-weight:600;color:var(--color-text)">从未同步</div>
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="nav-btn primary" id="mem-cloud-backup-btn" type="button" style="flex:1;padding:8px;font-size:12.5px;font-weight:700">☁️ 备份到云端</button>
                <button class="nav-btn" id="mem-cloud-restore-btn" type="button" style="flex:1;padding:8px;font-size:12.5px;font-weight:600">📥 同步码恢复</button>
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">本地 JSON 文件导入与导出</span>
                <span class="ssr-desc">离线数据安全导出归档与导入恢复</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" id="mem-export-backup-btn" type="button" style="padding:4px 10px;font-size:11.5px">📤 导出</button>
                <button class="nav-btn" id="mem-import-backup-btn" type="button" style="padding:4px 10px;font-size:11.5px">📥 导入</button>
                <input type="file" id="mem-backup-file-input" accept=".json" style="display:none">
              </div>
            </div>

            <div class="sub-setting-row">
              <div class="ssr-left">
                <span class="ssr-title">清除学习进度</span>
                <span class="ssr-desc" style="color:#ef4444">抹除本地背词、掌握及打卡记录从头开始</span>
              </div>
              <div class="ssr-control">
                <button class="nav-btn" id="mem-reset-progress-btn" type="button" style="color:#ef4444;border-color:rgba(239,68,68,0.3);padding:4px 10px;font-size:11.5px">🗑️ 重置清空</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 8. 关于与大纲版本子视图 (#sub-settings-about) -->
        <div class="mem-sub-pane" id="sub-settings-about-pane" style="display:none">
          <div class="sub-settings-card" style="padding:16px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <img src="icon-192.png" alt="考研词汇通" style="width:54px;height:54px;border-radius:12px;border:2px solid var(--color-primary)">
              <div>
                <strong style="font-size:16px;color:var(--color-text)">考研词汇通 · 金毛背单词</strong>
                <div style="font-size:12px;color:var(--color-primary);font-weight:700;margin-top:2px">v9.65 旗舰离线增强版</div>
              </div>
            </div>
            <p style="font-size:12.5px;color:var(--color-text-muted);line-height:1.6;margin:0 0 14px">
              本应用专为全国硕士研究生统一招生考试英语（一）研发，纯 HTML5 + 原生 JS 构建，无广告，零隐私追踪。内含教育部大纲全量 5,619 考研词汇、艾宾浩斯智能调度、105 篇翻译长难句与唐迟阅读逻辑拆解。
            </p>

            <div style="border-top:1px dashed var(--color-border);padding-top:12px">
              <div style="font-size:13px;font-weight:800;color:var(--color-text);margin-bottom:8px">
                🐾 30 款考研学伴萌犬大头照全景图鉴（金毛/边牧/萨摩耶）
              </div>
              <div id="puppy-album-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(88px, 1fr));gap:8px">
                <!-- 由 js/memory.js 动态填充 30 种狗狗图鉴大头卡 -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================================= -->
    <!-- 第三级：单词详情页 (Tier 3: 生词本点进去的单词详情) -->
    <!-- ======================================================= -->
    <section class="tier-view" id="mem-view-word">
      <div class="tier-header">
        <button class="tier-back-btn" id="mem-word-back-btn" type="button">‹ 返回</button>
        <span class="tier-header-title" id="mem-word-header-word">单词详情</span>
        <div class="tier-header-action">
          <button id="mem-word-fav-toggle" type="button" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--color-text-muted)">☆</button>
        </div>
      </div>

      <div style="padding: 12px 14px 24px" id="mem-word-content-box">
        <!-- 动态注入单词详情卡片 -->
      </div>
    </section>
  </main>

  <!-- 云端同步码输入弹窗 -->
  <div id="cloud-restore-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)">
    <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;max-width:360px;width:100%;padding:18px;box-shadow:var(--shadow-lg)">
      <div style="font-size:16px;font-weight:700;color:var(--color-text);margin-bottom:6px">📥 从云端同步码恢复学习进度</div>
      <div style="font-size:12.5px;color:var(--color-text-muted);line-height:1.5;margin-bottom:12px">
        请输入您在其他设备上备份时生成的 6 位专属云端同步码（例如 <code style="color:var(--color-primary);font-weight:700">KY-7E9B2</code>）：
      </div>
      <input type="text" id="cloud-restore-input" placeholder="输入同步码，如 KY-XXXXX" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;font-size:15px;font-weight:700;text-align:center;text-transform:uppercase;background:var(--color-surface-offset);color:var(--color-text);outline:none;margin-bottom:14px">
      <div style="display:flex;gap:8px">
        <button class="nav-btn" id="cloud-cancel-restore-btn" type="button" style="flex:1;padding:8px;font-size:13px">取消</button>
        <button class="nav-btn primary" id="cloud-confirm-restore-btn" type="button" style="flex:1;padding:8px;font-size:13px;font-weight:700">立即恢复</button>
      </div>
    </div>
  </div>

  <nav class="bottom-nav" aria-label="移动端导航">
    <a class="bottom-nav-item" href="study.html">
      <span class="icon">📖</span>
      <span>背单词</span>
    </a>
    <a class="bottom-nav-item" href="exam.html">
      <span class="icon">📝</span>
      <span>英一题型</span>
    </a>
    <a class="bottom-nav-item" href="words.html">
      <span class="icon">📚</span>
      <span>考研词库</span>
    </a>
    <a class="bottom-nav-item active" href="memory.html">
      <span class="icon">👤</span>
      <span>我的</span>
    </a>
  </nav>

  <script defer src="data/words_bundle.js"></script>
  <script defer src="js/word_data.js"></script>
  <script defer src="data/ai_examples_bundle.js"></script>
  <script defer src="js/quiz.js"></script>
  <script defer src="js/cloud_sync.js"></script>
  <script defer src="js/memory.js"></script>
  <script defer src="js/pwa.js"></script>
  <script>
    // 顶部下拉菜单切换
    const memMenuBtn = document.getElementById('mem-menu-toggle');
    const memNavBox = document.getElementById('mem-top-nav-box');
    if (memMenuBtn && memNavBox) {
      memMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = memNavBox.hidden;
        memNavBox.hidden = !isHidden;
        memMenuBtn.classList.toggle('active', isHidden);
      });
      document.addEventListener('click', (e) => {
        if (!memNavBox.hidden && !memNavBox.contains(e.target) && e.target !== memMenuBtn) {
          memNavBox.hidden = true;
          memMenuBtn.classList.remove('active');
        }
      });
    }
  </script>
</body>
</html>
'''

with open('memory.html', 'w', encoding='utf-8') as f:
    f.write(memory_html)

print("memory.html generated successfully with 3-tier hierarchy!")
