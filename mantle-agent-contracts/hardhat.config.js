

import "@nomicfoundation/hardhat-toolbox"; // Registers Mocha, Chai, and test runners globally
import * as dotenv from "dotenv";
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun", // Enables the MCOPY opcode optimized for Mantle Sepolia
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mantleTestnet: {
      type: "http",
      url: "https://rpc.sepolia.mantle.xyz", 
      chainId: 5003,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  }
};
