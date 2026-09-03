const fs = require('fs');
global.window = {};
global.localStorage = {
  store: {
    kaoyan_study_v3: '{"todayDone":15}',
    kao_cloud_sync_code: 'KY-8A3F9'
  },
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); }
};
eval(fs.readFileSync('js/cloud_sync.js', 'utf8'));
const sync = window.KaoyanCloudSync;
console.log('Sync info:', sync.getSyncInfo());
