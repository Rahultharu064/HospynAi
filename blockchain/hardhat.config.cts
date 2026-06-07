import "@nomicfoundation/hardhat-toolbox";

// Fallback to exporting the plain config object to avoid runtime issues with defineConfig
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
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
      url: process.env.HARDHAT_MAINNET_URL || 'http://localhost:8545',
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
      url: process.env.HARDHAT_OP_URL || 'http://localhost:8545',
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || 'http://localhost:8545',
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};
