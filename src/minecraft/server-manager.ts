import { RconClient, RconConfig } from './rcon';
import { EventEmitter } from 'events';
import { Client as SSHClient } from 'ssh2';
import { Readable } from 'stream';

interface MinecraftMessage {
  sender: string;
  content: string;
}

export declare interface MinecraftServerManager {
  on(event: 'chatMessage', listener: (message: MinecraftMessage) => void): this;
  emit(event: 'chatMessage', message: MinecraftMessage): boolean;
}

export interface MinecraftServerConfig extends RconConfig {
  ssh: {
    host: string;
    port: number;
    username: string;
    privateKey: string;
  };
  logPath: string;
}

export class MinecraftServerManager extends EventEmitter {
  private rcon: RconClient;
  private sshClient: SSHClient | null = null;
  private logStream: Readable | null = null;
  connected: boolean = false;
  private lastMessageTime: number = 0;
  private lastMessage: string = '';
  private chatParser = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: <(\w+)> (.+)$/;
  private config: MinecraftServerConfig;

  constructor(config: MinecraftServerConfig) {
    super();
    this.rcon = new RconClient({
      host: config.host,
      port: config.port,
      password: config.password
    });
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      await this.rcon.connect();
      this.connected = true;
      
      // Start monitoring chat messages
      await this.startLogMonitoring();
    } catch (error) {
      this.connected = false;
      console.error('Failed to connect to Minecraft server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.stopLogMonitoring();
      await this.rcon.disconnect();
      this.connected = false;
    } catch (error) {
      console.error('Error disconnecting from server:', error);
      throw error;
    }
  }

  async listPlayers(): Promise<string> {
    try {
      const response = await this.rcon.sendCommand('list');
      if (!response) return 'No response from server';
      return response.trim();
    } catch (error) {
      console.error('Error listing players:', error);
      throw new Error('Failed to get player list');
    }
  }

  async broadcastMessage(message: string): Promise<string> {
    try {
      const response = await this.rcon.sendCommand(`tellraw @a {"text":"${message}"}`);
      if (!response) return 'Message sent (no response)';
      return response.trim();
    } catch (error) {
      console.error('Error broadcasting message:', error);
      throw new Error('Failed to broadcast message');
    }
  }

  async setTime(time: 'day' | 'night'): Promise<string> {
    try {
      const ticks = time === 'day' ? 1000 : 13000;
      const response = await this.rcon.sendCommand(`time set ${ticks}`);
      if (!response) return `Time set to ${time}`;
      return response.trim();
    } catch (error) {
      console.error('Error setting time:', error);
      throw new Error(`Failed to set time to ${time}`);
    }
  }

  async setWeather(weather: 'clear' | 'rain' | 'thunder'): Promise<string> {
    try {
      const response = await this.rcon.sendCommand(`weather ${weather}`);
      if (!response) return `Weather set to ${weather}`;
      return response.trim();
    } catch (error) {
      console.error('Error setting weather:', error);
      throw new Error(`Failed to set weather to ${weather}`);
    }
  }

  private async startLogMonitoring(): Promise<void> {
    if (!this.sshClient) {
      console.log('Starting log monitoring via SSH...');
      this.sshClient = new SSHClient();

      try {
        await new Promise<void>((resolve, reject) => {
          this.sshClient!.on('ready', () => {
            console.log('SSH connection established');
            resolve();
          }).on('error', (err) => {
            reject(err);
          }).connect({
            host: this.config.ssh.host,
            port: this.config.ssh.port,
            username: this.config.ssh.username,
            privateKey: this.config.ssh.privateKey
          });
        });

        // Start tailing the log file
        this.sshClient.exec(`tail -f -n 0 ${this.config.logPath}`, (err, stream) => {
          if (err) {
            console.error('Failed to execute tail command:', err);
            return;
          }

          this.logStream = stream;
          stream.on('data', (data: Buffer) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;

              const match = this.chatParser.exec(line);
              if (match) {
                const [fullMatch, sender, content] = match;
                // Avoid duplicate messages
                const currentTime = Date.now();
                if (fullMatch !== this.lastMessage && currentTime - this.lastMessageTime > 500) {
                  this.lastMessage = fullMatch;
                  this.lastMessageTime = currentTime;
                  this.emit('chatMessage', { sender, content });
                }
              }
            }
          });

          stream.stderr.on('data', (data: Buffer) => {
            console.error('Error from tail command:', data.toString());
          });

          stream.on('close', (code: number) => {
            console.log(`Log monitoring process exited with code ${code}`);
            this.logStream = null;
          });
        });

      } catch (error) {
        console.error('Failed to establish SSH connection:', error);
        throw error;
      }
    }
  }

  private async stopLogMonitoring(): Promise<void> {
    if (this.logStream) {
      this.logStream.removeAllListeners();
      this.logStream.destroy();
      this.logStream = null;
    }

    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
  }
}
