"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploySpacebot = deploySpacebot;
exports.checkDocker = checkDocker;
const child_process_1 = require("child_process");
const util_1 = require("util");
const chalk_1 = __importDefault(require("chalk"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function deploySpacebot(ip, anthropicKey, telegramToken) {
    console.log(chalk_1.default.gray('   Waiting for SSH...'));
    await waitForSSH(ip, 30);
    console.log(chalk_1.default.gray('   Waiting for Docker to be ready...'));
    // Wait for Docker to be available (cloud-init might still be installing)
    let dockerReady = false;
    for (let i = 0; i < 30; i++) {
        dockerReady = await checkDocker(ip);
        if (dockerReady)
            break;
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    if (!dockerReady) {
        throw new Error('Docker not available after 5 minutes');
    }
    console.log(chalk_1.default.gray('   Running Spacebot container...'));
    // Run Spacebot directly with docker run
    const cmd = `docker run -d --name spacebot \
    -p 19898:19898 \
    -v spacebot-data:/data \
    -e TELEGRAM_TOKEN=${telegramToken} \
    -e ANTHROPIC_API_KEY=${anthropicKey} \
    --restart unless-stopped \
    ghcr.io/spacedriveapp/spacebot:latest`;
    await sshExec(ip, cmd, 300000);
    console.log(chalk_1.default.gray('   Waiting for Spacebot to initialize...'));
    await new Promise(resolve => setTimeout(resolve, 30000));
}
async function waitForSSH(ip, maxAttempts) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await execAsync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${ip} "echo ok"`, { timeout: 10000 });
            return;
        }
        catch {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    throw new Error('SSH not ready after timeout');
}
async function sshExec(ip, command, timeout = 60000) {
    const { stdout, stderr } = await execAsync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${ip} "${command.replace(/"/g, '\\"')}"`, { timeout });
    return stdout || stderr;
}
async function checkDocker(ip) {
    try {
        const result = await sshExec(ip, 'docker --version');
        return result.includes('Docker');
    }
    catch {
        return false;
    }
}
