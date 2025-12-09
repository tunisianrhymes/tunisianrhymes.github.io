import { tunisianWords } from '../data/tunisianWords.js';

export function findRhymes(inputWord, customDictionary = null) {
    if (!inputWord) return { best: [], good: [], near: [] };

    const wordList = customDictionary || tunisianWords;

    // 1. Normalize
    const cleanInput = inputWord.toLowerCase().trim();
    const inputLen = cleanInput.length;

    if (inputLen < 2) return { best: [], good: [], near: [] };

    const matches = {
        best: [], // 3+ chars overlap
        good: [], // 2 chars overlap
        near: []  // 1 char overlap (vowels) or partial phonetic match
    };

    wordList.forEach(word => {
        if (word === cleanInput) return; // Don't match self

        // 2. Measure suffix overlap
        let overlap = 0;
        const minLen = Math.min(inputLen, word.length);

        for (let i = 1; i <= minLen; i++) {
            const inputChar = cleanInput[cleanInput.length - i];
            const wordChar = word[word.length - i];

            if (inputChar === wordChar) {
                overlap++;
            } else {
                break;
            }
        }

        const item = { word, score: overlap };

        // 3. Categorize
        if (overlap >= 3 || (overlap >= 2 && inputLen <= 3)) {
            matches.best.push(item);
        } else if (overlap === 2) {
            matches.good.push(item);
        } else {
            // Check for Near Rhyme (Last vowel matches)
            const lastInput = cleanInput.slice(-1);
            const lastWord = word.slice(-1);
            const vowels = ['a', 'e', 'i', 'o', 'u', 'w', 'y'];

            if (lastInput === lastWord && vowels.includes(lastInput)) {
                matches.near.push({ word, score: 0.5 });
            }
        }
    });

    // 4. Sort each category
    const sorter = (a, b) => {
        // Tie-break: prefer words with similar length
        const lenDiffA = Math.abs(a.word.length - inputLen);
        const lenDiffB = Math.abs(b.word.length - inputLen);
        return lenDiffA - lenDiffB;
    };

    matches.best.sort(sorter);
    matches.good.sort(sorter);
    matches.near.sort(sorter); // Slice near rhymes to avoid noise

    // Limit results to avoid UI clutter
    matches.near = matches.near.slice(0, 20);

    return matches;
}
