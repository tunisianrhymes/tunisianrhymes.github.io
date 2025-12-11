import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRhymes } from '../src/utils/rhymeEngine.js';
import { tunisianWords } from '../src/data/tunisianWords.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const RHYMES_DIR = path.join(PUBLIC_DIR, 'rhymes');

// --- OPTIMIZATION HELPER: Rough Anchor Bucketing ---
// The RhymeEngine requires matching "Anchor" (e.g. m-a, t-ou).
// To avoid O(N^2) comparison of 14,000 * 14,000, we pre-group words by a "Rough Anchor".
// This ensures we only compare "klem" against other words ending in 'm' or 'n'.

function getRoughAnchor(word) {
    if (!word || word.length < 2) return '_';
    const clean = word.toLowerCase().trim();
    // Vowel check
    const endsWithVowelRegex = /(ou|aa|ee|oo|ai|ei|au|[aeiouyàéè])$/;
    if (endsWithVowelRegex.test(clean)) {
        // Ends in Vowel. Group by the Vowel itself roughly.
        // e.g. tbiba -> a
        // We can just take the last char if it's a simple vowel, or 'ou'.
        if (clean.endsWith('ou')) return 'ou';
        if (clean.endsWith('aa')) return 'abc'; // Group long vowels together or simplistic
        return clean.slice(-1);
    } else {
        // Ends in Consonant.
        // Group by the consonant.
        // Nasal catch: m/n group together in the engine, so we must bucket them together.
        const last = clean.slice(-1);
        if (last === 'm' || last === 'n') return 'NASAL';
        // 'r' and 'gh' group together?
        if (last === 'r') return 'R_GROUP';
        if (clean.endsWith('gh')) return 'R_GROUP';
        // 's', 'z', 'c' group?
        if (['s', 'z', 'c'].includes(last)) return 'S_GROUP';

        return last;
    }
}

console.log(`🚀 Starting Optimized Full-Scale SEO Page Generation...`);

// 1. Bucket Dictionary
console.log("📦 Pre-bucketing dictionary for speed...");
const buckets = {};
tunisianWords.forEach(word => {
    const key = getRoughAnchor(word);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(word);
});
console.log(`✅ Dictionary grouped into ${Object.keys(buckets).length} optimization buckets.`);


if (!fs.existsSync(RHYMES_DIR)) {
    fs.mkdirSync(RHYMES_DIR, { recursive: true });
}

let count = 0;
const total = tunisianWords.length;
const start = Date.now();
const generatedUrls = [];

// 2. Iterate and Solve using Buckets
tunisianWords.forEach((word, index) => {
    if (!word || word.length < 2) return;

    if (index % 1000 === 0 && index > 0) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = index / elapsed;
        console.log(`📊 Processed ${index}/${total} words... (${Math.round(rate)} words/sec)`);
    }

    const key = getRoughAnchor(word);
    // CRITICAL: Only check words in the same matching bucket
    const candidateList = buckets[key] || [];

    // Pass smaller list to engine
    const results = findRhymes(word, candidateList);
    const topRhymes = results.best.slice(0, 50).map(r => r.word);

    // Filter: Ignore words with 0 perfect rhymes
    if (topRhymes.length === 0) return;

    const safeFilename = word.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Minimal SEO HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="tn">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rhymes with ${word} - Tunisian Rhymes Dictionary</title>
<meta name="description" content="Best rhymes for '${word}': ${topRhymes.slice(0, 5).join(', ')}... Found ${results.best.length} perfect matches.">
<style>body{font-family:sans-serif;background:#0a0a0a;color:#eee;max-width:800px;margin:auto;padding:1rem}h1{color:#ff0844}a{color:#fff;text-decoration:none}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}.card{background:#1a1a1a;padding:10px;border-radius:5px;text-align:center}.btn{background:#ff0844;padding:10px 20px;border-radius:20px;display:inline-block;margin-top:20px;font-weight:bold}</style>
</head>
<body>
<a href="/">← Back to Studio</a>
<h1>Rhymes with ${word}</h1>
<p>Found ${results.best.length} perfect rhymes.</p>
<div class="grid">
${topRhymes.map(r => `<div class="card">${r}</div>`).join('')}
</div>
<center><a href="/" class="btn">Open Full Studio 🎤</a></center>
</body></html>`;

    fs.writeFileSync(path.join(RHYMES_DIR, `${safeFilename}.html`), htmlContent);
    generatedUrls.push(`https://tunisian-rhymes.com/rhymes/${safeFilename}.html`);
    count++;
});

// Sitemap
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://tunisian-rhymes.com/</loc><priority>1.0</priority></url>
${generatedUrls.map(url => `    <url><loc>${url}</loc><priority>0.5</priority></url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent);

console.log(`✅ COMPLETE! Generated ${count} pages in ${(Date.now() - start) / 1000}s.`);
