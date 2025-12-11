import { tunisianWords } from '../data/tunisianWords.js';

// --- CONFIGURATION ---

const VOWELS = ['a', 'e', 'i', 'o', 'u']; // Normalized vowels
// Extended Vowels for Detection
const RAW_VOWELS = ['a', 'e', 'i', 'o', 'u', 'y', 'à', 'é', 'è', 'ou', 'ai', 'ei', 'au', 'aa', 'ee', 'oo'];

const CONSONANT_MAP = {
    // Group 1: H sounds
    '7': 'h', 'h': 'h',
    // Group 2: K/Q/G sounds (broadly similar in rap flow)
    'q': 'k', 'k': 'k', 'g': 'k', 'gue': 'k',
    // Group 3: S/Z/C sounds
    'z': 's', 's': 's', 'c': 's', 'ç': 's',
    // Group 4: T/D sounds
    'd': 't', 't': 't',
    // Group 5: B/P
    'p': 'b', 'b': 'b',
    // Group 6: F/V
    'v': 'f', 'f': 'f',
    // Group 7: R/Gh
    'gh': 'r', 'r': 'r',
    // Group 8: Nasals (M/N are often slant rhymes) - User Rule: "unify em/en..."
    // We kept them separate in previous strict versions, but User Rule 5 says unify based on final sound.
    // For "Slant", m=n. For Perfect, maybe distinct.
    // Let's normalize them to 'N' internally ONLY for Slant/Nasal checks?
    // Or just Map m->n broadly? The user instructions imply "unify".
    // "unify em/en/im/in/om/on based on final sound"
    'm': 'n', 'n': 'n'
};

// Strict Vowel Normalization Rules
const VOWEL_MAP = {
    'ou': 'u', 'oo': 'u', 'u': 'u',
    'i': 'i', 'y': 'i', 'ee': 'i', 'ie': 'i',
    'a': 'a', 'aa': 'a', 'ah': 'a', 'à': 'a',
    'e': 'e', 'é': 'e', 'è': 'e', 'ai': 'e', 'ei': 'e',
    'o': 'o', 'au': 'o', 'eau': 'o'
};


// --- HELPERS ---

function normalizePhonetics(word) {
    if (!word) return '';
    let w = word.toLowerCase().trim();

    // 1. Collapse duplicate chars (Gemination)
    w = w.replace(/(.)\1+/g, '$1');

    // 2. Normalize Vowel Groups (multi-char FIRST)
    // Replace 'ou', 'oo', 'ee', 'aa', 'ai', 'ei' etc.
    // We sort keys by length descending to match longest first
    const vKeys = Object.keys(VOWEL_MAP).sort((a, b) => b.length - a.length);

    // We can't just global replace indiscriminately because "out" -> "ut"? Yes.
    // But "couloir" -> c + ouloir? 
    // We want to normalize the SOUNDS.
    // Let's use a regex that matches known vowels or consonants.

    // Better strategy for "normalization":
    // Iterate through string? No, regex replace is faster.

    for (const v of vKeys) {
        // Only replace if it's a vowel usage? 
        // e.g. "you" -> y+ou -> y+u. Correct.
        w = w.replaceAll(v, VOWEL_MAP[v]);
    }

    // 3. Normalize Consonants
    // To avoid replacing already normalized chars incorrectly, we do map.
    w = w.split('').map(c => CONSONANT_MAP[c] || c).join('');

    return w;
}

function getVowelIndices(normWord) {
    const indices = [];
    for (let i = 0; i < normWord.length; i++) {
        if (VOWELS.includes(normWord[i])) {
            indices.push(i);
        }
    }
    return indices;
}

// --- CORE ENGINE ---

export function findRhymes(inputWord, customDictionary = null) {
    if (!inputWord || inputWord.length < 2) return { best: [], good: [], near: [] };

    const wordList = customDictionary || tunisianWords;

    // 1. Analyze Target
    const normTarget = normalizePhonetics(inputWord);
    const vIndices = getVowelIndices(normTarget);

    // Determine Suffix Tiers
    let perfectSuffix = "";
    let goodSuffix = "";
    let slantSuffix = ""; // Anchor

    const len = normTarget.length;

    if (vIndices.length >= 2) {
        // Tier 1: From 2nd to last vowel
        const penultVowelIdx = vIndices[vIndices.length - 2];
        perfectSuffix = normTarget.substring(penultVowelIdx);

        // Tier 2: Last vowel + preceding consonant (if exists)
        const lastVowelIdx = vIndices[vIndices.length - 1];
        const onsetIdx = Math.max(lastVowelIdx - 1, penultVowelIdx + 1); // Start at consonant before last vowel
        goodSuffix = normTarget.substring(onsetIdx); // e.g. "hom"

        // Tier 3: Just from last vowel
        slantSuffix = normTarget.substring(lastVowelIdx); // e.g. "om"
    } else if (vIndices.length === 1) {
        // Only 1 vowel. Perfect = Whole Word.
        perfectSuffix = normTarget;

        const lastVowelIdx = vIndices[0];
        // Tier 2: Vowel onwards
        goodSuffix = normTarget.substring(lastVowelIdx);

        // Tier 3: Same? Or just match final Consonant group?
        slantSuffix = normTarget.substring(lastVowelIdx);
    } else {
        // No vowels? Just match ending.
        perfectSuffix = normTarget;
        goodSuffix = normTarget;
        slantSuffix = normTarget;
    }

    // EDGE CASE: If tiers are identical (e.g. word "om"), distinct them?
    // If perfect==good, that's fine.

    const matches = {
        best: [],
        good: [],
        near: []
    };

    const seenWords = new Set();
    const seenNorms = new Set(); // To avoid duplicates that normalize to same thing? 
    // Maybe not, user might want variations.

    wordList.forEach(word => {
        const cleanOriginal = word.toLowerCase().trim();
        if (cleanOriginal.length < 2) return;
        if (cleanOriginal === inputWord.toLowerCase().trim()) return;
        if (seenWords.has(cleanOriginal)) return;

        const normCand = normalizePhonetics(word);

        // Score based on Longest Suffix Match of NORMALIZED forms

        let valid = false;
        let score = 0;
        let type = '';

        if (normCand.endsWith(perfectSuffix)) {
            // Check for strictness: "DO NOT match words containing inhom in the middle" -> endsWith handles this.
            // Check: Is it a valid rhyme or just same letters? 
            // "kesbinhom" (inhom). 
            // "3aychinhom" (inhom). MATCH.
            score = 100 + perfectSuffix.length; // Priority: Length
            type = 'best';
            valid = true;
        }
        else if (normCand.endsWith(goodSuffix)) {
            // Shorter match
            score = 80 + goodSuffix.length;
            type = 'good';
            valid = true;
        }
        else if (normCand.endsWith(slantSuffix)) {
            // Slant match
            score = 50 + slantSuffix.length;
            type = 'near';
            valid = true;
        }

        if (valid) {
            matches[type].push({ word, score, overlap: score }); // overlap used for UI sorting if needed
            seenWords.add(cleanOriginal);
        }
    });

    // Sort by Score (Length included in score)
    const sorter = (a, b) => b.score - a.score;

    matches.best.sort(sorter);
    matches.good.sort(sorter);
    matches.near.sort(sorter);

    return matches;
}
