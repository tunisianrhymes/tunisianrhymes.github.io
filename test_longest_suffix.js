
import { findRhymes } from './src/utils/rhymeEngine.js';

// Mock Dictionary
const mockDictionary = [
    '3aychinhom',   // Perfect: ends in inhomogeneous
    'y7ebbinhom',   // Perfect
    'makrawlinhom', // Perfect
    'fihom',        // Good: ends in hom
    'bihom',        // Good
    '3alihom',      // Good
    '3alemm',       // Slant: ends in m/om
    'nharom',       // Slant
    'randomword',   // No match
    'nhoom',        // Should be normalized to match?
    'nom'           // Different sound if vowel is short?
];

const TARGET = 'kesbinhom';

console.log(`🔎 Testing Rhymes for: ${TARGET}`);
const results = findRhymes(TARGET, mockDictionary);

console.log('\n--- RESULTS ---');
console.log('BEST (Score > 100):');
results.best.forEach(r => console.log(`  [${r.score}] ${r.word}`));

console.log('GOOD (Score > 80):');
results.good.forEach(r => console.log(`  [${r.score}] ${r.word}`));

console.log('NEAR (Score > 50):');
results.near.forEach(r => console.log(`  [${r.score}] ${r.word}`));
