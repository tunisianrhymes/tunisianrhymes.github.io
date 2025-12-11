import { useState } from 'react';
import { IoSearch, IoLanguage, IoDownload, IoMusicalNotes, IoFlash } from 'react-icons/io5';
import './LyricsManager.css';

const RAPPERS = [
    "Balti", "Samara", "Sanfara", "A.L.A", "Nordo",
    "Klay BBJ", "RedStar Radi", "Jenjoon", "Castro", "G.G.A",
    "Artmasta", "Kaso", "4lfa", "Master Sina", "Hamzaoui Med Amine",
    "Armasta", "Akram Mag", "Swagg Man", "Weld El 15", "Emino"
];

const ARABIC_MAP = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
    'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': '7', 'خ': '5',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'ch', 'ص': 's', 'ض': 'dh',
    'ط': 't', 'ظ': 'dh', 'ع': '3', 'غ': 'gh',
    'ف': 'f', 'ق': '9', 'ڨ': 'g', 'ك': 'k', 'ل': 'l',
    'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ة': 'a', 'ى': 'a',
    'ء': '2', 'ئ': '2', 'ؤ': '2',
    '؟': '?', '،': ','
};

const COMMON_WORDS = {
    'انا': 'ena', 'أنا': 'ena', 'انت': 'enti', 'إنت': 'enti', 'انتي': 'enti',
    'هو': 'houwa', 'هي': 'hiya', 'نحنا': 'na7na', 'احن': 'a7na',
    'انتوما': 'ntouma', 'انتم': 'ntouma', 'هما': 'houma', 'هم': 'houma',

    'في': 'fi', 'من': 'men', 'على': '3la', 'ع': '3la', 'علا': '3la',
    'مع': 'm3a', 'بي': 'bi', 'ب': 'b', 'لي': 'li', 'ل': 'l',
    'عند': '3and', 'عن': '3an',
    'ما': 'ma', 'لا': 'la', 'يا': 'ya', 'و': 'w', 'او': 'w',

    'وين': 'win', 'فين': 'fin', 'كيف': 'kif', 'كيفاش': 'kifech',
    'وقتاش': 'wa9tech', 'علاش': '3lech', 'ليش': 'lech',
    'شنوة': 'chnowa', 'اش': 'ech', 'شكون': 'chkoun',

    'كان': 'kan', 'يكن': 'yikoun', 'كون': 'koun',
    'قال': '9al', 'يقول': 'y9oul', 'قلي': '9alli',
    'جا': 'ja', 'يج': 'yji', 'جيت': 'jit',
    'مشى': 'mcha', 'يمشي': 'yemchi',
    'شاف': 'chef', 'يشوف': 'ychouf',
    'حب': '7ab', 'نحب': 'n7eb', 'تحب': 't7eb',
    'عمل': '3mal', 'نعمل': 'na3mel', 'يعمل': 'ya3mel',
    'عرف': '3raf', 'نعرف': 'na3raf',

    'ناس': 'nes', 'عالم': '3alem', 'بلاد': 'bled',
    'وقت': 'wa9t', 'ليل': 'lil', 'نهار': 'nhar', 'يوم': 'youm',
    'حب': '7ob', 'قلب': '9alb', 'روح': 'rou7',
    'فلوس': 'flous', 'مال': 'mel',
    'ربي': 'rabi', 'الله': 'allah', 'والله': 'wallah',
    'ياخي': 'ye5i', 'زعمة': 'za3ma',
    'تونس': 'tounes', 'راب': 'rap',

    'باش': 'bech', 'بش': 'bech',
    'مش': 'mouch', 'موش': 'mouch', 'مو': 'mouch',
    'كل': 'kol', 'شي': 'chay', 'برشا': 'barcha',
    'خاتر': '5ater', 'على خاطر': '3la 5ater',
    'هكا': 'haka', 'هك': 'hak',
    'هذا': 'hatha', 'هذي': 'hathi', 'هاذ': 'hath',

    'ضالم': 'dhalem', 'ظالم': 'dhalem',
    'راجل': 'rajel', 'كامل': 'kamel'
};

export default function LyricsManager() {
    const [selectedRapper, setSelectedRapper] = useState('');
    const [songTitle, setSongTitle] = useState('');
    const [originalLyrics, setOriginalLyrics] = useState('');
    const [convertedLyrics, setConvertedLyrics] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const handleAutoFetch = async () => {
        const query = `${selectedRapper} ${songTitle}`.trim();
        if (!query) return;

        setIsFetching(true);
        setStatusMsg('Searching LRCLIB database...');
        setOriginalLyrics('');

        try {
            const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error("API Connection Failed");

            const data = await res.json();

            let match;
            if (songTitle) {
                match = data.find(item => item.plainLyrics) || data[0];
            } else {
                const validItems = data.filter(item => item.plainLyrics);
                if (validItems.length > 0) {
                    const randomIndex = Math.floor(Math.random() * validItems.length);
                    match = validItems[randomIndex];
                } else {
                    match = data[0];
                }
            }

            if (match && match.plainLyrics) {
                if (!songTitle) {
                    setSongTitle(match.name);
                }
                setOriginalLyrics(match.plainLyrics);
                setStatusMsg(`Found: ${match.trackName || match.name}`);
            } else {
                throw new Error("No lyrics found in database.");
            }

        } catch (e) {
            console.error("LRCLIB Error:", e);
            setStatusMsg('Lyrics not found.');
            alert("Could not find lyrics. Try entering a specific song name.");
        } finally {
            setIsFetching(false);
            if (statusMsg === 'Lyrics not found.') {
                setTimeout(() => setStatusMsg(''), 3000);
            }
        }
    };

    const handleSearch = () => {
        const query = `${selectedRapper} ${songTitle}`.trim();
        if (!query) return;
        window.open(`https://genius.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    const convertToArabizi = () => {
        const text = originalLyrics;
        if (!text) return;

        // Remove Arabic Diacritics (Tashkeel)
        const cleanText = text.replace(/[\u064B-\u065F]/g, '');

        const lines = cleanText.split('\n');
        const convertedLines = lines.map(line => {
            if (line.trim().length === 0) return '';
            const words = line.trim().split(/\s+/);
            return words.map(word => {
                let cleanWord = word.replace(/[^\u0600-\u06FF]/g, '');
                let prefix = '';
                if (COMMON_WORDS[cleanWord]) return COMMON_WORDS[cleanWord];
                if (cleanWord.startsWith('ال') && cleanWord.length > 3) {
                    prefix = 'el ';
                    cleanWord = cleanWord.substring(2);
                    if (COMMON_WORDS[cleanWord]) return prefix + COMMON_WORDS[cleanWord];
                }

                // Heuristic for Fa3el Pattern (C A C C) -> C A C e C
                // Example: Dhalem (ضالم) -> dhalem, Kamel (كامل) -> kamel
                if (cleanWord.length === 4 && cleanWord[1] === 'ا') {
                    // Start of word + 'a' + Middle + 'e' + End
                    const c1 = ARABIC_MAP[cleanWord[0]] || cleanWord[0];
                    const c3 = ARABIC_MAP[cleanWord[2]] || cleanWord[2];
                    const c4 = ARABIC_MAP[cleanWord[3]] || cleanWord[3];
                    const lastChar = cleanWord[3];

                    // Do not apply if last char is vowel
                    if (!['ا', 'و', 'ي', 'ى', 'ه'].includes(lastChar)) {
                        return prefix + c1 + 'a' + c3 + 'e' + c4;
                    }
                }

                let result = prefix;
                const textToMap = cleanWord || word;
                for (let i = 0; i < textToMap.length; i++) {
                    const char = textToMap[i];
                    if (char === 'و') {
                        if (i === 0) result += 'w'; else result += 'ou';
                    } else if (char === 'ي') {
                        if (i === 0) result += 'y'; else result += 'i';
                    } else if (char === 'ا' && i === textToMap.length - 1 && textToMap.length > 2) {
                        result += 'a';
                    } else if (ARABIC_MAP[char]) {
                        result += ARABIC_MAP[char];
                    } else {
                        result += char;
                    }
                }
                return result;
            }).join(' ');
        });
        setConvertedLyrics(convertedLines.join('\n'));
    };

    const handleDownload = () => {
        const content = `Artist: ${selectedRapper}\nSong: ${songTitle}\n\n[Arabizi Lyrics]\n\n${convertedLyrics}\n\n---\n[Original Lyrics]\n${originalLyrics}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `${selectedRapper.replace(/\s+/g, '_')}-${(songTitle || 'Lyrics').replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="lyrics-manager">
            <div className="lm-section rappers-list">
                <h3><IoMusicalNotes /> Top 20 Rappers</h3>
                <div className="rapper-chips">
                    {RAPPERS.map(rapper => (
                        <button
                            key={rapper}
                            className={`rapper-chip ${selectedRapper === rapper ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedRapper(rapper);
                                setSongTitle('');
                            }}
                        >
                            {rapper}
                        </button>
                    ))}
                </div>
            </div>

            <div className="lm-section search-tool">
                <input
                    type="text"
                    placeholder="Enter Rapper Name (or select above)"
                    value={selectedRapper}
                    onChange={(e) => setSelectedRapper(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Enter Song Title (Leave empty for RANDOM song)"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                />
                <button
                    className="lm-search-btn"
                    onClick={handleAutoFetch}
                    disabled={(!selectedRapper && !songTitle) || isFetching}
                    style={{ background: '#8b5cf6', color: '#fff', marginRight: '0.5rem', minWidth: '140px' }}
                    title={!songTitle ? "Surprise me with a random song!" : "Fetch this specific song"}
                >
                    {isFetching ? 'Fetching...' : <><IoFlash /> {songTitle ? 'Auto-Fetch' : 'Surprise Me!'}</>}
                </button>
                <button className="lm-search-btn" onClick={handleSearch} disabled={!selectedRapper && !songTitle}>
                    <IoSearch /> Open URL
                </button>
            </div>

            {statusMsg && <div className="status-message" style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.9rem' }}>{statusMsg}</div>}

            <div className="lm-section converter-tool">
                <div className="lyrics-cols">
                    <div className="col">
                        <h4>Paste Arabic Lyrics Here</h4>
                        <textarea
                            value={originalLyrics}
                            onChange={(e) => setOriginalLyrics(e.target.value)}
                            placeholder="Lyrics will appear here..."
                        />
                    </div>
                    <div className="col">
                        <h4>Converted (Arabizi)</h4>
                        <textarea
                            value={convertedLyrics}
                            readOnly
                            placeholder="Conversion will appear here..."
                        />
                    </div>
                </div>

                <div className="converter-actions">
                    <button className="convert-btn" onClick={convertToArabizi} disabled={!originalLyrics}>
                        <IoLanguage /> Convert to Arabizi
                    </button>
                    <button className="download-btn" onClick={handleDownload} disabled={!convertedLyrics}>
                        <IoDownload /> Download .txt
                    </button>
                </div>
            </div>

            <p className="lm-hint" style={{ textAlign: 'center', color: '#666', marginTop: '1rem', fontStyle: 'italic' }}>
                * Tip: We automatically add 'e' to words like 'dhalem'.
            </p>
        </div>
    );
}
