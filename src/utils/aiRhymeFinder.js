// AI-Powered Rhyme Generator (Template)
// TO USE: Replace credentials with your own compatible API (OpenAI, Chutes, etc.)

// Configuration - Update these with your running model endpoint
const API_CONFIG = {
    apiKey: 'cpk_037672acae7e4000aeca1a85f947ebf2.c574ae6905385b45bc9cd549f69fd90e.DROd2wGBWWTFmHXX89Lwyk1nxrNBBSPH',
    baseURL: 'https://api.chutes.ai/v1', // or https://api.openai.com/v1
    model: 'tngtech/TNG-R1T-Chimera-TEE' // or gpt-4o-mini
};

/**
 * Generate Tunisian rhymes using AI
 * Note: Requires a valid endpoint. Use Dictionary Manager for manual imports if API is unavailable.
 */
export async function generateRhymesWithAI(word) {
    if (API_CONFIG.apiKey === 'cpk_037672acae7e4000aeca1a85f947ebf2.c574ae6905385b45bc9cd549f69fd90e.DROd2wGBWWTFmHXX89Lwyk1nxrNBBSPH') {
        console.warn('⚠️ AI API not configured. Please update src/utils/aiRhymeFinder.js');
        return [];
    }

    try {
        console.log(`🤖 Generating AI rhymes for: ${word}`);

        const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a Tunisian Derja rhyme expert. Generate ONLY Tunisian words that rhyme with the given word. 
Rules:
- Return ONLY a comma-separated list of rhyming words
- No explanations, just the words
- Use Arabizi notation`
                    },
                    {
                        role: 'user',
                        content: `Generate rhymes for: ${word}`
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            console.warn(`❌ AI Request Failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const rhymesText = data.choices[0].message.content;

        // Parse results
        const aiRhymes = rhymesText
            .split(/[,\n]/)
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0 && w !== word.toLowerCase());

        return aiRhymes;
    } catch (error) {
        console.error('❌ AI Error:', error);
        return [];
    }
}

/**
 * Expand dictionary by generating rhymes for existing words
 */
export async function expandDictionaryWithAI(existingWords, sampleSize = 50) {
    if (API_CONFIG.apiKey === 'your_api_key') return [];

    const newWords = new Set();
    const sample = existingWords.sort(() => Math.random() - 0.5).slice(0, sampleSize);

    console.log(`🤖 Expanding dictionary with AI... Processing ${sample.length} words`);

    for (const word of sample) {
        const aiRhymes = await generateRhymesWithAI(word);
        aiRhymes.forEach(rhyme => newWords.add(rhyme));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return Array.from(newWords);
}
