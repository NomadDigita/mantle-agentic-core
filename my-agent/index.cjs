const path = require('path');

const researcherPath = path.join(__dirname, 'src', 'researcher.cjs');
const brainPath = path.join(__dirname, 'src', 'brain.cjs');
const recalibratePath = path.join(__dirname, 'src', 'recalibrate.cjs');
const traderPath = path.join(__dirname, 'src', 'trader.cjs');

const { scanForSignals } = require(researcherPath);
const { processTradeSignal } = require(brainPath);
const { recalibrateStrategy } = require(recalibratePath);
const { executeTrade } = require(traderPath);

console.log("✅ All modules loaded successfully!");

async function runLoop() {
    const rawData = await scanForSignals();
    const brainDecision = await processTradeSignal(rawData);
    const finalSignal = await recalibrateStrategy(brainDecision, "bullish"); // Simulating network
    await executeTrade(finalSignal);
}

runLoop();