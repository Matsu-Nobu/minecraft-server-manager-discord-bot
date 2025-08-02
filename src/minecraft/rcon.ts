import net from 'net';

export interface RconConfig {
  host: string;
  port: number;
  password: string;
}

export class RconClient {
  private socket: net.Socket | null = null;
  private requestId = 0;
  private authenticated = false;
  private config: RconConfig;
  private responseCallbacks: Map<number, (response: string) => void> = new Map();

  constructor(config: RconConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.on('error', (error) => {
        console.error('RCON connection error:', error);
        reject(error);
      });

      this.socket.on('data', this.handleResponse.bind(this));

      this.socket.connect(this.config.port, this.config.host, async () => {
        try {
          await this.authenticate();
          this.authenticated = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.authenticated = false;
    }
  }

  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const packet = this.createPacket(3, this.config.password);

      const callback = (response: string) => {
        resolve();
      };

      this.responseCallbacks.set(id, callback);
      if (this.socket) {
        this.socket.write(packet);
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  }

  async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.authenticated) {
        reject(new Error('Not connected to RCON server'));
        return;
      }

      const id = ++this.requestId;
      const packet = this.createPacket(2, command);

      const callback = (response: string) => {
        resolve(response);
      };

      this.responseCallbacks.set(id, callback);
      this.socket.write(packet);
    });
  }

  private createPacket(type: number, payload: string): Buffer {
    const id = this.requestId;
    const size = Buffer.byteLength(payload) + 10;
    const buffer = Buffer.alloc(size + 4);

    buffer.writeInt32LE(size, 0);
    buffer.writeInt32LE(id, 4);
    buffer.writeInt32LE(type, 8);
    buffer.write(payload, 12);
    buffer.writeInt8(0, size + 2);
    buffer.writeInt8(0, size + 3);

    return buffer;
  }

  private handleResponse(data: Buffer): void {
    let offset = 0;
    while (offset < data.length) {
      if (offset + 4 > data.length) break;
      
      const length = data.readInt32LE(offset);
      if (offset + 4 + length > data.length) break;

      const id = data.readInt32LE(offset + 4);
      const type = data.readInt32LE(offset + 8);
      const payload = data.toString('utf8', offset + 12, offset + 4 + length - 2);

      const callback = this.responseCallbacks.get(id);
      if (callback) {
        callback(payload);
        this.responseCallbacks.delete(id);
      }

      offset += 4 + length;
    }
  }
}
