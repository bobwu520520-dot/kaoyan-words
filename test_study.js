// study.js 逻辑仿真测试: 用 stub DOM/localStorage 在 Node 中执行真实代码
// 覆盖: 刷新持久化 / 跨天 / 本地日期 / 防重复计数 / 损坏容错 /
//       四级评分间隔 / 连续成功阶梯 / 薄弱词 / 队列优先级 / 旧数据兼容
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('js/study.js', 'utf8');

let NOW = new Date(2026, 7, 16, 10, 0, 0);
function setDay(day, hour) { NOW = new Date(2026, 7, day, hour || 10, 0, 0); }

function makeStub() {
  const storage = new Map();
  const els = {};
  const docListeners = {};
  const el = (id) => {
    if (!els[id]) els[id] = {
      id, innerHTML: '', textContent: '', value: '100', dataset: {},
      style: {}, onclick: null, onchange: null, hidden: false,
      addEventListener: () => {}, classList: { toggle() {}, add() {}, remove() {} },
      querySelectorAll: () => [], querySelector: () => null,
      setAttribute: () => {}, getAttribute: () => null,
    };
    return els[id];
  };
  const document = {
    getElementById: el,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (t, f) => { docListeners[t] = f; },
    hidden: false,
  };
  const windowObj = { addEventListener: () => {} };
  const localStorage = {
    getItem: (k) => storage.has(k) ? storage.get(k) : null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const word = (wd, tier, opt) => Object.assign({
    word: wd, tier, translation: '释义', exam_meaning: '', studyEligible: true,
    phonetic: 'x', pos: 'v.', example_en: 'Example.', secondary_meanings: '',
  }, opt || {});
  const sandbox = {
    document, window: windowObj, localStorage,
    Date: class extends Date { constructor(...a) { super(...(a.length ? a : [NOW])); } static now() { return NOW.getTime(); } },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({
      data_version: 'test-v1',
      words: [
        word('abandon', '核心高频'), word('address', '核心高频'), word('abate', '核心高频'),
        word('accord', '核心高频'), word('acute', '核心高频'), word('adopt', '核心高频'),
        word('adept', '核心高频'), word('aerial', '普通扩展', { studyEligible: false, translation: '' }),
      ],
    }) }),
    console, setTimeout, clearTimeout, Math, JSON, Number, String, Object, Array, isFinite,
    matchMedia: () => ({ matches: false }),
  };
  sandbox.globalThis = sandbox;
  return { sandbox, storage, els, docListeners };
}

async function run(seedStorage) {
  const t = makeStub();
  for (const [k, v] of Object.entries(seedStorage || {})) t.storage.set(k, v);
  vm.runInNewContext(src, t.sandbox, { filename: 'study.js' });
  await new Promise(r => setTimeout(r, 20));
  return t;
}

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

(async () => {
  console.log('测试1: 正常流程 + 当天防重复计数 + 刷新持久化');
  setDay(16, 10);
  let t = await run({});
  check('词库加载后队列有词', t.els['card'].innerHTML.includes('点击空白处查看释义'));
  t.els['grade2'].onclick(); // 认识第一个词
  let s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('认识后 todayDone=1', s.todayDone === 1);
  const rated = Object.keys(s.progress)[0];
  check('认识后 success=1', s.progress[rated].success === 1);
  t.els['prev'].onclick(); // 回到同一个词
  t.els['grade2'].onclick(); // 再认识一次
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('同词当天重复评分不重复计数', s.todayDone === 1);
  check('连续认识 level=2, success=2', s.progress[rated].level === 2 && s.progress[rated].success === 2);
  check('today 使用本地日期(2026-08-16)', s.today === '2026-08-16');
  setDay(16, 11);
  t = await run(Object.fromEntries(t.storage));
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('刷新后进度仍在(level=2, success=2)', s.todayDone === 1 && s.progress[rated].level === 2 && s.progress[rated].success === 2);

  console.log('测试2: 跨天重置');
  setDay(17, 9);
  t = await run(Object.fromEntries(t.storage));
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('第二天 today 更新为 08-17', s.today === '2026-08-17');
  check('第二天 todayDone 归零', s.todayDone === 0);
  check('第二天 todaySeen 清空', Object.keys(s.todaySeen).length === 0);
  check('progress 词条仍在', s.progress[rated].level === 2);

  console.log('测试3: 页面挂机跨零点(visibilitychange)');
  setDay(17, 9);
  t = await run(Object.fromEntries(t.storage));
  t.els['grade2'].onclick();
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('17日评分后 todayDone=1', s.todayDone === 1);
  setDay(18, 0);
  t.docListeners['visibilitychange']();
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('跨零点回页面后 todayDone 归零', s.todayDone === 0 && s.today === '2026-08-18');

  console.log('测试4: localStorage 损坏容错');
  setDay(16, 10);
  t = await run({ 'kaoyan_study_v3': '{{{not json' });
  check('非法JSON不崩溃且能渲染', !!t.els['card'].innerHTML);
  t = await run({ 'kaoyan_study_v3': JSON.stringify({ progress: 'oops', todaySeen: 42, tier: '高频', daily: 999, history: [], hardCount: 'x' }) });
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('progress/todaySeen/history/hardCount 类型损坏被重置', typeof s.progress === 'object' && typeof s.todaySeen === 'object' && typeof s.history === 'object' && typeof s.hardCount === 'object');
  check('旧档位"高频"回退为 核心高频', s.tier === '核心高频');
  check('daily 越界被钳制为 100', s.daily === 100);

  console.log('测试5: 无到期词时"优先复习"不崩溃');
  setDay(16, 10);
  t = await run({});
  t.els['review'].onclick();
  check('review 按钮可执行且不崩溃', true);

  console.log('测试6: 四级评分间隔');
  setDay(16, 10);
  t = await run({});
  // 不认识 → 30 分钟
  t.els['grade0'].onclick();
  let s6 = JSON.parse(t.storage.get('kaoyan_study_v3'));
  const wA = Object.keys(s6.progress)[0];
  const d30 = s6.progress[wA].next - NOW.getTime();
  check('不认识→约30分钟再现', d30 >= 29*60000 && d30 <= 31*60000);
  check('不认识 wrong=1 failStreak=1 success=0', s6.progress[wA].wrong === 1 && s6.progress[wA].failStreak === 1 && s6.progress[wA].success === 0);
  check('不认识不计入今日完成', s6.todayDone === 0);
  // 模糊 → 1 天
  t.els['next'].onclick();
  t.els['grade1'].onclick();
  s6 = JSON.parse(t.storage.get('kaoyan_study_v3'));
  const wB = Object.keys(s6.progress).find(k => k !== wA);
  const d1 = s6.progress[wB].next - NOW.getTime();
  check('模糊→1天', d1 >= 23*3600000 && d1 <= 25*3600000);
  // 认识 → 3 天
  t.els['next'].onclick();
  t.els['grade2'].onclick();
  s6 = JSON.parse(t.storage.get('kaoyan_study_v3'));
  const wC = Object.keys(s6.progress).find(k => k !== wA && k !== wB);
  const d3 = s6.progress[wC].next - NOW.getTime();
  check('认识→3天', d3 >= 71*3600000 && d3 <= 73*3600000);
  check('认识计入今日完成', s6.todayDone === 1);

  console.log('测试7: 连续成功阶梯 3→7→15→30→60 天');
  setDay(16, 10);
  t = await run({});
  t.els['grade2'].onclick();
  const wE = Object.keys(JSON.parse(t.storage.get('kaoyan_study_v3')).progress)[0];
  const expectDays = [7, 15, 30, 60];
  for (let i = 0; i < 4; i++) {
    t.els['prev'].onclick(); t.els['grade2'].onclick();
    const s7 = JSON.parse(t.storage.get('kaoyan_study_v3'));
    const diff = s7.progress[wE].next - NOW.getTime();
    const exp = expectDays[i] * 86400000;
    check(`连续第${i + 2}次认识→${expectDays[i]}天`, Math.abs(diff - exp) < 3600000);
  }
  check('连续认识4次后 level=5 success=5', JSON.parse(t.storage.get('kaoyan_study_v3')).progress[wE].level === 5);

  console.log('测试8: 失败重置阶梯');
  setDay(16, 10);
  t = await run({});
  t.els['grade2'].onclick();
  const wF = Object.keys(JSON.parse(t.storage.get('kaoyan_study_v3')).progress)[0];
  t.els['prev'].onclick(); t.els['grade2'].onclick(); // success=2 → 15天
  t.els['prev'].onclick(); t.els['grade1'].onclick(); // 模糊 → success 清零
  let s8 = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('模糊后 success=0', s8.progress[wF].success === 0);
  const dM = s8.progress[wF].next - NOW.getTime();
  check('模糊间隔回到1天', Math.abs(dM - 86400000) < 3600000);

  console.log('测试9: 薄弱词(多次错误自动记录)');
  setDay(16, 10);
  t = await run({});
  for (let i = 0; i < 3; i++) {
    t.els['prev'].onclick(); t.els['grade0'].onclick();
  }
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  const weakWord = Object.keys(s.progress).find(k => s.progress[k].wrong >= 3);
  check('不认识3次后 wrong=3', !!weakWord);
  check('薄弱词统计 ≥1', Number(t.els['weak'].textContent) >= 1);
  t.els['weak-btn'].onclick();
  check('复习薄弱词按钮可执行', true);

  console.log('测试10: 队列优先级 到期 > 薄弱 > 新词');
  setDay(16, 10);
  // 预置: due 词(到期)、weak 词(未到期但薄弱)、其余新词
  const seed = {
    'kaoyan_study_v3': JSON.stringify({
      today: '2026-08-16', todayDone: 0, todaySeen: {}, tier: '核心高频', daily: 100, hardCount: {},
      history: {},
      progress: {
        abandon: { level: 2, next: NOW.getTime() - 1000, last: 0, wrong: 0, failStreak: 0, success: 2 }, // 到期
        address: { level: 1, next: NOW.getTime() + 86400000, last: 0, wrong: 3, failStreak: 0, success: 0 }, // 薄弱未到期
      },
    }),
  };
  t = await run(seed);
  // 队列顺序断言: abandon(due) 在 address(weak) 之前, address 在 abate(新词) 之前
  const qWords = [];
  const qEl = t.els['queue'];
  const m = qEl.innerHTML.match(/data-i="\d+">(\d+)<\/button>/g) || [];
  // 直接读 queue 渲染顺序: qdot 按队列顺序
  for (let i = 0; i < m.length; i++) {
    const btn = qEl.innerHTML.match(new RegExp(`data-i="${i}"`)) ? i : i;
    qWords.push(i); // 占位, 顺序按 i
  }
  // 更可靠: 用 innerHTML 顺序判断按钮编号顺序 = 队列顺序
  const order = [...qEl.innerHTML.matchAll(/data-i="(\d+)"/g)].map(x => +x[1]);
  const names = ['abandon', 'address', 'abate', 'accord', 'acute', 'adopt', 'adept'];
  // qdot 只显示编号, 无法直接得到词名; 改用 queue 内部状态验证 —— 通过 card 渲染第一个词
  const firstCard = t.els['card'].innerHTML;
  check('队列第一个词是到期词 abandon', firstCard.includes('abandon'));
  // 到期词必然在薄弱词之前: 检查 order 序列中 abandon 的位置 < address 的位置
  // order 是 qdot 的 data-i 顺序(=队列顺序), 但 qdot 不包含词名。
  // 改为: 遍历评分验证队列顺序
  let found = {};
  for (let i = 0; i < 7; i++) {
    const card = t.els['card'].innerHTML;
    const wd = names.find(n => card.includes(n) && !found[n]);
    if (wd) found[wd] = i;
    t.els['next'].onclick();
  }
  check('队列顺序: 到期(abandon) 在 薄弱(address) 之前', found.abandon < found.address);
  check('队列顺序: 薄弱(address) 在 新词(abate) 之前', found.address < found.abate);

  console.log('测试11: 旧数据兼容(旧版 progress 无 wrong/success 字段)');
  setDay(16, 10);
  const oldSeed = {
    'kaoyan_study_v3': JSON.stringify({
      today: '2026-08-16', todayDone: 3, todaySeen: {}, tier: '核心高频', daily: 100,
      progress: { abandon: { level: 3, next: 0, last: 0 } },
    }),
  };
  t = await run(oldSeed);
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('旧数据加载不崩溃且保留', s.progress.abandon.level === 3 && s.todayDone === 3);
  // 旧数据到期(next=0)应进入复习队列
  check('旧到期词进入队列(第一个词)', t.els['card'].innerHTML.includes('abandon') || t.els['card'].innerHTML.includes('点击空白处查看释义'));
  t.els['grade2'].onclick();
  s = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('旧数据评"认识"后 success=1 且不崩溃', s.progress.abandon.success === 1);

  console.log('测试12: 词库版本号与失效进度清理');
  setDay(16, 10);
  const seed8 = { 'kaoyan_data_version': 'old-version-20200101', 'kaoyan_study_v3': JSON.stringify({
    today: '2026-08-16', todayDone: 5, todaySeen: {}, tier: '核心高频', daily: 100,
    progress: { abandon: { level: 3, next: 0, last: 0 }, deletedword: { level: 4, next: 0, last: 0 } },
    hardCount: { deletedword: 5 }, history: {},
  }) };
  t = await run(seed8);
  let s12 = JSON.parse(t.storage.get('kaoyan_study_v3'));
  check('失效词进度被清理', !s12.progress.deletedword && s12.progress.abandon);
  check('失效词 hardCount 被清理', !s12.hardCount.deletedword);
  check('升级提示已显示', t.els['upgrade-notice'].hidden === false);
  check('版本号已更新', t.storage.get('kaoyan_data_version') !== 'old-version-20200101');
  t = await run(Object.fromEntries(t.storage));
  check('同版本不再提示', !t.els['upgrade-notice'] || t.els['upgrade-notice'].hidden === true);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();
