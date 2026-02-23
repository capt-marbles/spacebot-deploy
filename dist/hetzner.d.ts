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
export declare function createServer(token: string, name: string, serverType: string, location: string): Promise<Server>;
export declare function getServer(token: string, serverId: number): Promise<Server | null>;
export declare function deleteServer(token: string, serverId: number): Promise<void>;
export declare function listServers(token: string): Promise<Server[]>;
export declare function getLocations(token: string): Promise<any>;
