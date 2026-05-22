// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MantleAgentToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100000000 * 10**18; 
    uint256 public burnFee = 2; 
    uint256 public liquidityFee = 3; 
    
    address public liquidityWallet;
    mapping(address => bool) public isExcludedFromFee;

    event FeesUpdated(uint256 newBurnFee, uint256 newLiquidityFee);

    constructor(address _liquidityWallet) ERC20("Mantle Agent Core", "MAC") Ownable(msg.sender) {
        liquidityWallet = _liquidityWallet;
        isExcludedFromFee[msg.sender] = true;
        isExcludedFromFee[address(this)] = true;
        _mint(msg.sender, MAX_SUPPLY);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        if(isExcludedFromFee[msg.sender] || isExcludedFromFee[recipient]) {
            return super.transfer(recipient, amount);
        }
        
        uint256 burnAmount = (amount * burnFee) / 100;
        uint256 liquidityAmount = (amount * liquidityFee) / 100;
        uint256 transferAmount = amount - burnAmount - liquidityAmount;

        _burn(msg.sender, burnAmount);
        super.transfer(liquidityWallet, liquidityAmount);
        
        return super.transfer(recipient, transferAmount);
    }

    function updateFees(uint256 _burnFee, uint256 _liquidityFee) external onlyOwner {
        require(_burnFee + _liquidityFee <= 10, "Total fees exceed 10%");
        burnFee = _burnFee;
        liquidityFee = _liquidityFee;
        emit FeesUpdated(_burnFee, _liquidityFee);
    }
}