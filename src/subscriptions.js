const FollowModel = require('./models/followModel');
const Alchemy = require('./config/alchemy');
const { sendFormattedTransactionMessage } = require('./utils');
const logger = require('./config/logger')


const subscriptions = new Map();

function startUp(client) {
    FollowModel.find({}, async (err, follows) => {
        if (err) {
            logger.error("Start Up failed, couldn't get follow documents");
            return;
        }

        follows.map(async follow => {
            const guild = await client.guilds.fetch(follow.GuildId);
            const channel = await guild.channels.fetch(follow.ChannelId);

            const subscription = Alchemy.eth.subscribe(
                'alchemy_filteredFullPendingTransactions',
                { address: follow.Address },
                async (alchemy_err, transaction) => {
                    if (err) {
                        channel.send(`Something went wrong while watching ${follow.Address}`);
                        logger.error(`Alchemy error: ${alchemy_err}`);
                        return;
                    }
                    // sometimes unsubscribing doesn't work despite the successful response
                    // so we need to check our stored subscriptions
                    if (!subscriptions.has(follow.Address + guild.id)) {
                        return;
                    }
                    await sendFormattedTransactionMessage(follow.GuildId, channel, transaction, follow.Address);
                })

            subscription.on('connected', async (_) => {
                subscriptions.set(follow.Address + follow.GuildId, subscription);
                logger.info(`Connected ws for wallet ${follow.Address}`)
            });
        })
    })
}
module.exports = { subscriptions: subscriptions, startUp: startUp };