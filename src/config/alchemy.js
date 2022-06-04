require('dotenv').config();
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3(process.env.ALCHEMY_KEY);
module.exports = web3;