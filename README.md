# Minecraft Server Manager Bot

Discord bot to manage Minecraft servers via RCON.

## Features

- Server management commands (/mc server)
  - list: Show online players
  - say: Send message to server
- World management commands (/mc world)
  - time: Set time (day/night)
  - weather: Set weather (clear/rain/thunder)

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` file with your settings:
- `DISCORD_TOKEN`: Your Discord bot token
- `MINECRAFT_RCON_HOST`: Minecraft server hostname or IP address
- `MINECRAFT_RCON_PORT`: RCON port (default: 25575)
- `MINECRAFT_RCON_PASSWORD`: RCON password set in server.properties

3. Start the bot:
```bash
docker compose up -d
```

## Requirements

- Docker and Docker Compose
- Minecraft server with RCON enabled

### Enabling RCON on Minecraft Server

1. Edit `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_password_here
```

2. Restart Minecraft server

3. Make sure your firewall allows connections to the RCON port
