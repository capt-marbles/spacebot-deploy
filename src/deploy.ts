import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export async function deploySpacebot(
  ip: string,
  anthropicKey: string,
  telegramToken: string
): Promise<void> {
  console.log(chalk.gray('   Waiting for SSH...'));
  await waitForSSH(ip, 30);
  
  console.log(chalk.gray('   Waiting for Docker to be ready...'));
  
  // Wait for Docker to be available (cloud-init might still be installing)
  let dockerReady = false;
  for (let i = 0; i < 30; i++) {
    dockerReady = await checkDocker(ip);
    if (dockerReady) break;
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  if (!dockerReady) {
    throw new Error('Docker not available after 5 minutes');
  }
  
  console.log(chalk.gray('   Running Spacebot container...'));
  
  // Run Spacebot directly with docker run
  const cmd = `docker run -d --name spacebot \
    -p 19898:19898 \
    -v spacebot-data:/data \
    -e TELEGRAM_TOKEN=${telegramToken} \
    -e ANTHROPIC_API_KEY=${anthropicKey} \
    --restart unless-stopped \
    ghcr.io/spacedriveapp/spacebot:latest`;
  
  await sshExec(ip, cmd, 300000);
  
  console.log(chalk.gray('   Waiting for Spacebot to initialize...'));
  await new Promise(resolve => setTimeout(resolve, 30000));
}

async function waitForSSH(ip: string, maxAttempts: number): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await execAsync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${ip} "echo ok"`, { timeout: 10000 });
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('SSH not ready after timeout');
}

async function sshExec(ip: string, command: string, timeout = 60000): Promise<string> {
  const { stdout, stderr } = await execAsync(
    `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${ip} "${command.replace(/"/g, '\\"')}"`,
    { timeout }
  );
  return stdout || stderr;
}

export async function checkDocker(ip: string): Promise<boolean> {
  try {
    const result = await sshExec(ip, 'docker --version');
    return result.includes('Docker');
  } catch {
    return false;
  }
}
