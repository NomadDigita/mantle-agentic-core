const { ethers } = require('ethers');

async function executeTrade(finalSignal) {
    if (finalSignal.confidence < 80) {
        console.log("🚫 [Trader] Confidence too low. Trade skipped.");
        return;
    }
    console.log(`💰 [Trader] EXECUTING TRADE: ${finalSignal.action} with ${finalSignal.confidence}% confidence!`);
    // On-chain logic will go here once we are funded
}

module.exports = { executeTrade };