const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'state-cache.json');

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function set(stateId, stateName) {
  if (!stateId || !stateName) return;
  const cache = load();
  if (cache[stateId] !== stateName) {
    cache[stateId] = stateName;
    save(cache);
  }
}

function get(stateId) {
  if (!stateId) return null;
  return load()[stateId] || null;
}

module.exports = { set, get };
