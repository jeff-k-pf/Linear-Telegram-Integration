# Linear → Telegram Integration

Get notified in Telegram when anything happens on your Linear team. Toggle notification types directly from the bot.

## Setup

### 1. Create a Telegram bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the **bot token**

### 2. Get your Telegram chat ID

1. Start a conversation with your new bot (send it any message)
2. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":...}` in the response — that number is your `TELEGRAM_CHAT_ID`

### 3. Configure environment variables

```bash
cp .env.example .env
# Fill in TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run with ngrok

Open two terminals:

**Terminal 1 — start the server:**
```bash
npm start
```

**Terminal 2 — expose it with ngrok:**
```bash
ngrok http 3000
```

Copy the `https://...ngrok-free.app` URL from ngrok output.

### 6. Register the Linear webhook

1. Go to Linear → **Settings → API → Webhooks**
2. Click **New Webhook**
3. Set URL to: `https://YOUR-NGROK-URL/webhook/linear`
4. Select your team
5. Check all resource types you want (Issues, Comments, Projects, Cycles)
6. Copy the **Signing Secret** into your `.env` as `LINEAR_WEBHOOK_SECRET`
7. Save

## Usage

In Telegram, message your bot:

| Command | Description |
|---------|-------------|
| `/settings` | Toggle notification types on/off with buttons |
| `/status` | Check that the bot is alive |

### Notification types you can toggle

| Setting | Default |
|---------|---------|
| Issue Created | On |
| Issue Updated (catch-all) | Off |
| Issue Deleted | On |
| Status Changed | On |
| Issue Assigned | On |
| Priority Changed | Off |
| Title Changed | Off |
| Comment Added | On |
| Comment Edited | Off |
| Comment Deleted | Off |
| Project Created | On |
| Project Updated | Off |
| Cycle Started | On |
| Cycle Completed | On |

Settings are saved in `settings.json` and persist across restarts.

## Deploying to a DigitalOcean Droplet (later)

When you're ready to move off ngrok:

1. Copy the project to your droplet (`git clone` or `rsync`)
2. Install Node.js 18+ on the droplet
3. Set up your `.env`
4. Use `pm2` to keep it running: `pm2 start src/index.js --name linear-bot`
5. Point nginx at port 3000 with an SSL cert (Let's Encrypt)
6. Update the Linear webhook URL to your domain
