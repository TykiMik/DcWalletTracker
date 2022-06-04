require('dotenv').config();
const FollowModel = require('./models/followModel');
const Alchemy = require('./config/alchemy');
const { subscriptions } = require('./subscriptions');
const { sendFormattedTransactionMessage, findOneAsync } = require('./utils');
const logger = require('./config/logger')

const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);

async function isLabelExistsOnGuild(label, guildId) {
    const result = await FollowModel.findOne({ Label: label, GuildId: guildId }).exec();
    return (result !== null);
}

async function isAddressExistsOnGuild(address, guildId) {
    const result = await FollowModel.findOne({ Address: address, GuildId: guildId }).exec();
    return (result !== null);
}

function SaveNewFollow(message, newFollow) {
    newFollow.save(err => {
        if (err) {
            logger.error(`Something went wrong while saving: ${err}`);
            message.channel.send(`Something went wrong with following wallet ${newFollow.Address}`);
            return;
        }
        message.channel.send(`Following wallet ${newFollow.Address}`);
    });
}

async function followWalletCommand(message, address, label) {
    if (!isValidAddress(address)) {
        message.channel.send('Invalid wallet address');
        return;
    }

    if (label) {
        try {
            const labelExists = await isLabelExistsOnGuild(label, message.guild.id);
            if (labelExists) {
                message.channel.send('Label already exists');
                return;
            }
        } catch (err) {
            message.channel.send('Something went wrong');
            logger.error(`Error while filtering for label: ${err}`)
            return;
        }
    }

    try {
        const addressExists = await isAddressExistsOnGuild(address, message.guild.id);
        if (addressExists) {
            message.channel.send('Address already followed');
            return;
        }
    } catch (err) {
        message.channel.send('Something went wrong');
        logger.error(`Error while filtering for address: ${err}`)
        return;
    }

    const subscription = Alchemy.eth.subscribe(
        'alchemy_filteredFullPendingTransactions',
        { address: address },
        async (err, transaction) => {
            if (err) {
                message.channel.send(`Something went wrong while watching ${address}`);
                logger.error(`Alchemy error: ${err}`);
                return;
            }
            // sometimes unsubscribing doesn't work so we need to check our stored subscriptions
            if (!subscriptions.has(address + message.guild.id)) {
                return;
            }
            await sendFormattedTransactionMessage(message.guild.id, message.channel, transaction, address);
        })

    subscription.on('connected', async (_) => {
        var newFollow = new FollowModel();
        newFollow.Address = address;
        newFollow.Label = label;
        newFollow.GuildId = message.guild.id;
        newFollow.ChannelId = message.channel.id;

        subscriptions.set(address + message.guild.id, subscription);

        SaveNewFollow(message, newFollow);
    });
}

async function unFollowWalletCommand(message, param) {
    var filter = {
        GuildId: message.guild.id
    };
    if (isValidAddress(param)) {
        filter.Address = param;
    } else {
        filter.Label = param;
    }

    try {
        const result = await findOneAsync(filter);
        if (result) {
            // Alchemy only let us use the unsubscribe method via a subscribe object
            // raw websocket messaging didn't worked either
            const subscription = subscriptions.get(result.Address + message.guild.id);
            subscription.unsubscribe(async (unsub_err, unsub_result) => {
                if (unsub_err || !unsub_result) {
                    logger.error(`Couldn't unfollow wallet: ${result.Address}`);
                    message.channel.send(`Couldn't unsubscribe wallet: ${result.Address}`);
                }
                if (unsub_result) {
                    subscriptions.delete(result.Address + message.guild.id);
                    await FollowModel.deleteOne(filter);
                    logger.info(`Successfully unsubscribed wallet: ${result.Address}`);
                    message.channel.send(`Unfollowed wallet: ${param}`);
                }
            });
        } else {
            message.channel.send(`Wallet not found: ${param}`);
        }
    } catch (err) {
        message.channel.send('Something went wrong');
        logger.error(`Deletion error: ${err}`)
    }
}

module.exports = { followWalletCommand: followWalletCommand, unFollowWalletCommand: unFollowWalletCommand};