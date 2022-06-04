require('dotenv').config();
const { Client, Intents } = require('discord.js');
const  {followWalletCommand, unFollowWalletCommand} = require('./commands');
const {startUp} = require('./subscriptions');
const logger = require('./config/logger')

const COMMAND_PREFIX = '!'

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready',async () => {
    logger.info(`Logged in as ${client.user.tag}!`);
    startUp(client);
});

client.on("messageCreate", message => {
    if (message.author.bot) return;

    if (message.content.indexOf(COMMAND_PREFIX) !== 0) return;

    const [command, ...args] = message.content
        .trim()
        .substring(COMMAND_PREFIX.length)
        .split(/\s+/);

    if (command === 'followwallet') {
        if (args.length == 0) {
            message.channel.send('followwallet command requires atleast the wallet address as argument');
            return;
        }
        if (args.length > 2) {
            message.channel.send('Too many arguments for follow wallet command');
            return;
        }
        logger.info(`${command} with args: ${args} ${args.length}`);

        const address = args[0];
        const label = (args.length > 1) ? args[1] : null;

        followWalletCommand(message, address, label);
    }
    else if (command === 'unfollowwallet') {
        if (args.length == 0) {
            message.channel.send('unfollowwallet command requires the wallet address or the label as argument');
            return;
        }
        if (args.length > 1) {
            message.channel.send('Too many arguments for follow wallet command');
            return;
        }
        logger.info(`${command} with args: ${args}`);

        const param = args[0];
        
        unFollowWalletCommand(message, param);
    }
});

client.login(process.env.BOT_TOKEN);
