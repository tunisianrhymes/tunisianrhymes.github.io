// Final Test Chutes Integration
// Run: node scripts/testChutesDeploy.js

const CHUTES_API_KEY = 'cpk_1101d2b8fe314c04894060636dd1ddaf.c574ae6905385b45bc9cd549f69fd90e.YAZMl2W4eYbNKiP07sLkKgvKtlDXjqds';
const CHUTE_ID = 'e75f8264-bd20-5a30-a577-29eb8a77e85a'; // Verified ID
const INVOCATION_URL = `https://${CHUTE_ID}.chutes.ai/v1/chat/completions`;

async function testFinal() {
    console.log(`🚀 Testing Chute: ${CHUTE_ID}`);
    console.log(`📡 URL: ${INVOCATION_URL}`);

    try {
        const response = await fetch(INVOCATION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHUTES_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'chutes-model', // Often ignored if specific chute is targeted
                messages: [
                    { role: 'user', content: 'List 5 Tunisian words that rhyme with "makla" (food). Comma separated.' }
                ],
                max_tokens: 100
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

testFinal();
