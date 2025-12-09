const fs = require('fs');
const path = require('path');

const raw1 = require('../src/data/raw1.js');
const raw2 = require('../src/data/raw2.js');

const combined = [...raw1, ...raw2];

console.log(`Initial count: ${combined.length}`);

// Cleaning function
const cleanWords = combined
    .map(w => w.replace(/^"|"$/g, '').trim()) // Remove extra quotes if any
    .filter(w => {
        if (!w) return false;
        if (w.startsWith('//')) return false;
        if (['export', 'const', 'tunisianWords', '[', ']', 'Word', 'Count:', 'Auto-generated', 'Dictionary'].includes(w)) return false;
        if (w.match(/^\d+$/)) return false; // Remove numbers
        if (w.length < 2) return false;
        return true;
    });

// Deduplicate
const uniqueWords = [...new Set(cleanWords)];

console.log(`Clean unique count: ${uniqueWords.length}`);

// Generate file content
const fileContent = `// Auto-generated Dictionary
// Word Count: ${uniqueWords.length}
export const tunisianWords = ${JSON.stringify(uniqueWords, null, 2)};
`;

const outputPath = path.join(__dirname, '../src/data/tunisianWords.js');
fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log(`Successfully wrote to ${outputPath}`);
