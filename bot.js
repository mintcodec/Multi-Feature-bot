const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Bot configuration
const TOKEN = 'TOKEN';
const CLIENT_ID = 'CLIENT_ID';

// Data storage files
const DATA_DIR = './bot_data';
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');
const CUSTOM_COMMANDS_FILE = path.join(DATA_DIR, 'custom_commands.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const SCHEDULED_MESSAGES_FILE = path.join(DATA_DIR, 'scheduled_messages.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data files
function initializeDataFiles() {
    if (!fs.existsSync(LEVELS_FILE)) {
        fs.writeFileSync(LEVELS_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(CUSTOM_COMMANDS_FILE)) {
        fs.writeFileSync(CUSTOM_COMMANDS_FILE, JSON.stringify({}));
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            welcomeChannel: null,
            welcomeMessage: "Welcome to the server, {user}! 👋",
            goodbyeMessage: "Goodbye {user}, thanks for being part of our community! 👋",
            levelUpMessage: "🎉 Congratulations {user}! You've reached level {level}!",
            blockedWords: [],
            antiLink: false,
            spamProtection: true
        }));
    }
    if (!fs.existsSync(SCHEDULED_MESSAGES_FILE)) {
        fs.writeFileSync(SCHEDULED_MESSAGES_FILE, JSON.stringify([]));
    }
}

// Data management functions
function loadData(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Leveling system functions
function calculateLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

function getXPForLevel(level) {
    return Math.pow(level / 0.1, 2);
}

function addXP(userId, xp = 1) {
    const levels = loadData(LEVELS_FILE);
    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 0, messages: 0 };
    }
    
    const oldLevel = levels[userId].level;
    levels[userId].xp += xp;
    levels[userId].messages += 1;
    levels[userId].level = calculateLevel(levels[userId].xp);
    
    saveData(LEVELS_FILE, levels);
    
    return {
        leveledUp: levels[userId].level > oldLevel,
        newLevel: levels[userId].level,
        totalXP: levels[userId].xp
    };
}

// Initialize bot
initializeDataFiles();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Slash commands
const commands = [
    // Leveling commands
    new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your or someone else\'s level')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check level for')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the server leaderboard'),

    new SlashCommandBuilder()
        .setName('addxp')
        .setDescription('Add XP to a user (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add XP to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of XP to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Custom commands
    new SlashCommandBuilder()
        .setName('createcommand')
        .setDescription('Create a custom command (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Command name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('response')
                .setDescription('Command response')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('deletecommand')
        .setDescription('Delete a custom command (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Command name to delete')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('listcommands')
        .setDescription('List all custom commands'),

    // Moderation commands
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove timeout from')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('addword')
        .setDescription('Add a word to the filter (Admin only)')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('Word to filter')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('removeword')
        .setDescription('Remove a word from the filter (Admin only)')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('Word to remove from filter')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Configuration commands
    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set welcome channel and message (Admin only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Welcome channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Welcome message (use {user} for mention)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('setgoodbye')
        .setDescription('Set goodbye message (Admin only)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Goodbye message (use {user} for username)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('toggleantilink')
        .setDescription('Toggle anti-link protection (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // Scheduled messages
    new SlashCommandBuilder()
        .setName('schedulemessage')
        .setDescription('Schedule a recurring message (Admin only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send message in')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('cron')
                .setDescription('Cron expression (e.g., "0 12 * * *" for daily at 12:00)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('listscheduled')
        .setDescription('List all scheduled messages (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('deletescheduled')
        .setDescription('Delete a scheduled message (Admin only)')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID of scheduled message to delete')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Register slash commands
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

// Bot event handlers
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    registerCommands();
    setupScheduledMessages();
});

// Message handling for XP and moderation
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const config = loadData(CONFIG_FILE);
    
    // Spam and moderation checks
    if (config.spamProtection && await isSpam(message)) {
        await message.delete();
        return;
    }
    
    if (config.antiLink && containsLink(message.content)) {
        await message.delete();
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('Links are not allowed in this server!');
        await message.channel.send({ embeds: [embed] });
        return;
    }
    
    if (config.blockedWords.some(word => message.content.toLowerCase().includes(word.toLowerCase()))) {
        await message.delete();
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setDescription('Your message contained a blocked word!');
        await message.channel.send({ embeds: [embed] });
        return;
    }
    
    // Add XP
    const result = addXP(message.author.id);
    if (result.leveledUp) {
        const levelUpMsg = config.levelUpMessage
            .replace('{user}', `<@${message.author.id}>`)
            .replace('{level}', result.newLevel);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(levelUpMsg);
        
        await message.channel.send({ embeds: [embed] });
    }
});

// Welcome messages
client.on('guildMemberAdd', async (member) => {
    const config = loadData(CONFIG_FILE);
    if (config.welcomeChannel) {
        const channel = member.guild.channels.cache.get(config.welcomeChannel);
        if (channel) {
            const welcomeMsg = config.welcomeMessage.replace('{user}', `<@${member.id}>`);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(welcomeMsg);
            await channel.send({ embeds: [embed] });
        }
    }
});

// Goodbye messages
client.on('guildMemberRemove', async (member) => {
    const config = loadData(CONFIG_FILE);
    if (config.welcomeChannel) {
        const channel = member.guild.channels.cache.get(config.welcomeChannel);
        if (channel) {
            const goodbyeMsg = config.goodbyeMessage.replace('{user}', member.user.username);
            const embed = new EmbedBuilder()
                .setColor('#ff6600')
                .setDescription(goodbyeMsg);
            await channel.send({ embeds: [embed] });
        }
    }
});

// Slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case 'level':
                await handleLevelCommand(interaction);
                break;
            case 'leaderboard':
                await handleLeaderboardCommand(interaction);
                break;
            case 'addxp':
                await handleAddXPCommand(interaction);
                break;
            case 'createcommand':
                await handleCreateCommand(interaction);
                break;
            case 'deletecommand':
                await handleDeleteCommand(interaction);
                break;
            case 'listcommands':
                await handleListCommands(interaction);
                break;
            case 'ban':
                await handleBanCommand(interaction);
                break;
            case 'kick':
                await handleKickCommand(interaction);
                break;
            case 'mute':
                await handleMuteCommand(interaction);
                break;
            case 'unmute':
                await handleUnmuteCommand(interaction);
                break;
            case 'addword':
                await handleAddWordCommand(interaction);
                break;
            case 'removeword':
                await handleRemoveWordCommand(interaction);
                break;
            case 'setwelcome':
                await handleSetWelcomeCommand(interaction);
                break;
            case 'setgoodbye':
                await handleSetGoodbyeCommand(interaction);
                break;
            case 'toggleantilink':
                await handleToggleAntiLinkCommand(interaction);
                break;
            case 'schedulemessage':
                await handleScheduleMessageCommand(interaction);
                break;
            case 'listscheduled':
                await handleListScheduledCommand(interaction);
                break;
            case 'deletescheduled':
                await handleDeleteScheduledCommand(interaction);
                break;
            default:
                // Check for custom commands
                await handleCustomCommand(interaction);
        }
    } catch (error) {
        console.error('Error handling command:', error);
        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
    }
});

// Command handlers
async function handleLevelCommand(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const levels = loadData(LEVELS_FILE);
    const userData = levels[targetUser.id] || { xp: 0, level: 0, messages: 0 };
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${targetUser.username}'s Level`)
        .addFields(
            { name: 'Level', value: userData.level.toString(), inline: true },
            { name: 'XP', value: userData.xp.toString(), inline: true },
            { name: 'Messages', value: userData.messages.toString(), inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL());
    
    await interaction.reply({ embeds: [embed] });
}

async function handleLeaderboardCommand(interaction) {
    const levels = loadData(LEVELS_FILE);
    const sortedUsers = Object.entries(levels)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10);
    
    let description = '';
    for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, data] = sortedUsers[i];
        const user = await client.users.fetch(userId);
        description += `${i + 1}. **${user.username}** - Level ${data.level} (${data.xp} XP)\n`;
    }
    
    const embed = new EmbedBuilder()
        .setColor('#gold')
        .setTitle('🏆 Server Leaderboard')
        .setDescription(description || 'No users found');
    
    await interaction.reply({ embeds: [embed] });
}

async function handleAddXPCommand(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    
    const result = addXP(user.id, amount);
    
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setDescription(`Added ${amount} XP to ${user.username}. They now have ${result.totalXP} XP and are level ${result.newLevel}.`);
    
    await interaction.reply({ embeds: [embed] });
}

async function handleCreateCommand(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    const response = interaction.options.getString('response');
    
    const customCommands = loadData(CUSTOM_COMMANDS_FILE);
    customCommands[name] = response;
    saveData(CUSTOM_COMMANDS_FILE, customCommands);
    
    await interaction.reply(`Custom command \`/${name}\` created!`);
}

async function handleDeleteCommand(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    
    const customCommands = loadData(CUSTOM_COMMANDS_FILE);
    if (customCommands[name]) {
        delete customCommands[name];
        saveData(CUSTOM_COMMANDS_FILE, customCommands);
        await interaction.reply(`Custom command \`/${name}\` deleted!`);
    } else {
        await interaction.reply(`Custom command \`/${name}\` not found!`);
    }
}

async function handleListCommands(interaction) {
    const customCommands = loadData(CUSTOM_COMMANDS_FILE);
    const commandList = Object.keys(customCommands);
    
    if (commandList.length === 0) {
        await interaction.reply('No custom commands found.');
        return;
    }
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Custom Commands')
        .setDescription(commandList.map(cmd => `\`/${cmd}\``).join(', '));
    
    await interaction.reply({ embeds: [embed] });
}

async function handleCustomCommand(interaction) {
    const customCommands = loadData(CUSTOM_COMMANDS_FILE);
    const response = customCommands[interaction.commandName];
    
    if (response) {
        await interaction.reply(response);
    }
}

async function handleBanCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
        await interaction.guild.members.ban(user, { reason });
        await interaction.reply(`${user.username} has been banned. Reason: ${reason}`);
    } catch (error) {
        await interaction.reply('Failed to ban user.');
    }
}

async function handleKickCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.kick(reason);
        await interaction.reply(`${user.username} has been kicked. Reason: ${reason}`);
    } catch (error) {
        await interaction.reply('Failed to kick user.');
    }
}

async function handleMuteCommand(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(duration * 60 * 1000, reason);
        await interaction.reply(`${user.username} has been timed out for ${duration} minutes. Reason: ${reason}`);
    } catch (error) {
        await interaction.reply('Failed to timeout user.');
    }
}

async function handleUnmuteCommand(interaction) {
    const user = interaction.options.getUser('user');
    
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(null);
        await interaction.reply(`${user.username}'s timeout has been removed.`);
    } catch (error) {
        await interaction.reply('Failed to remove timeout.');
    }
}

async function handleAddWordCommand(interaction) {
    const word = interaction.options.getString('word').toLowerCase();
    const config = loadData(CONFIG_FILE);
    
    if (!config.blockedWords.includes(word)) {
        config.blockedWords.push(word);
        saveData(CONFIG_FILE, config);
        await interaction.reply(`Word "${word}" added to filter.`);
    } else {
        await interaction.reply(`Word "${word}" is already in the filter.`);
    }
}

async function handleRemoveWordCommand(interaction) {
    const word = interaction.options.getString('word').toLowerCase();
    const config = loadData(CONFIG_FILE);
    
    const index = config.blockedWords.indexOf(word);
    if (index > -1) {
        config.blockedWords.splice(index, 1);
        saveData(CONFIG_FILE, config);
        await interaction.reply(`Word "${word}" removed from filter.`);
    } else {
        await interaction.reply(`Word "${word}" not found in filter.`);
    }
}

async function handleSetWelcomeCommand(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message') || "Welcome to the server, {user}! 👋";
    
    const config = loadData(CONFIG_FILE);
    config.welcomeChannel = channel.id;
    config.welcomeMessage = message;
    saveData(CONFIG_FILE, config);
    
    await interaction.reply(`Welcome channel set to ${channel} with message: "${message}"`);
}

async function handleSetGoodbyeCommand(interaction) {
    const message = interaction.options.getString('message');
    
    const config = loadData(CONFIG_FILE);
    config.goodbyeMessage = message;
    saveData(CONFIG_FILE, config);
    
    await interaction.reply(`Goodbye message set to: "${message}"`);
}

async function handleToggleAntiLinkCommand(interaction) {
    const config = loadData(CONFIG_FILE);
    config.antiLink = !config.antiLink;
    saveData(CONFIG_FILE, config);
    
    await interaction.reply(`Anti-link protection ${config.antiLink ? 'enabled' : 'disabled'}.`);
}

async function handleScheduleMessageCommand(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const cronExpression = interaction.options.getString('cron');
    
    const scheduledMessages = loadData(SCHEDULED_MESSAGES_FILE);
    const id = Date.now();
    
    const scheduledMessage = {
        id,
        channelId: channel.id,
        message,
        cron: cronExpression,
        guildId: interaction.guildId
    };
    
    scheduledMessages.push(scheduledMessage);
    saveData(SCHEDULED_MESSAGES_FILE, scheduledMessages);
    
    // Schedule the message
    cron.schedule(cronExpression, async () => {
        const targetChannel = client.channels.cache.get(channel.id);
        if (targetChannel) {
            await targetChannel.send(message);
        }
    });
    
    await interaction.reply(`Message scheduled! ID: ${id}`);
}

async function handleListScheduledCommand(interaction) {
    const scheduledMessages = loadData(SCHEDULED_MESSAGES_FILE);
    const guildMessages = scheduledMessages.filter(msg => msg.guildId === interaction.guildId);
    
    if (guildMessages.length === 0) {
        await interaction.reply('No scheduled messages found.');
        return;
    }
    
    let description = '';
    guildMessages.forEach(msg => {
        description += `**ID:** ${msg.id}\n**Channel:** <#${msg.channelId}>\n**Cron:** ${msg.cron}\n**Message:** ${msg.message.substring(0, 50)}...\n\n`;
    });
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Scheduled Messages')
        .setDescription(description);
    
    await interaction.reply({ embeds: [embed] });
}

async function handleDeleteScheduledCommand(interaction) {
    const id = interaction.options.getInteger('id');
    const scheduledMessages = loadData(SCHEDULED_MESSAGES_FILE);
    
    const index = scheduledMessages.findIndex(msg => msg.id === id && msg.guildId === interaction.guildId);
    if (index > -1) {
        scheduledMessages.splice(index, 1);
        saveData(SCHEDULED_MESSAGES_FILE, scheduledMessages);
        await interaction.reply(`Scheduled message ${id} deleted.`);
    } else {
        await interaction.reply(`Scheduled message ${id} not found.`);
    }
}

// Utility functions
async function isSpam(message) {
    // Simple spam detection - could be enhanced
    return false; // Placeholder
}

function containsLink(content) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(content);
}

function setupScheduledMessages() {
    const scheduledMessages = loadData(SCHEDULED_MESSAGES_FILE);
    
    scheduledMessages.forEach(scheduled => {
        cron.schedule(scheduled.cron, async () => {
            const channel = client.channels.cache.get(scheduled.channelId);
            if (channel) {
                await channel.send(scheduled.message);
            }
        });
    });
}

// Login
client.login(TOKEN);
