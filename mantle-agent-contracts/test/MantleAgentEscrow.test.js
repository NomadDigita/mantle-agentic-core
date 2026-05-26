/*
“Must always include our chat rule from the beginning of this section to the end the rules and ways in all code outputs and design assets.”
*/

import { expect } from "chai";
import hre from "hardhat"; // Import the main Hardhat Runtime Environment cleanly

describe("MantleAgentEscrow Unit-Test Suite", function () {
  let macToken;
  let escrow;
  let owner;
  let user;
  let treasury;
  let recipient;
  
  beforeEach(async function () {
    // --- RESOLVES LAZY-LOADING RACE CONDITIONS PERMANENTLY ---
    // Pull ethers dynamically inside the hook AFTER the runtime has fully booted
    const { ethers } = hre;
    
    // Retrieve signers securely from the runtime environment
    [owner, user, treasury, recipient] = await ethers.getSigners();
    
    // 1. Deploy MantleAgentToken (Owner is excluded from fees in constructor)
    const TokenFactory = await ethers.getContractFactory("MantleAgentToken");
    macToken = await TokenFactory.deploy(owner.address);
    await macToken.waitForDeployment();
    
    // 2. Deploy MantleAgentEscrow, passing the token contract address to constructor
    const EscrowFactory = await ethers.getContractFactory("MantleAgentEscrow");
    escrow = await EscrowFactory.deploy(await macToken.getAddress());
    await escrow.waitForDeployment();
    
    // 3. Fund user with MAC tokens from Owner wallet (0% tax since Owner is sender)
    const fundAmount = ethers.parseEther("1000");
    await macToken.transfer(user.address, fundAmount);
  });

  describe("Deployment State", function () {
    it("Should correctly map the target MAC token contract", async function () {
      expect(await escrow.macToken()).to.equal(await macToken.getAddress());
    });

    it("Should set the deployer as the initial owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });
  });

  describe("Collateral Escrow Deposits", function () {
    it("Should successfully deposit and apply the exact 5% token transfer tax", async function () {
      const { ethers } = hre; // Pull dynamically inside sub-tests
      const depositAmount = ethers.parseEther("100");
      const expectedEscrowCollateral = ethers.parseEther("95"); // 100 - 5% tax

      // User approves Escrow contract to spend MAC tokens
      await macToken.connect(user).approve(await escrow.getAddress(), depositAmount);

      // Generate a unique 32-byte position ID matching our AI decision trace
      const positionId = ethers.keccak256(ethers.toUtf8Bytes("position-trace-hash-01"));

      // Execute deposit
      await expect(escrow.connect(user).depositEscrow(positionId, depositAmount))
        .to.emit(escrow, "EscrowDeposited")
        .withArgs(positionId, user.address, expectedEscrowCollateral);

      // Verify active session state
      const session = await escrow.getEscrow(positionId);
      expect(session.depositor).to.equal(user.address);
      expect(session.amount).to.equal(expectedEscrowCollateral);
      expect(session.isActive).to.be.true;
      expect(session.depositTimestamp).to.be.gt(0);
    });

    it("Should reject deposits with zero amount parameters", async function () {
      const { ethers } = hre;
      const positionId = ethers.keccak256(ethers.toUtf8Bytes("position-trace-hash-02"));
      await expect(escrow.connect(user).depositEscrow(positionId, 0))
        .to.be.revertedWith("Collateral must exceed zero");
    });

    it("Should prevent overwriting an already active escrow session", async function () {
      const { ethers } = hre;
      const depositAmount = ethers.parseEther("50");
      const positionId = ethers.keccak256(ethers.toUtf8Bytes("position-trace-hash-03"));

      await macToken.connect(user).approve(await escrow.getAddress(), depositAmount * 2n);
      
      // First deposit
      await escrow.connect(user).depositEscrow(positionId, depositAmount);

      // Second deposit attempt on same ID
      await expect(escrow.connect(user).depositEscrow(positionId, depositAmount))
        .to.be.revertedWith("Escrow session already active");
    });
  });

  describe("Sovereign Escrow Releases", function () {
    let positionId;
    let lockedAmount;

    beforeEach(async function () {
      const { ethers } = hre;
      const depositAmount = ethers.parseEther("100");
      lockedAmount = ethers.parseEther("95"); // 5% fee-on-transfer applied
      positionId = ethers.keccak256(ethers.toUtf8Bytes("position-trace-hash-04"));

      await macToken.connect(user).approve(await escrow.getAddress(), depositAmount);
      await escrow.connect(user).depositEscrow(positionId, depositAmount);
    });

    it("Should programmatically release locked collateral back to recipient (called by Owner/Agent)", async function () {
      const { ethers } = hre;
      const initialRecipientBalance = await macToken.balanceOf(recipient.address);

      // Owner (Sovereign backend agent) releases escrow
      await expect(escrow.connect(owner).releaseEscrow(positionId, recipient.address))
        .to.emit(escrow, "EscrowReleased")
        .withArgs(positionId, recipient.address, lockedAmount);

      // Verify session became inactive
      const session = await escrow.getEscrow(positionId);
      expect(session.isActive).to.be.false;
      expect(session.amount).to.equal(0n);

      // Verify recipient received the tokens (5% fee applied on exit transfer)
      const expectedTransfer = ethers.parseEther("90.25"); // 95 - 5% tax
      expect(await macToken.balanceOf(recipient.address))
        .to.equal(initialRecipientBalance + expectedTransfer);
    });

    it("Should protect escrow funds and reject release calls from unauthorized addresses", async function () {
      await expect(escrow.connect(user).releaseEscrow(positionId, user.address))
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
    });
  });

  describe("Treasury Seizure & Liquidation", function () {
    let positionId;
    let lockedAmount;

    beforeEach(async function () {
      const { ethers } = hre;
      const depositAmount = ethers.parseEther("200");
      lockedAmount = ethers.parseEther("190"); // 5% fee-on-transfer applied
      positionId = ethers.keccak256(ethers.toUtf8Bytes("position-trace-hash-05"));

      await macToken.connect(user).approve(await escrow.getAddress(), depositAmount);
      await escrow.connect(user).depositEscrow(positionId, depositAmount);
    });

    it("Should successfully seize collateral and route to treasury (called by Owner/Agent)", async function () {
      const { ethers } = hre;
      const initialTreasuryBalance = await macToken.balanceOf(treasury.address);

      // Owner (Sovereign backend agent) seizes escrow
      await expect(escrow.connect(owner).seizeEscrow(positionId, treasury.address))
        .to.emit(escrow, "EscrowSeized")
        .withArgs(positionId, treasury.address, lockedAmount);

      // Verify session became inactive
      const session = await escrow.getEscrow(positionId);
      expect(session.isActive).to.be.false;
      expect(session.amount).to.equal(0n);

      // Verify treasury received the tokens (5% fee applied on exit transfer)
      const expectedTransfer = ethers.parseEther("180.5"); // 190 - 5% tax
      expect(await macToken.balanceOf(treasury.address))
        .to.equal(initialTreasuryBalance + expectedTransfer);
    });

    it("Should reject seizure attempts from unauthorized addresses", async function () {
      await expect(escrow.connect(user).seizeEscrow(positionId, treasury.address))
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount")
        .withArgs(user.address);
    });
  });
});