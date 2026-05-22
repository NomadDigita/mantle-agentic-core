require('dotenv').config();

async function processTradeSignal(researchData) {
    console.log("🧠 [Brain] Analyzing market data via Gemini 3 Flash Preview...");

    const apiKey = process.env.GEMINI_API_KEY;
    
    // 2026 FIX: Preview models REQUIRE the v1beta endpoint and the -preview suffix
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const prompt = `You are a pro crypto trader. 
    Analyze this data: ${JSON.stringify(researchData)}.
    Rules: 
    1. If confidence is > 80, action is 'BUY'. 
    2. If risk is high, action is 'CANCEL'.
    Return ONLY a JSON object: {"action": "BUY/CANCEL", "confidence": 0-100, "reason": "explanation"}`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `API Error ${response.status}`);
        }

        const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        return JSON.parse(text);

    } catch (e) {
        console.error("Brain Error Detail:", e.message);
        // If the preview is down, fallback to the last stable version
        return { action: "CANCEL", confidence: 0, reason: "Check model availability" };
    }
}

module.exports = { processTradeSignal };