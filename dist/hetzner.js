"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.getServer = getServer;
exports.deleteServer = deleteServer;
exports.listServers = listServers;
exports.getLocations = getLocations;
const axios_1 = __importDefault(require("axios"));
const HETZNER_API = 'https://api.hetzner.cloud/v1';
const PLAN_MAP = {
    'cpx21': 'cpx21',
    'cx21': 'cpx21',
    'cpx31': 'cpx31',
    'cx31': 'cpx31',
    'cpx41': 'cpx41',
    'cx41': 'cpx41',
    'cax11': 'cax11',
    'cax21': 'cax21'
};
async function createServer(token, name, serverType, location) {
    // Map plan names to Hetzner IDs
    const hetznerType = PLAN_MAP[serverType] || serverType;
    // First, get the image ID for Ubuntu 22.04
    const images = await axios_1.default.get(`${HETZNER_API}/images`, {
        params: { name: 'ubuntu-22.04' },
        headers: { Authorization: `Bearer ${token}` }
    });
    const ubuntuImage = images.data.images.find((img) => img.name === 'ubuntu-22.04' && img.type === 'system');
    if (!ubuntuImage) {
        throw new Error('Ubuntu 22.04 image not found');
    }
    // Cloud-init user data
    const userData = `#!/bin/bash
set -e

# Update and install Docker
apt-get update
apt-get upgrade -y
apt-get install -y curl docker.io

# Install Docker Compose v2 as plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Allow docker to run without sudo
usermod -aG docker root

echo "Docker installed successfully"
`;
    // Create server
    const response = await axios_1.default.post(`${HETZNER_API}/servers`, {
        name,
        server_type: hetznerType,
        location,
        image: ubuntuImage.id,
        ssh_keys: ["108026328"], // awalker SSH key ID
        user_data: Buffer.from(userData).toString('base64'),
        start_after_create: true
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return {
        ...response.data.server,
        root_password: response.data.root_password
    };
}
async function getServer(token, serverId) {
    try {
        const response = await axios_1.default.get(`${HETZNER_API}/servers/${serverId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.server;
    }
    catch {
        return null;
    }
}
async function deleteServer(token, serverId) {
    await axios_1.default.delete(`${HETZNER_API}/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}
async function listServers(token) {
    const response = await axios_1.default.get(`${HETZNER_API}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.servers;
}
async function getLocations(token) {
    const response = await axios_1.default.get(`${HETZNER_API}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.locations;
}
