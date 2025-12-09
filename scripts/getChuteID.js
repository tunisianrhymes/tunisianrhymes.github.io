// Final check for Chutes ID
const CHUTES_API_KEY = 'cpk_1101d2b8fe314c04894060636dd1ddaf.c574ae6905385b45bc9cd549f69fd90e.YAZMl2W4eYbNKiP07sLkKgvKtlDXjqds';
const BASE_URL = 'https://api.chutes.ai';

async function getID() {
    try {
        const response = await fetch(`${BASE_URL}/chutes/boosted`, {
            headers: { 'Authorization': `Bearer ${CHUTES_API_KEY}` }
        });
        const data = await response.json();
        const items = data.items || data;
        if (items.length > 0) {
            const c = items[0];
            console.log(`ID: ${c.cuid}`);
            console.log(`Slug: ${c.slug}`);
        } else {
            console.log('No items');
        }
    } catch (e) { console.log(e); }
}
getID();
