

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mantle Agentic Core Escrow Vault
 * @dev Manages capital collateralization and sovereign releases for automated strategy executions.
 */
contract MantleAgentEscrow is Ownable {
    IERC20 public immutable macToken;

    struct EscrowSession {
        address depositor;
        uint256 amount;
        bool isActive;
        uint256 depositTimestamp;
    }

    // Maps a unique positionId (reasoning trace hash) to its active collateral vault
    mapping(bytes32 => EscrowSession) public escrows;

    event EscrowDeposited(bytes32 indexed positionId, address indexed depositor, uint256 amount);
    event EscrowReleased(bytes32 indexed positionId, address indexed recipient, uint256 amount);
    event EscrowSeized(bytes32 indexed positionId, address indexed treasury, uint256 amount);

    constructor(address _macTokenAddress) Ownable(msg.sender) {
        require(_macTokenAddress != address(0), "Invalid token address");
        // FIX: Directly assign the input token address to initialize the contract
        macToken = IERC20(_macTokenAddress);
    }

    /**
     * @dev Locks MAC collateral into the escrow contract. User must approve this contract first.
     * @param positionId The unique 32-byte identifier (generated from the AI decision hash).
     * @param amount The quantity of MAC tokens to lock as collateral (standard decimal format).
     */
    function depositEscrow(bytes32 positionId, uint256 amount) external {
        require(amount > 0, "Collateral must exceed zero");
        require(!escrows[positionId].isActive, "Escrow session already active");

        // Securely transfer collateral from user's wallet into this vault
        bool success = macToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer allocation failed");

        escrows[positionId] = EscrowSession({
            depositor: msg.sender,
            amount: amount,
            isActive: true,
            depositTimestamp: block.timestamp
        });

        emit EscrowDeposited(positionId, msg.sender, amount);
    }

    /**
     * @dev Programmatically releases locked collateral back to the user upon strategy completion.
     * @param positionId The unique identifier of the resolved position.
     * @param recipient The destination wallet address receiving the released collateral.
     */
    function releaseEscrow(bytes32 positionId, address recipient) external onlyOwner {
        EscrowSession storage session = escrows[positionId];
        require(session.isActive, "Escrow session is inactive");
        require(recipient != address(0), "Invalid recipient address");

        uint256 releaseAmount = session.amount;
        session.isActive = false;
        session.amount = 0;

        bool success = macToken.transfer(recipient, releaseAmount);
        require(success, "Collateral transfer failed");

        emit EscrowReleased(positionId, recipient, releaseAmount);
    }

    /**
     * @dev Seizes locked collateral and routes it to the treasury during liquidations or risk violations.
     * @param positionId The unique identifier of the violated position.
     * @param treasury The destination treasury contract address.
     */
    function seizeEscrow(bytes32 positionId, address treasury) external onlyOwner {
        EscrowSession storage session = escrows[positionId];
        require(session.isActive, "Escrow session is inactive");
        require(treasury != address(0), "Invalid treasury address");

        uint256 seizeAmount = session.amount;
        session.isActive = false;
        session.amount = 0;

        bool success = macToken.transfer(treasury, seizeAmount);
        require(success, "Treasury transfer failed");

        emit EscrowSeized(positionId, treasury, seizeAmount);
    }

    /**
     * @dev External view utility to retrieve specific active escrow metrics.
     */
    function getEscrow(bytes32 positionId) external view returns (address depositor, uint256 amount, bool isActive, uint256 depositTimestamp) {
        EscrowSession memory session = escrows[positionId];
        return (session.depositor, session.amount, session.isActive, session.depositTimestamp);
    }
}
