async function recalibrateStrategy(brainDecision, networkSentiment) {
    console.log("⚖️ [Recalibrate] Checking Brain against Network...");

    // If the Brain wants to buy but the network is 'Bearish', we lower confidence
    if (brainDecision.action === 'BUY' && networkSentiment === 'bearish') {
        console.warn("⚠️ Network sentiment is Bearish. Reducing confidence.");
        return { ...brainDecision, confidence: brainDecision.confidence - 20 };
    }

    return brainDecision;
}

module.exports = { recalibrateStrategy };