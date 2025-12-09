// AI Dictionary Expansion Script
// Run this to automatically expand the Tunisian words database using AI

import { tunisianWords } from './src/data/tunisianWords.js';
import { expandDictionaryWithAI } from './src/utils/aiRhymeFinder.js';
import { removeDuplicates } from './src/utils/dictionaryManager.js';
import fs from 'fs';

async function expandDictionary() {
    console.log('🚀 Starting AI Dictionary Expansion...');
    console.log(`📊 Current dictionary size: ${tunisianWords.length} words`);

    // Generate new words (process 100 existing words to find rhymes)
    const newWords = await expandDictionaryWithAI(tunisianWords, 100);

    // Merge and remove duplicates
    const expandedDict = removeDuplicates([...tunisianWords, ...newWords]);

    console.log(`✅ Expansion complete!`);
    console.log(`📈 New size: ${expandedDict.length} words (+${expandedDict.length - tunisianWords.length})`);

    // Generate new file content
    const fileContent = `// Auto-generated with AI expansion
// Generated: ${new Date().toISOString()}

export const tunisianWords = ${JSON.stringify(expandedDict, null, 2)};
`;

    // Save to file
    fs.writeFileSync('./src/data/tunisianWords.js', fileContent, 'utf-8');
    console.log('💾 Saved to src/data/tunisianWords.js');

    // Show sample of new words
    console.log('\n🔥 Sample of new words added:');
    console.log(newWords.slice(0, 20).join(', '));
}

// Run the expansion
expandDictionary().catch(console.error);

// Usage: node scripts/expandDictionary.js
