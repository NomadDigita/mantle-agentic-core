import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Initiating Neural Forge Deployment to Mantle Testnet (Raw Ethers Mode)...");

  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} MNT`);

  const artifactPath = "./artifacts/contracts/MantleAgentToken.sol/MantleAgentToken.json";
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, deployer);
  const liquidityWallet = deployer.address;
  
  console.log("Broadcasting transaction to the Mantle blockchain...");
  const token = await factory.deploy(liquidityWallet);
  
  await token.waitForDeployment();
  const contractAddress = await token.getAddress();
  
  console.log("==================================================");
  console.log("🚀 MANTLE AGENT CORE (MAC) SUCCESSFULLY DEPLOYED!");
  console.log(`📜 Contract Address: ${contractAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment Failed:", error);
  process.exitCode = 1;
});