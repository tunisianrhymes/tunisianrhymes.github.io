// Test script for Bytez API
// Run: node scripts/testAI.js

const BYTEZ_API_KEY = 'fd8c59ed2aa7acc373b5d0a2d6781275';

async function testBytezAPI() {
    console.log('🧪 Testing Bytez API Integration...\n');

    try {
        const testWord = 'makla';
        console.log(`📝 Generating rhymes for: "${testWord}"`);

        const response = await fetch('https://api.bytez.com/model/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BYTEZ_API_KEY
            },
            body: JSON.stringify({
                model_id: 'meta-llama/Llama-3.2-3B-Instruct',
                input: `Generate ONLY a comma-separated list of Tunisian Derja words that rhyme with "${testWord}". Use Arabizi notation. Return only the words.`,
                max_new_tokens: 150
            })
        });

        console.log(`📡 Response Status: ${response.status} ${response.statusText}\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            return false;
        }

        const data = await response.json();

        if (data.output) {
            console.log('✅ API Response:');
            console.log(data.output);
            console.log('\n✅ Test PASSED! AI integration is working.');
            return true;
        } else {
            console.error('❌ No output in response:', data);
            return false;
        }

    } catch (error) {
        console.error('❌ Test FAILED:', error.message);
        return false;
    }
}

// Run the test
testBytezAPI();
