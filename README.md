# Spacebot Deploy

One-click Spacebot deployment to Hetzner.

## Installation

```bash
git clone https://github.com/capt-marbles/spacebot-deploy.git
cd spacebot-deploy
npm install
npm run build
```

## Usage

```bash
# Run interactively
node dist/index.js
```

Or with flags:

```bash
node dist/index.js \
  --token=your_hetzner_token \
  --anthropic=sk-xxx \
  --telegram=xxx:xxx \
  --location=ash
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--token` | Hetzner API token | (required) |
| `--anthropic` | Anthropic API key | (required) |
| `--telegram` | Telegram bot token | (required) |
| `--location` | Server location (ash, fsn1, nbg1) | ash |
| `--plan` | Server plan (cx21, cx31, cpx41) | cx31 |
| `--name` | Instance name | spacebot |

## Requirements

- Hetzner account with API token
- Anthropic API key (for Claude)
- Telegram bot token (@BotFather)

## Getting Started

1. **Get Hetzner API token:**
   - Go to https://console.hetzner.cloud
   - Select project → Security → API Tokens
   - Create new token

2. **Get Anthropic API key:**
   - Go to https://console.anthropic.com
   - Copy your API key

3. **Get Telegram bot token:**
   - Talk to @BotFather on Telegram
   - Use /newbot to create a bot
   - Copy the token

4. **Run deployment:**
   ```bash
   node dist/index.js
   ```

## What It Does

1. Creates a VPS on Hetzner
2. Installs Docker via cloud-init
3. Deploys Spacebot container
4. Returns URL

## Output

```
🚀 Spacebot Deploy - One-Click to Hetzner

? Hetzner API Token: xxx
? Anthropic API Key: sk-xxx
? Telegram Bot Token: xxx
? Location: ash (Ashburn, VA)
? Plan: CX31 (4 vCPU, 16GB RAM)
? Instance name: my-spacebot

📦 Creating VPS in ash...
   Server created: 123456

⏳ Waiting for server to be ready...
   ✅ Server ready: 1.2.3.4

🚀 Deploying Spacebot...
   Waiting for SSH...
   Pulling Spacebot image...
   Starting Spacebot...

==================================================
🎉 Spacebot is ready!
==================================================

   URL: http://1.2.3.4:19898
   Telegram: @your_bot

   Note: First run takes ~2 minutes to initialize.
```

## Cost

| Plan | Price |
|------|-------|
| CX21 | $5.83/mo |
| CX31 | $11.66/mo |
| CPX41 | $23.33/mo |

## License

MIT
