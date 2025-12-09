export function countSyllables(word) {
    if (!word) return 0;

    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length <= 3) return 1;

    // Pattern: Vowels (a, e, i, o, u, y)
    // Logic: Count vowel groups. 
    // e.g. "toufla" -> tou-fla (2)
    // "makla" -> mak-la (2)
    // "shakshouka" -> shak-shou-ka (3)

    const matches = cleanWord.match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
}
