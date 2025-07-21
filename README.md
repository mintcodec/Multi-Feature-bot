# 🤖 Multi-Feature Discord Bot

A comprehensive Discord bot built with JavaScript and discord.js featuring leveling, moderation, custom commands, welcome/goodbye messages, and scheduled announcements.

## ✨ Features

### 🎯 Leveling System
- **Automatic XP tracking** from user messages
- **Level progression** with customizable level-up messages
- **Leaderboard** to see top users
- **Manual XP management** for administrators

### 🛡️ Moderation Tools
- **User management**: Ban, kick, and timeout users
- **Word filter** to automatically delete inappropriate content
- **Anti-link protection** to prevent spam links
- **Spam detection** and automatic message cleanup

### 🔧 Custom Commands
- **Create custom slash commands** with personalized responses
- **Easy management** - add, remove, and list custom commands
- **Admin-only creation** to maintain server control

### 👋 Welcome & Goodbye System
- **Automated welcome messages** for new members
- **Customizable goodbye messages** when members leave
- **Flexible message templates** with user placeholders

### 📅 Scheduled Messages
- **Recurring announcements** using cron expressions
- **Flexible scheduling** - daily, weekly, monthly, or custom intervals
- **Multi-channel support** for different announcement types

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- A Discord account and server
- Basic knowledge of Discord bot setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/discord-bot.git
   cd discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install discord.js node-cron
   ```

3. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Add Bot"
   - Copy the **Bot Token** (keep this secret!)
   - Go to "General Information" and copy the **Application ID** (Client ID)

4. **Configure the bot**
   - Open `bot.js` in your text editor
   - Replace `YOUR_BOT_TOKEN_HERE` with your bot's token
   - Replace `YOUR_CLIENT_ID_HERE` with your application ID

5. **Set up bot permissions**
   - In the Discord Developer Portal, go to "OAuth2" → "URL Generator"
   - Select **Scopes**: `bot` and `applications.commands`
   - Select **Bot Permissions**:
     - Send Messages
     - Use Slash Commands
     - Ban Members
     - Kick Members
     - Moderate Members (for timeouts)
     - Manage Messages
     - Read Message History
   - Copy the generated URL and open it to invite your bot

6. **Run the bot**
   ```bash
   node bot.js
   ```

## 📋 Commands Reference

### 🎯 Leveling Commands
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/level [user]` | Check your or someone else's level and XP | Everyone |
| `/leaderboard` | Display the server's top 10 users | Everyone |
| `/addxp <user> <amount>` | Manually add XP to a user | Administrator |

### 🔧 Custom Commands
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/createcommand <name> <response>` | Create a new custom command | Administrator |
| `/deletecommand <name>` | Delete an existing custom command | Administrator |
| `/listcommands` | Show all available custom commands | Everyone |

### 🛡️ Moderation Commands
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/ban <user> [reason]` | Ban a user from the server | Ban Members |
| `/kick <user> [reason]` | Kick a user from the server | Kick Members |
| `/mute <user> <duration> [reason]` | Timeout a user (duration in minutes) | Moderate Members |
| `/unmute <user>` | Remove timeout from a user | Moderate Members |
| `/addword <word>` | Add a word to the filter | Administrator |
| `/removeword <word>` | Remove a word from the filter | Administrator |
| `/toggleantilink` | Enable/disable anti-link protection | Administrator |

### ⚙️ Configuration Commands
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/setwelcome <channel> [message]` | Set welcome channel and message | Administrator |
| `/setgoodbye <message>` | Set goodbye message | Administrator |

### 📅 Scheduled Messages
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/schedulemessage <channel> <message> <cron>` | Create a recurring message | Administrator |
| `/listscheduled` | View all scheduled messages | Administrator |
| `/deletescheduled <id>` | Delete a scheduled message by ID | Administrator |

## ⏰ Cron Expression Examples

| Expression | Description |
|------------|-------------|
| `0 12 * * *` | Daily at 12:00 PM |
| `0 */6 * * *` | Every 6 hours |
| `0 9 * * 1` | Every Monday at 9:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 0 1 * *` | First day of every month at midnight |

## 📁 File Structure

```
discord-bot/
├── bot.js                 # Main bot file
├── package.json          # Node.js dependencies
├── README.md            # This file
└── bot_data/           # Auto-created data folder
    ├── levels.json     # User XP and level data
    ├── custom_commands.json # Custom commands
    ├── config.json     # Bot configuration
    └── scheduled_messages.json # Scheduled messages
```

## 🔧 Configuration

The bot automatically creates a `bot_data` folder with configuration files:

- **levels.json**: Stores user XP, levels, and message counts
- **custom_commands.json**: Stores custom slash commands
- **config.json**: General bot settings (welcome messages, word filters, etc.)
- **scheduled_messages.json**: Recurring message schedules

## 🛠️ Customization

### Message Templates
You can use these placeholders in welcome/goodbye messages:
- `{user}` - Mentions the user (@username)
- `{username}` - Plain username without mention

### Leveling System
- XP is awarded automatically for each message
- Level calculation: `Level = floor(0.1 * sqrt(XP))`
- Customize level-up messages in the config

### Word Filter
- Add inappropriate words using `/addword`
- Case-insensitive matching
- Automatically deletes messages containing filtered words

## 🚨 Troubleshooting

### Bot doesn't respond to commands
- Check that the bot has proper permissions in your server
- Ensure slash commands are registered (they appear when you type `/`)
- Verify the bot is online and connected

### Permission errors
- Make sure the bot's role is higher than the users it's trying to moderate
- Check that required permissions are granted in server settings

### Data not saving
- Ensure the bot has write permissions in its directory
- Check that the `bot_data` folder is created automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [troubleshooting section](#-troubleshooting)
2. Look through existing [GitHub Issues](https://github.com/yourusername/discord-bot/issues)
3. Create a new issue with detailed information about your problem

## 🙏 Acknowledgments

- [discord.js](https://discord.js.org/) - The Discord API library
- [node-cron](https://www.npmjs.com/package/node-cron) - Task scheduling
- Discord.js community for excellent documentation and support

---

**Made with ❤️ for Discord communities**
