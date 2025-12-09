// Test script for Chutes.ai API - Discovery Phase 3
// Run: node scripts/testChutes.js

const CHUTES_API_KEY = 'cpk_1101d2b8fe314c04894060636dd1ddaf.c574ae6905385b45bc9cd549f69fd90e.YAZMl2W4eYbNKiP07sLkKgvKtlDXjqds';
const BASE_URL = 'https://api.chutes.ai';

async function findEndpoint() {
    console.log('🧪 Finding Chutes Invocation URL...\n');

    try {
        const response = await fetch(`${BASE_URL}/chutes/boosted`, {
            headers: { 'Authorization': `Bearer ${CHUTES_API_KEY}` }
        });

        if (!response.ok) { console.error('Error:', response.status); return; }

        const data = await response.json();
        const items = data.items || data;

        if (items.length > 0) {
            console.log('✅ Found Boosted Chutes:');
            items.slice(0, 3).forEach(c => {
                console.log(`\n🔹 Name: ${c.name}`);
                console.log(`   Slug: ${c.slug}`);
                // Construct potential URLs
                console.log(`   Standard URL: https://${c.slug}.chutes.ai`);
                console.log(`   Detailed URL: https://chutes.ai/app/${c.username}/${c.slug}`);
            });

            // Test the first one
            const chute = items[0];
            const testUrl = `https://${chute.slug}.chutes.ai/v1/chat/completions`;
            console.log(`\n🚀 Testing Chat on: ${testUrl}`);

            await testChat(testUrl, chute.name); // Using standard URL structure for boosted chutes
        }
    } catch (e) {
        console.error(e);
    }
}

async function testChat(url, modelName) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHUTES_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName, // Often ignored by usage of specific chute URL, but good to send
                messages: [{ role: 'user', content: 'Say hello!' }],
                max_tokens: 10
            })
        });

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! Response:', data.choices[0].message.content);
        } else {
            console.log('❌ Failed:', await response.text());
        }
    } catch (e) { console.error('Exception:', e.message); }
}

findEndpoint();
