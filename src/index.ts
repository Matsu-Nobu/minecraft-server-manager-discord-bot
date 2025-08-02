import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { commands, handleCommand } from './commands/minecraft';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN is not set in environment variables');
}

// Register commands when bot is ready
client.once('ready', async () => {
  if (!client.user) {
    console.error('Missing bot user');
    return;
  }

  try {
    const rest = new REST().setToken(token);

    console.log('Started refreshing application (/) commands.');

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully registered application commands.');
    console.log(`Logged in as ${client.user.tag}!`);
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'mc') {
    await handleCommand(interaction);
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Login with token
client.login(token).catch((error) => {
  console.error('Error logging in to Discord:', error);
  process.exit(1);
});
