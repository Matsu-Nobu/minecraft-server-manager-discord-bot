import { RconClient, RconConfig } from './rcon';

export class MinecraftServerManager {
  private rcon: RconClient;
  connected: boolean = false;

  constructor(config: RconConfig) {
    this.rcon = new RconClient(config);
  }

  async connect(): Promise<void> {
    try {
      await this.rcon.connect();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      console.error('Failed to connect to Minecraft server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
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
      const response = await this.rcon.sendCommand(`say ${message}`);
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
}
