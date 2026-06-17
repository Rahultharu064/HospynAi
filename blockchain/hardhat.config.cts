import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

export default {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: process.env.LOCALHOST_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC || "https://polygon-rpc.com",
      chainId: 137,
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY
        ? [process.env.BLOCKCHAIN_PRIVATE_KEY]
        : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};
