// Dictionary Management Utilities
// Use this to clean and manage the Tunisian words database

/**
 * Normalize a word for comparison (lowercase, trim)
 */
export function normalizeWord(word) {
    return word.toLowerCase().trim();
}

/**
 * Remove duplicates from an array of words
 */
export function removeDuplicates(words) {
    const seen = new Set();
    const unique = [];

    for (const word of words) {
        const normalized = normalizeWord(word);
        if (!seen.has(normalized)) {
            seen.add(normalized);
            unique.push(word);
        }
    }

    return unique;
}

/**
 * Merge multiple word lists and remove duplicates
 */
export function mergeWordLists(...lists) {
    const merged = lists.flat();
    return removeDuplicates(merged);
}

/**
 * Import words from text (space, comma, or newline separated)
 */
export function importWordsFromText(text) {
    const words = text
        .split(/[\s,\n]+/)
        .map(w => w.trim())
        .filter(w => w.length > 0);

    return removeDuplicates(words);
}

/**
 * Generate statistics about the dictionary
 */
export function getDictionaryStats(words) {
    const unique = removeDuplicates(words);
    const endings = {};

    unique.forEach(word => {
        const last2 = word.slice(-2);
        endings[last2] = (endings[last2] || 0) + 1;
    });

    return {
        total: unique.length,
        duplicates: words.length - unique.length,
        topEndings: Object.entries(endings)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
    };
}

/**
 * Example: Add new words from external source
 */
export function addWordsFromSource(currentWords, newWords) {
    return mergeWordLists(currentWords, newWords);
}

// Example usage in console:
// import { importWordsFromText, removeDuplicates } from './utils/dictionaryManager.js';
// const newWords = importWordsFromText("word1 word2 word3");
// console.log(removeDuplicates([...tunisianWords, ...newWords]));
