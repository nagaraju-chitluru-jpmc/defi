// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x4dc860e0aea1eda40f4f983641e2252d8cc838e1ca5beba5c2ab416b6764bd1c";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "9611dd177b99458699ef3133fa5480aa";

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./src/backend/contracts",  // Path to your contract files
    artifacts: "./src/frontend/contracts", // Where to store compiled contracts
    cache: "./cache",
    tests: "./test"
  },
};