require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { createBot } = require('./bot');
const { format } = require('./formatter');
const settings = require('./settings');

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  LINEAR_WEBHOOK_SECRET,
  PORT = 3000,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Missing required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
  process.exit(1);
}

const bot = createBot(TELEGRAM_BOT_TOKEN);
const app = express();

// Verify Linear webhook signature
function verifySignature(rawBody, signature) {
  if (!LINEAR_WEBHOOK_SECRET) return true; // skip if not configured
  const expected = crypto
    .createHmac('sha256', LINEAR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expected));
}

// Send a message to the configured Telegram chat
async function notify(text) {
  try {
    await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, text, { parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

// Process one formatted event (may be an object with {key, msg} or a plain string)
async function dispatch(event, defaultKey) {
  if (!event) return;

  // formatIssue update returns an array of sub-events
  if (Array.isArray(event)) {
    for (const e of event) await dispatch(e);
    return;
  }

  const key = event.key ?? defaultKey;
  const msg = event.msg ?? event;

  if (key && !settings.isEnabled(key)) return;
  await notify(msg);
}

app.use(express.raw({ type: 'application/json' }));

app.post('/webhook/linear', async (req, res) => {
  const sig = req.headers['linear-signature'];
  if (!verifySignature(req.body, sig)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  res.sendStatus(200); // acknowledge immediately

  const { type, action, data, updatedFrom } = payload;
  console.log(`[Linear] ${type} ${action}`);

  const event = format(type, action, data, updatedFrom);
  await dispatch(event);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: POST http://localhost:${PORT}/webhook/linear`);
});

bot.launch();
console.log('Telegram bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
