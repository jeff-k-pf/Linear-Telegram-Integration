const { Telegraf, Markup } = require('telegraf');
const settings = require('./settings');

function createBot(token) {
  const bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply(
      'Linear notification bot is running.\n\n' +
      'Commands:\n' +
      '/settings — toggle notification types\n' +
      '/status — check bot status'
    );
  });

  bot.command('status', (ctx) => {
    ctx.reply('✅ Bot is running and listening for Linear events.');
  });

  bot.command('settings', (ctx) => {
    ctx.reply('Notification Settings — tap to toggle on/off:', buildSettingsKeyboard());
  });

  bot.action(/^toggle:(.+)$/, async (ctx) => {
    const key = ctx.match[1];
    try {
      const newVal = settings.toggle(key);
      const label = settings.LABELS[key] || key;
      await ctx.answerCbQuery(`${label}: ${newVal ? 'ON ✅' : 'OFF ❌'}`);
      await ctx.editMessageReplyMarkup(buildSettingsKeyboard().reply_markup);
    } catch (err) {
      await ctx.answerCbQuery('Error toggling setting.');
    }
  });

  return bot;
}

function buildSettingsKeyboard() {
  const current = settings.load();
  const buttons = Object.entries(settings.LABELS).map(([key, label]) => {
    const on = current[key];
    return [Markup.button.callback(`${on ? '✅' : '❌'} ${label}`, `toggle:${key}`)];
  });
  return Markup.inlineKeyboard(buttons);
}

module.exports = { createBot };
