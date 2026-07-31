require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {},
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: "YOUR_API_KEY", // Optional, remove if you don't have one
    token: "ETH",
  },
};
