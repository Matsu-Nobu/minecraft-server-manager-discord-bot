import { Client, GatewayIntentBits, REST, Routes, ChannelType, CategoryChannel, TextChannel } from 'discord.js';
import { commands, handleCommand, initServerManager } from './commands/minecraft';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN is not set in environment variables');
}


// Forward Minecraft chat messages to Discord
async function setupChatForwarding() {
  const serverManager = await initServerManager();
  
  serverManager.on('chatMessage', async ({ sender, content }) => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const category = guild.channels.cache.find(
          channel => channel.type === ChannelType.GuildCategory && 
                     channel.name.toLowerCase() === 'minecraft'
        ) as CategoryChannel;

        if (category) {
          const chatChannel = guild.channels.cache.find(
            channel => 
              channel.type === ChannelType.GuildText && 
              channel.name === 'chat' && 
              channel.parentId === category.id
          ) as TextChannel;

          if (chatChannel) {
            await chatChannel.send(`**${sender}**: ${content}`);
          }
        }
      }
    } catch (error) {
      console.error('Error forwarding Minecraft message to Discord:', error);
    }
  });
}

// Register commands when bot is ready
client.once('ready', async () => {
  if (!client.user) {
    console.error('Missing bot user');
    return;
  }

  try {
    await setupChatForwarding();
    const rest = new REST().setToken(token);

    console.log('Started refreshing application (/) commands.');

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully registered application commands.');

    // Setup Minecraft category and chat channel in each guild
    for (const guild of client.guilds.cache.values()) {
      let category = guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === 'minecraft'
      ) as CategoryChannel;

      // Create category if it doesn't exist
      if (!category) {
        console.log(`Creating 'minecraft' category in guild: ${guild.name}`);
        category = await guild.channels.create({
          name: 'minecraft',
          type: ChannelType.GuildCategory,
        });
      }

      // Check if chat channel exists in the category
      const chatChannel = guild.channels.cache.find(
        channel => 
          channel.type === ChannelType.GuildText && 
          channel.name === 'chat' && 
          channel.parentId === category.id
      );

      // Create chat channel if it doesn't exist
      if (!chatChannel) {
        console.log(`Creating 'chat' channel in category 'minecraft' for guild: ${guild.name}`);
        await guild.channels.create({
          name: 'chat',
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }
    }

    console.log(`Logged in as ${client.user.tag}!`);
  } catch (error) {
    console.error('Error setting up bot:', error);
  }
});

// Handle message events
client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Ignore messages from non-text channels
  if (!message.channel.isTextBased()) return;

  // Check if the message is in a channel named 'chat' under 'minecraft' category
  const channel = message.channel as TextChannel;
  if (channel.name !== 'chat' || 
      !channel.parent || 
      channel.parent.name.toLowerCase() !== 'minecraft') {
    return;
  }

  try {
    // Get server manager instance
    const serverManager = await initServerManager();

    // Forward message to Minecraft
    const formattedMessage = `<${message.author.username}>: ${message.content}`;
    await serverManager.broadcastMessage(formattedMessage);
  } catch (error) {
    console.error('Error forwarding message to Minecraft:', error);
    await message.reply('Failed to send message to Minecraft server. Please try again later.');
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
