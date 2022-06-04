require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_LINK).catch(reason => {
    console.log(`Cannot connect to mongoDB: ${reason}`)
});

module.exports = mongoose;