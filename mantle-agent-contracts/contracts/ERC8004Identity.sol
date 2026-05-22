// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mantle ERC-8004 Agent Identity
 * @dev The official On-Chain Registry for the Mantle Agentic Core
 */
contract ERC8004Identity is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // The "Brain" parameters encoded directly onto the blockchain
    struct AgentProfile {
        string riskStrategy;
        uint256 maxDrawdown;
        uint256 birthTimestamp;
        bool isAutonomous;
    }

    mapping(uint256 => AgentProfile) public agentProfiles;

    // The event our frontend will listen to for the UI explosion
    event AgentAwakened(address indexed creator, uint256 indexed agentId, string riskStrategy);

    constructor() ERC721("Mantle Agent Identity", "MAI") Ownable(msg.sender) {
        _nextTokenId = 1; // Agent IDs start at 1
    }

    function mintAgentIdentity(string memory _riskStrategy, uint256 _maxDrawdown) public returns (uint256) {
        uint256 agentId = _nextTokenId++;
        
        _mint(msg.sender, agentId);

        // Permanently encode the AI's personality to the blockchain
        agentProfiles[agentId] = AgentProfile({
            riskStrategy: _riskStrategy,
            maxDrawdown: _maxDrawdown,
            birthTimestamp: block.timestamp,
            isAutonomous: true
        });

        emit AgentAwakened(msg.sender, agentId, _riskStrategy);

        return agentId;
    }

    function getAgentProfile(uint256 agentId) public view returns (AgentProfile memory) {
        return agentProfiles[agentId];
    }
}