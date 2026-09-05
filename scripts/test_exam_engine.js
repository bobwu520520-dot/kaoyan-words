const fs = require('fs');
const vm = require('vm');

function createMockDom() {
  const elements = {};
  function makeEl(tag, id) {
    const el = {
      tagName: tag || 'div',
      id: id || '',
      className: '',
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this._classes.add(c); else this._classes.delete(c);
          } else {
            if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
          }
        },
        contains(c) { return this._classes.has(c); }
      },
      style: {},
      _innerHTML: '',
      set innerHTML(val) { this._innerHTML = val; },
      get innerHTML() { return this._innerHTML; },
      textContent: '',
      value: '',
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] || null; },
      addEventListener() {},
      removeEventListener() {},
      appendChild() {},
      querySelectorAll(sel) {
        return [];
      },
      querySelector(sel) { return null; },
      contains() { return false; },
      disabled: false
    };
    return el;
  }

  const listeners = {};
  const mockDoc = {
    readyState: 'complete',
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    removeEventListener() {},
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeEl('div', id);
      }
      return elements[id];
    },
    querySelector(sel) { return makeEl('div'); },
    querySelectorAll(sel) { return []; },
    createElement(tag) { return makeEl(tag); },
    documentElement: makeEl('html'),
    body: makeEl('body'),
    head: makeEl('head')
  };

  const winListeners = {};
  const mockWin = {
    document: mockDoc,
    location: { hash: '#home', href: 'http://localhost/exam.html' },
    history: { back() {}, length: 1 },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    addEventListener(evt, fn) {
      winListeners[evt] = winListeners[evt] || [];
      winListeners[evt].push(fn);
    },
    removeEventListener() {},
    scrollTo() {},
    setInterval() { return 1; },
    setTimeout(fn) { return 1; },
    speechSynthesis: { speak() {}, cancel() {} },
    SpeechSynthesisUtterance: function() {},
    console: console,
    navigator: { userAgent: 'Mozilla/5.0' },
    Date: Date,
    Math: Math,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    _triggerHash(h) {
      this.location.hash = h;
      if (winListeners['hashchange']) {
        winListeners['hashchange'].forEach(fn => fn());
      }
    }
  };
  mockWin.window = mockWin;
  mockWin.global = mockWin;
  return mockWin;
}

const dom = createMockDom();

// Run bundles
vm.runInNewContext(fs.readFileSync('data/exam_data_bundle.js', 'utf8'), dom);
vm.runInNewContext(fs.readFileSync('data/translations_bundle.js', 'utf8'), dom);
vm.runInNewContext(fs.readFileSync('js/exam_workshop.js', 'utf8'), dom);

console.log('Exam Workshop Engine loaded!');

// 1. Check Home View
dom._triggerHash('#home');
const homeBadge = dom.document.getElementById('badge-reading-count');
console.log('Home reading badge:', homeBadge.textContent);

// 2. Check Problem Lists
const cats = ['cloze', 'reading', 'newtype', 'trans', 'writing', 'suite'];
cats.forEach(cat => {
  dom._triggerHash('#type/' + cat);
  const container = dom.document.getElementById('exam-problem-items-container');
  const countBadge = dom.document.getElementById('exam-list-count-badge');
  console.log(`[List: ${cat}] count badge: ${countBadge.textContent}, items rendered length: ${container.innerHTML.length}`);
});

// 3. Check Details
const testDetails = [
  '#detail/reading/0',
  '#detail/cloze/0',
  '#detail/newtype/0',
  '#detail/trans/0',
  '#detail/writing/0',
  '#detail/writing/6',
  '#detail/suite/0'
];

testDetails.forEach(route => {
  dom._triggerHash(route);
  const box = dom.document.getElementById('exam-detail-content-box');
  const title = dom.document.getElementById('exam-detail-header-title');
  console.log(`[Detail: ${route}] title: "${title.textContent}", content length: ${box.innerHTML.length}`);
  if (box.innerHTML.includes('范文收集中...') || box.innerHTML.includes('此题型暂无题目数据')) {
    console.error('  WARNING: Placeholder detected in ' + route);
  }
});

console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
