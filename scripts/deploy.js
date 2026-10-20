const { ethers, network, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name} | Deployer (admin): ${deployer.address}`);

  const nft = await ethers.deployContract("MyNFT");
  await nft.waitForDeployment();
  console.log("MyNFT deployed to:         ", nft.target);

  const market = await ethers.deployContract("NFTMarketplace");
  await market.waitForDeployment();
  console.log("NFTMarketplace deployed to:", market.target);

  // Export addresses + ABIs for the React frontend
  const out = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    MyNFT: { address: nft.target, abi: (await artifacts.readArtifact("MyNFT")).abi },
    NFTMarketplace: { address: market.target, abi: (await artifacts.readArtifact("NFTMarketplace")).abi },
  };
  const file = path.join(__dirname, "..", "frontend", "src", "contracts", "deployments.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Frontend config written to frontend/src/contracts/deployments.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
