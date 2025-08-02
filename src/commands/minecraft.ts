import { CommandInteraction } from 'discord.js';
import { MinecraftServerManager } from '../minecraft/server-manager';
import { readFile } from 'fs/promises';

async function loadPrivateKey(): Promise<string> {
  // Always use fixed path in container
  return readFile('/home/node/.ssh/id_ed25519', 'utf-8');
}

async function initializeServerManager() {
  const privateKey = await loadPrivateKey();
  return new MinecraftServerManager({
    host: process.env.MINECRAFT_RCON_HOST || 'localhost',
    port: parseInt(process.env.MINECRAFT_RCON_PORT || '25575'),
    password: process.env.MINECRAFT_RCON_PASSWORD || '',
    ssh: {
      host: process.env.MINECRAFT_SSH_HOST || 'localhost',
      port: parseInt(process.env.MINECRAFT_SSH_PORT || '22'),
      username: process.env.MINECRAFT_SSH_USERNAME || '',
      privateKey
    },
    logPath: process.env.MINECRAFT_LOG_PATH || ''
  });
}

// Export serverManager so it can be used by other modules
export let serverManager: MinecraftServerManager;

// Initialize the server manager
export async function initServerManager(): Promise<MinecraftServerManager> {
  if (!serverManager) {
    serverManager = await initializeServerManager();
    await serverManager.connect();
  }
  return serverManager;
}

export const commands = [
  {
    name: 'mc',
    description: 'Minecraft server commands',
    options: [
      {
        name: 'list',
        description: 'List online players',
        type: 1,
      },
      {
        name: 'time',
        description: 'Set time',
        type: 1,
        options: [
          {
            name: 'value',
            description: 'Time to set',
            type: 3,
            required: true,
            choices: [
              {
                name: 'day',
                value: 'day'
              },
              {
                name: 'night',
                value: 'night'
              }
            ]
          }
        ]
      },
      {
        name: 'weather',
        description: 'Set weather',
        type: 1,
        options: [
          {
            name: 'value',
            description: 'Weather to set',
            type: 3,
            required: true,
            choices: [
              {
                name: 'clear',
                value: 'clear'
              },
              {
                name: 'rain',
                value: 'rain'
              },
              {
                name: 'thunder',
                value: 'thunder'
              }
            ]
          }
        ]
      }
    ]
  }
];

export async function handleCommand(interaction: CommandInteraction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (!serverManager) {
      serverManager = await initializeServerManager();
    }

    // Ensure connection to Minecraft server
    if (!serverManager.connected) {
      await serverManager.connect();
    }

    const subcommand = interaction.options.getSubcommand();
    let response: string;

    switch (subcommand) {
      case 'list':
        response = await serverManager.listPlayers();
        break;
      case 'time': {
        const time = interaction.options.getString('value', true) as 'day' | 'night';
        response = await serverManager.setTime(time);
        break;
      }
      case 'weather': {
        const weather = interaction.options.getString('value', true) as 'clear' | 'rain' | 'thunder';
        response = await serverManager.setWeather(weather);
        break;
      }
      default:
        response = 'Unknown command';
    }

    await interaction.reply(response);
  } catch (error) {
    console.error('Error handling command:', error);
    if (!interaction.replied) {
      await interaction.reply('Failed to execute command. Please try again later.');
    }
  }
}
