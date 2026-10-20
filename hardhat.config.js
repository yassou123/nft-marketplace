require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris", // Ganache does not support newer opcodes (PUSH0, MCOPY)
    },
  },
  networks: {
    // Ganache GUI default = 7545 ; Ganache CLI default = 8545
    ganache: {
      url: process.env.GANACHE_URL || "http://127.0.0.1:7545",
      chainId: Number(process.env.GANACHE_CHAIN_ID || 1337),
      // Hardhat uses the unlocked Ganache accounts: account[0] = admin/deployer
    },
  },
};
