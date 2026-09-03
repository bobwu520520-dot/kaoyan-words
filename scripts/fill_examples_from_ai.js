const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
const wordsPath = path.join(dataDir, 'words.json');
const aiPath = path.join(dataDir, 'ai_examples.json');

const wordsDoc = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const aiDoc = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
const ai = aiDoc.s || {};

let filledEnglish = 0;
let filledChinese = 0;
let filledBoth = 0;
const unresolved = [];

for (const word of wordsDoc.words) {
  const pair = ai[word.word];
  if (pair && pair[0] && pair[1]) {
    const hadEnglish = Boolean(String(word.example_en || '').trim());
    const hadChinese = Boolean(String(word.example_zh || '').trim());
    if (!hadEnglish) {
      word.example_en = pair[0];
      filledEnglish += 1;
    }
    if (!hadChinese) {
      word.example_zh = pair[1];
      filledChinese += 1;
    }
    if (!hadEnglish && !hadChinese) filledBoth += 1;
  }
  if (word.active !== false && (!word.example_en || !word.example_zh)) {
    unresolved.push({
      word: word.word,
      tier: word.tier || '',
      missing: [
        !word.example_en ? 'example_en' : null,
        !word.example_zh ? 'example_zh' : null,
      ].filter(Boolean),
    });
  }
}

fs.writeFileSync(wordsPath, JSON.stringify(wordsDoc, null, 2) + '\n', 'utf8');
fs.writeFileSync(
  path.join(dataDir, 'example_fill_report.json'),
  JSON.stringify({
    source: 'data/ai_examples.json',
    policy: 'fill-empty-fields-only',
    filledEnglish,
    filledChinese,
    filledBoth,
    unresolvedActiveCount: unresolved.length,
    unresolvedActive: unresolved,
  }, null, 2) + '\n',
  'utf8',
);

console.log(JSON.stringify({ filledEnglish, filledChinese, filledBoth, unresolvedActiveCount: unresolved.length }));
