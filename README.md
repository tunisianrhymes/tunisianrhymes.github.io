# TunisianRhymes - قوافي تونسية 🇹🇳

محرك القوافي التونسية - Find perfect Tunisian Derja rhymes for rap, poetry & songwriting.

## Features

- 🎯 **1500+ Tunisian Words** - Comprehensive Derja dictionary
- 🔥 **Smart Rhyme Matching** - Perfect, Good, and Near rhymes
- 🎛️ **Studio Mode** - Write lyrics with live rhyme suggestions
- 🎵 **Beat Player** - Write to YouTube beats
- 📊 **Syllable Counting** - Perfect your flow
- 💝 **Support** - Donation button integrated

## Adding New Words

### Method 1: Manual Addition
Edit `src/data/tunisianWords.js` and add words to the array. Duplicates are automatically removed.

### Method 2: Import from Text
Use the dictionary manager utilities:

```javascript
import { importWordsFromText } from './src/utils/dictionaryManager.js';
import { tunisianWords } from './src/data/tunisianWords.js';

// Import words from a text string
const newWords = importWordsFromText(`
  word1 word2 word3
  word4, word5
  word6
`);

// Merge with existing (duplicates auto-removed)
const updated = [...new Set([...tunisianWords, ...newWords])];
console.log(`Added ${updated.length - tunisianWords.length} new unique words`);
```

### Method 3: AI-Powered Rhyme Generation 🤖
Use Bytez API to generate Tunisian rhymes with AI:

```javascript
import { generateRhymesWithAI, expandDictionaryWithAI } from './src/utils/aiRhymeFinder.js';

// Generate rhymes for a single word
const aiRhymes = await generateRhymesWithAI('makla');
console.log(aiRhymes); // ['takla', 'sakla', 'hakla', ...]

// Expand entire dictionary with AI (processes 50 random words)
const newWords = await expandDictionaryWithAI(tunisianWords, 50);
const updated = [...tunisianWords, ...newWords];
console.log(`Dictionary expanded: ${tunisianWords.length} → ${updated.length}`);
```

**Features:**
- Uses GPT-4o-mini for fast, accurate Tunisian rhyme generation
- Generates 10-30 rhymes per word
- Automatic duplicate removal
- Batch processing with rate limiting

## Dictionary Management

The app includes utilities in `src/utils/dictionaryManager.js`:

- `removeDuplicates(words)` - Remove duplicate words
- `mergeWordLists(...lists)` - Merge multiple lists
- `importWordsFromText(text)` - Parse words from text
- `getDictionaryStats(words)` - Get word count and statistics

## Deployment

```bash
npm install
npm run build
npm run preview
```

### GitHub Pages
Push to your repository and GitHub Actions will auto-deploy.

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **React Icons** - Icon library
- **Vanilla CSS** - Styling

## SEO

Optimized for Tunisian users with:
- Arabic, French, and English meta tags
- Open Graph social sharing
- Structured data (JSON-LD)
- Tunisia geo-targeting
- PWA support

## License

MIT

---

Made with ❤️ for Tunisia
