/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
  console.log("Initiating Deployment for MantleAgentEscrow (Raw Ethers v6 Mode)...");

  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Deploying escrow standard with Architect Wallet: ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Current Architect balance: ${ethers.formatEther(balance)} MNT`);

  // Path to Hardhat compilation artifacts
  const artifactPath = "./artifacts/contracts/MantleAgentEscrow.sol/MantleAgentEscrow.json";
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(
    contractArtifact.abi, 
    contractArtifact.bytecode, 
    deployer
  );

  // Deployed MAC token address on Mantle Sepolia
  const macTokenAddress = "0x69465a67c1C4860f89f2D80fab5dADF33495d171";

  console.log("Broadcasting deployment transaction to Mantle Sepolia ledger...");
  const escrow = await factory.deploy(macTokenAddress);
  
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("==================================================");
  console.log("🚀 MANTLE AGENT ESCROW VAULT SUCCESSFULLY DEPLOYED!");
  console.log(`📜 Escrow Address: ${escrowAddress}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Escrow Deployment Failed:", error);
  process.exitCode = 1;
});