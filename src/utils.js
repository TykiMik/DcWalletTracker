const FollowModel = require('./models/followModel');
const logger = require('./config/logger')

async function findOneAsync(filter) {
    return FollowModel.findOne(filter).exec();
}

async function sendFormattedTransactionMessage(guildId, channel, transaction, address) {
    try {
        const follow = await findOneAsync({ Address: address, GuildId: guildId });

        let value = parseInt(transaction.value, 16);
        value /= Math.pow(10, 18);

        if (follow.Label === null) {
            channel.send(`${transaction.from} has sent ${value} ETH to ${transaction.to}`);
        } else {
            if (address.toLowerCase() == transaction.from) {
                channel.send(`${follow.Label} has sent ${value} ETH to ${transaction.to}`);
            } else {
                channel.send(`${follow.Label} has received ${value} ETH from ${transaction.from}`);
            }
        }
    } catch (err) {
        channel.send(`Something went wrong while watching ${address}`);
        logger.error(`Message creation error: ${err}`);
        return;
    }
}

module.exports = {sendFormattedTransactionMessage:sendFormattedTransactionMessage, findOneAsync:findOneAsync};