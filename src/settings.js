const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');

const DEFAULTS = {
  issue_created: true,
  issue_updated: false,
  issue_deleted: true,
  issue_status_changed: true,
  issue_assigned: true,
  issue_priority_changed: false,
  issue_title_changed: false,
  comment_created: true,
  comment_updated: false,
  comment_deleted: false,
  project_created: true,
  project_updated: false,
  cycle_started: true,
  cycle_completed: true,
};

const LABELS = {
  issue_created: 'Issue Created',
  issue_updated: 'Issue Updated',
  issue_deleted: 'Issue Deleted',
  issue_status_changed: 'Status Changed',
  issue_assigned: 'Issue Assigned',
  issue_priority_changed: 'Priority Changed',
  issue_title_changed: 'Title Changed',
  comment_created: 'Comment Added',
  comment_updated: 'Comment Edited',
  comment_deleted: 'Comment Deleted',
  project_created: 'Project Created',
  project_updated: 'Project Updated',
  cycle_started: 'Cycle Started',
  cycle_completed: 'Cycle Completed',
};

function load() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    save(DEFAULTS);
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function toggle(key) {
  const settings = load();
  if (!(key in settings)) throw new Error(`Unknown setting: ${key}`);
  settings[key] = !settings[key];
  save(settings);
  return settings[key];
}

function isEnabled(key) {
  return load()[key] === true;
}

module.exports = { load, save, toggle, isEnabled, LABELS, DEFAULTS };
