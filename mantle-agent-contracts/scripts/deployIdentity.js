import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Initiating Citadel Vault: ERC-8004 Identity Registry Deployment...");

  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Deploying from Architect Address: ${deployer.address}`);

  const artifactPath = "./artifacts/contracts/ERC8004Identity.sol/ERC8004Identity.json";
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, deployer);
  
  console.log("Broadcasting ERC-8004 Standard to Mantle Sepolia...");
  const registry = await factory.deploy();
  
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  
  console.log("==================================================");
  console.log("🧬 ERC-8004 IDENTITY REGISTRY SUCCESSFULLY AWAKENED!");
  console.log(`📜 Registry Address: ${registryAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment Failed:", error);
  process.exitCode = 1;
});