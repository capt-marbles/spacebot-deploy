import axios from 'axios';

const HETZNER_API = 'https://api.hetzner.cloud/v1';

export interface Server {
  id: number;
  name: string;
  status: string;
  public_net?: {
    ipv4?: {
      ip: string;
    };
  };
  created: string;
  location?: string;
  root_password?: string;
}

const PLAN_MAP: Record<string, string> = {
  'cpx21': 'cpx21',
  'cx21': 'cpx21',
  'cpx31': 'cpx31', 
  'cx31': 'cpx31',
  'cpx41': 'cpx41',
  'cx41': 'cpx41',
  'cax11': 'cax11',
  'cax21': 'cax21'
};

export async function createServer(
  token: string,
  name: string,
  serverType: string,
  location: string
): Promise<Server> {
  // Map plan names to Hetzner IDs
  const hetznerType = PLAN_MAP[serverType] || serverType;
  
  // First, get the image ID for Ubuntu 22.04
  const images = await axios.get(`${HETZNER_API}/images`, {
    params: { name: 'ubuntu-22.04' },
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const ubuntuImage = images.data.images.find((img: any) => 
    img.name === 'ubuntu-22.04' && img.type === 'system'
  );
  
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
  const response = await axios.post(
    `${HETZNER_API}/servers`,
    {
      name,
      server_type: hetznerType,
      location,
      image: ubuntuImage.id,
      ssh_keys: ["108026328"], // awalker SSH key ID
      user_data: Buffer.from(userData).toString('base64'),
      start_after_create: true
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return {
    ...response.data.server,
    root_password: response.data.root_password
  };
}

export async function getServer(token: string, serverId: number): Promise<Server | null> {
  try {
    const response = await axios.get(
      `${HETZNER_API}/servers/${serverId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.server;
  } catch {
    return null;
  }
}

export async function deleteServer(token: string, serverId: number): Promise<void> {
  await axios.delete(
    `${HETZNER_API}/servers/${serverId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export async function listServers(token: string): Promise<Server[]> {
  const response = await axios.get(
    `${HETZNER_API}/servers`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data.servers;
}

export async function getLocations(token: string) {
  const response = await axios.get(
    `${HETZNER_API}/locations`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data.locations;
}
