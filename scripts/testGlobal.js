// Final API Test - Global Endpoint
// Run: node scripts/testGlobal.js

const CHUTES_API_KEY = 'cpk_1101d2b8fe314c04894060636dd1ddaf.c574ae6905385b45bc9cd549f69fd90e.YAZMl2W4eYbNKiP07sLkKgvKtlDXjqds';
const BASE_URL = 'https://api.chutes.ai/v1'; // Trying global V1

async function testGlobal() {
    const model = 'tngtech/TNG-R1T-Chimera-TEE'; // Found in boosted list
    console.log(`🚀 Testing Global Endpoint with model: ${model}`);

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHUTES_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: 'List 5 Tunisian words.' }
                ],
                max_tokens: 50
            })
        });

        if (!response.ok) {
            console.log(`❌ Error: ${response.status} ${await response.text()}`);
            return;
        }

        const data = await response.json();
        console.log('✅ Success!', data);
        console.log('📝 Content:', data.choices[0].message.content);

    } catch (e) { console.error('Exception', e); }
}

testGlobal();
