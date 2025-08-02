import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
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

// Define slash commands
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!'
  }
];

// Register commands when bot is ready
client.once('ready', async () => {
  if (!client.user || !process.env.DISCORD_TOKEN) {
    console.error('Missing bot user or token');
    return;
  }

  console.log(`Logged in as ${client.user.tag}!`);

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    console.log('Started refreshing application (/) commands.');

    const data = await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully registered application commands:', data);
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }
});

// Login with token
console.log('Attempting to log in to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Error logging in to Discord:', error);
  process.exit(1);
});
