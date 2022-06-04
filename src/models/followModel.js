const db = require('../config/db');

var FollowModel = db.model('Follow', {
    GuildId: {
        type: String,
        required: true
    },
    ChannelId: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    Label: String
});

module.exports = FollowModel;