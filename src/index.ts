#!/usr/bin/env node

import { createServer, getServer } from './hetzner.js';
import { deploySpacebot } from './deploy.js';
import chalk from 'chalk';

interface DeployOptions {
  hetznerToken: string;
  anthropicKey: string;
  telegramToken: string;
  location: string;
  plan: string;
  name: string;
}

function parseArgs(): DeployOptions {
  const args = process.argv.slice(2);
  const options: Partial<DeployOptions> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      switch (key) {
        case 'token':
        case 'hetzner-token':
          options.hetznerToken = value || args[++i];
          break;
        case 'anthropic':
        case 'anthropic-key':
          options.anthropicKey = value || args[++i];
          break;
        case 'telegram':
        case 'telegram-token':
          options.telegramToken = value || args[++i];
          break;
        case 'location':
        case 'loc':
          options.location = value || args[++i];
          break;
        case 'plan':
          options.plan = value || args[++i];
          break;
        case 'name':
          options.name = value || args[++i];
          break;
      }
    }
  }
  
  if (!options.hetznerToken) throw new Error('--token required');
  if (!options.anthropicKey) throw new Error('--anthropic required');
  if (!options.telegramToken) throw new Error('--telegram required');
  
  return {
    hetznerToken: options.hetznerToken,
    anthropicKey: options.anthropicKey,
    telegramToken: options.telegramToken,
    location: options.location || 'ash',
    plan: options.plan || 'cx21',
    name: options.name || 'spacebot'
  };
}

async function main() {
  console.log(chalk.cyan('\n🚀 Spacebot Deploy - One-Click to Hetzner\n'));
  
  let options: DeployOptions;
  
  try {
    options = parseArgs();
  } catch (e: any) {
    console.log(chalk.yellow('Usage:'));
    console.log('  node dist/index.js --token=HETZNER_TOKEN --anthropic=ANTHROPIC_KEY --telegram=TELEGRAM_TOKEN');
    console.log(chalk.yellow('\nOptions:'));
    console.log('  --token      Hetzner API token (required)');
    console.log('  --anthropic  Anthropic API key (required)');
    console.log('  --telegram   Telegram bot token (required)');
    console.log('  --location   ash, fsn1, nbg1 (default: ash)');
    console.log('  --plan       cx21, cx31, cpx41 (default: cx21)');
    console.log('  --name       Instance name (default: spacebot)');
    console.log(chalk.red(`\nError: ${e.message}`));
    process.exit(1);
  }

  const { hetznerToken, anthropicKey, telegramToken, location, plan, name } = options;

  try {
    // Step 1: Create server
    console.log(chalk.yellow(`📦 Creating VPS in ${location}...`));
    const server = await createServer(hetznerToken, name, plan, location);
    const ip = server.public_net?.ipv4?.ip || '';
    const password = server.root_password || '';
    
    console.log(chalk.gray(`   Server ID: ${server.id}`));

    // Step 2: Wait for ready
    console.log(chalk.yellow('\n⏳ Waiting for server to be ready...'));
    
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const status = await getServer(hetznerToken, server.id);
      
      if (status?.status === 'running') {
        console.log(chalk.green(`   ✅ Server ready: ${ip}`));
        break;
      }
      process.stdout.write(chalk.gray('.'));
    }

    // Step 3: Deploy Spacebot
    console.log(chalk.yellow('\n🚀 Deploying Spacebot...'));
    await deploySpacebot(ip, anthropicKey, telegramToken);
    console.log(chalk.green('   ✅ Spacebot deployed!'));

    // Done
    console.log(chalk.cyan('\n' + '='.repeat(50)));
    console.log(chalk.green.bold('\n🎉 VPS Deployed!'));
    console.log(chalk.cyan('='.repeat(50)));
    
    console.log(chalk.white(`\n   IP Address: ${ip}`));
    console.log(chalk.white(`   Password: ${password}`));
    console.log(chalk.white(`   SSH: ssh root@${ip}`));
    
    console.log(chalk.yellow('\n   Next steps:'));
    console.log(chalk.gray('   1. SSH in: ssh root@' + ip));
    console.log(chalk.gray('   2. Install Docker: curl https://get.docker.com | sh'));
    console.log(chalk.gray('   3. Run Spacebot: docker run -d -p 19898:19898 \\'));
    console.log(chalk.gray('      -e TELEGRAM_TOKEN=' + telegramToken + ' \\'));
    console.log(chalk.gray('      -e ANTHROPIC_API_KEY=' + anthropicKey + ' \\'));
    console.log(chalk.gray('      ghcr.io/spacedriveapp/spacebot:latest'));
    console.log(chalk.gray('   4. Access: http://' + ip + ':19898\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Deployment failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
