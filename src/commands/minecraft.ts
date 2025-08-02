import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { MinecraftServerManager } from '../minecraft/server-manager';
import dotenv from 'dotenv';

dotenv.config();

const serverManager = new MinecraftServerManager({
  host: process.env.MINECRAFT_RCON_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_RCON_PORT || '25575'),
  password: process.env.MINECRAFT_RCON_PASSWORD || '',
});

const command = new SlashCommandBuilder()
  .setName('mc')
  .setDescription('Minecraft server commands')
  .addSubcommandGroup(group =>
    group
      .setName('server')
      .setDescription('Server management commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('list')
          .setDescription('List online players')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('say')
          .setDescription('Broadcast a message to the server')
          .addStringOption(option =>
            option
              .setName('message')
              .setDescription('The message to broadcast')
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName('world')
      .setDescription('World management commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('time')
          .setDescription('Set the time')
          .addStringOption(option =>
            option
              .setName('value')
              .setDescription('Time value')
              .setRequired(true)
              .addChoices(
                { name: 'Day', value: 'day' },
                { name: 'Night', value: 'night' }
              )
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('weather')
          .setDescription('Set the weather')
          .addStringOption(option =>
            option
              .setName('type')
              .setDescription('Weather type')
              .setRequired(true)
              .addChoices(
                { name: 'Clear', value: 'clear' },
                { name: 'Rain', value: 'rain' },
                { name: 'Thunder', value: 'thunder' }
              )
          )
      )
  );

export const commands = [command.toJSON()];

export async function handleCommand(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const group = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  // 最初にdeferReply
  await interaction.deferReply({ ephemeral: true });

  try {
    // RCON接続確認
    if (!serverManager.connected) {
      await serverManager.connect();
    }

    let response: string;
    let content = '❌ Unknown command';  // デフォルト値を設定
    
    switch (group) {
      case 'server':
        switch (subcommand) {
          case 'list':
            response = await serverManager.listPlayers();
            content = `👥 **Online Players**\n${response}`;
            break;

          case 'say':
            const message = interaction.options.getString('message', true);
            response = await serverManager.broadcastMessage(message);
            content = `📢 **Message sent to server**\n${response}`;
            break;
        }
        break;

      case 'world':
        switch (subcommand) {
          case 'time':
            const time = interaction.options.getString('value', true) as 'day' | 'night';
            response = await serverManager.setTime(time);
            const timeEmoji = time === 'day' ? '☀️' : '🌙';
            content = `${timeEmoji} **Time changed**\n${response}`;
            break;

          case 'weather':
            const weather = interaction.options.getString('type', true) as 'clear' | 'rain' | 'thunder';
            response = await serverManager.setWeather(weather);
            const weatherEmoji = {
              clear: '☀️',
              rain: '🌧️',
              thunder: '⛈️'
            }[weather];
            content = `${weatherEmoji} **Weather changed**\n${response}`;
            break;
        }
        break;
    }

    await interaction.editReply({ content });
  } catch (error) {
    console.error('Error executing Minecraft command:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    await interaction.editReply({
      content: `❌ **Error**\n${errorMessage}`
    });
  }
}
