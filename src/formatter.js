// Formats Linear webhook payloads into Telegram-friendly messages (HTML mode)

function esc(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function priorityLabel(p) {
  return ['No Priority', 'Urgent', 'High', 'Medium', 'Low'][p] ?? 'Unknown';
}

function issueLink(data) {
  const id = esc(data.identifier || data.id?.slice(0, 8));
  const url = data.url;
  const title = esc(data.title || 'Untitled');
  return url ? `<a href="${url}">${id}: ${title}</a>` : `<b>${id}: ${title}</b>`;
}

function teamLine() {
  return '';
}

function format(type, action, data, updatedFrom) {
  switch (type) {
    case 'Issue':
      return formatIssue(action, data, updatedFrom);
    case 'Comment':
      return formatComment(action, data);
    case 'Project':
      return formatProject(action, data);
    case 'Cycle':
      return formatCycle(action, data);
    default:
      return null;
  }
}

function formatIssue(action, data, updatedFrom = {}) {
  const link = issueLink(data);
  const team = teamLine(data);
  const assignee = data.assignee?.name ? `\nAssignee: ${esc(data.assignee.name)}` : '';

  if (action === 'create') {
    const priority = data.priority != null ? `\nPriority: ${priorityLabel(data.priority)}` : '';
    const state = data.state?.name ? `\nStatus: ${esc(data.state.name)}` : '';
    return `<b>New Issue</b>\n${link}${team}${state}${priority}${assignee}`;
  }

  if (action === 'remove') {
    return `<b>Issue Deleted</b>\n${link}${team}`;
  }

  if (action === 'update') {
    const events = [];

    if (updatedFrom.stateId !== undefined) {
      const from = esc(updatedFrom.stateName || 'previous');
      const to = esc(data.state?.name || 'new status');
      events.push({ key: 'issue_status_changed', msg: `<b>Status Changed</b>\n${link}\n${from} → ${to}${team}` });
    }

    if (updatedFrom.assigneeId !== undefined) {
      const to = data.assignee?.name ? esc(data.assignee.name) : 'Unassigned';
      events.push({ key: 'issue_assigned', msg: `<b>Issue Assigned</b>\n${link}\nAssignee: ${to}${team}` });
    }

    if (updatedFrom.priority !== undefined) {
      const from = priorityLabel(updatedFrom.priority);
      const to = priorityLabel(data.priority);
      events.push({ key: 'issue_priority_changed', msg: `<b>Priority Changed</b>\n${link}\n${from} → ${to}${team}` });
    }

    if (updatedFrom.title !== undefined) {
      events.push({ key: 'issue_title_changed', msg: `<b>Title Changed</b>\n${esc(updatedFrom.title)} → ${esc(data.title)}${team}` });
    }

    if (events.length === 0) {
      events.push({ key: 'issue_updated', msg: `<b>Issue Updated</b>\n${link}${team}` });
    }

    return events;
  }

  return null;
}

function formatComment(action, data) {
  const issueLink_ = data.issue
    ? issueLink(data.issue)
    : `<b>issue</b>`;

  const body = esc((data.body || '').slice(0, 200)) + ((data.body || '').length > 200 ? '…' : '');
  const author = data.user?.name ? esc(data.user.name) : 'Someone';

  if (action === 'create') {
    return { key: 'comment_created', msg: `<b>${author} commented</b> on ${issueLink_}\n<i>${body}</i>` };
  }
  if (action === 'update') {
    return { key: 'comment_updated', msg: `<b>Comment edited</b> on ${issueLink_}\n<i>${body}</i>` };
  }
  if (action === 'remove') {
    return { key: 'comment_deleted', msg: `<b>Comment deleted</b> on ${issueLink_}` };
  }
  return null;
}

function formatProject(action, data) {
  const name = esc(data.name || 'Untitled Project');
  const url = data.url;
  const link = url ? `<a href="${url}">${name}</a>` : `<b>${name}</b>`;

  if (action === 'create') {
    return { key: 'project_created', msg: `<b>Project Created</b>\n${link}` };
  }
  if (action === 'update') {
    return { key: 'project_updated', msg: `<b>Project Updated</b>\n${link}` };
  }
  return null;
}

function formatCycle(action, data) {
  const name = esc(data.name || `Cycle ${data.number ?? ''}`);
  const team = data.team?.name ? ` (${esc(data.team.name)})` : '';

  if (action === 'create') {
    return { key: 'cycle_started', msg: `<b>Cycle Started</b>\n${name}${team}` };
  }
  if (action === 'update' && data.completedAt) {
    return { key: 'cycle_completed', msg: `<b>Cycle Completed</b>\n${name}${team}` };
  }
  return null;
}

module.exports = { format };
