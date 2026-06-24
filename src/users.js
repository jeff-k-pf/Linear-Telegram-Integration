const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'user-map.json');

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; }
}

// Returns "@username" if found, null otherwise
function getMention(linearName) {
  if (!linearName) return null;
  const map = load();
  if (map[linearName]) return map[linearName];
  const lower = linearName.toLowerCase();
  // Case-insensitive full-name match
  const fullKey = Object.keys(map).find(k => k.toLowerCase() === lower);
  if (fullKey) return map[fullKey] || null;
  // First-name match — "@jeff" in a comment matches key "Jeff Kim"
  const firstKey = Object.keys(map).find(k => k.split(' ')[0].toLowerCase() === lower);
  return firstKey ? (map[firstKey] || null) : null;
}

function addUser(linearName, telegramHandle) {
  const map = load();
  map[linearName] = telegramHandle || null;
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2));
}

function removeUser(linearName) {
  const map = load();
  delete map[linearName];
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2));
}

function editUser(oldName, newName, newHandle) {
  const map = load();

  let key = oldName;
  if (!(oldName in map)) {
    // Also try matching by Telegram handle (e.g. user typed "@mackenzie" instead of "Mackenzie")
    const entry = Object.entries(map).find(([, v]) => v === oldName);
    if (!entry) throw new Error(`User "${oldName}" not found. Use the Linear display name (e.g. "Mackenzie"), not the handle. Check with /users.`);
    key = entry[0];
    if (newName === oldName) newName = key; // handle-only update: keep the Linear name
  }

  const existingHandle = map[key];
  delete map[key];
  map[newName] = newHandle !== undefined ? newHandle : existingHandle;
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2));
}

function listUsers() {
  return load();
}

module.exports = { getMention, addUser, removeUser, editUser, listUsers };
