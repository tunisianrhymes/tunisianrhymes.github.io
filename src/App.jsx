import { useState, useEffect } from 'react'
import { IoHeartSharp, IoLibrary } from 'react-icons/io5'
import SearchInput from './components/SearchInput'
import RhymeResults from './components/RhymeResults'
import Studio from './components/Studio'
import DictionaryManager from './components/DictionaryManager'
import Auth from './components/Auth'
import LoginPrompt from './components/LoginPrompt'
import { findRhymes } from './utils/rhymeEngine'
import { tunisianWords as initialWords } from './data/tunisianWords'
import { fetchDbWords } from './utils/dbUtils'
import './index.css'
import './App.css'

function App() {
  const [mode, setMode] = useState('home');
  const [words, setWords] = useState(initialWords);
  const [wordStats, setWordStats] = useState(new Map()); // Map<word, likes>
  const [results, setResults] = useState({ best: [], good: [], near: [] });
  const [searchedWord, setSearchedWord] = useState('');

  // Load Cloud Dictionary
  useEffect(() => {
    const loadCloudWords = async () => {
      const cloudData = await fetchDbWords();
      if (cloudData && cloudData.length > 0) {
        // 1. Create separate lists
        const cloudWordList = cloudData.map(item => item.word);

        // 2. Build Stats Map
        const statsMap = new Map();
        cloudData.forEach(item => {
          if (item.likes > 0) statsMap.set(item.word, item.likes);
        });
        setWordStats(statsMap);

        // 3. Merge unique words
        const merged = [...new Set([...initialWords, ...cloudWordList])];
        setWords(merged);
      }
    };
    loadCloudWords();
  }, []);

  const handleSearch = (word) => {
    setSearchedWord(word);

    // Pass the Dynamic 'words' list to the engine
    const rhymes = findRhymes(word, words);

    // Sort logic: Higher likes = Higher up
    const sortByLikes = (a, b) => {
      const likesA = wordStats.get(a.word) || 0;
      const likesB = wordStats.get(b.word) || 0;
      return likesB - likesA; // Descending
    };

    const sortedRhymes = {
      best: rhymes.best.sort(sortByLikes),
      good: rhymes.good.sort(sortByLikes),
      near: rhymes.near.sort(sortByLikes)
    };

    setResults(sortedRhymes);

    // Auto-Add Logic: If no Perfect or Good results, log it
    // If it's searched 4 times, the backend will auto-approve it.
    const hasGoodMatches = rhymes.best?.length > 0 || rhymes.good?.length > 0;
    if (!hasGoodMatches && word.length > 2) {
      logMissingWord(word);
    }
  };

  // Dynamic trending words
  const [trending, setTrending] = useState(['makla', 'flous', 'krahba', 'hob', 'choklata', 'zarda']);

  useEffect(() => {
    const interval = setInterval(() => {
      if (words.length > 0) {
        const newTrending = new Set();
        // Pick 6 unique random words
        while (newTrending.size < 6 && newTrending.size < words.length) {
          const randomIndex = Math.floor(Math.random() * words.length);
          newTrending.add(words[randomIndex]);
        }
        setTrending(Array.from(newTrending));
      }
    }, 4000); // rotate every 4 seconds

    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className="app-container">
      <LoginPrompt />
      {/* Mode Switcher */}
      <nav className="mode-switcher">
        <button
          className={`mode-btn ${mode === 'home' ? 'active' : ''}`}
          onClick={() => setMode('home')}
        >
          🏠 Home
        </button>
        <button
          className={`mode-btn ${mode === 'studio' ? 'active' : ''}`}
          onClick={() => setMode('studio')}
        >
          🎛️ Studio
        </button>
        <button
          className={`mode-btn ${mode === 'dictionary' ? 'active' : ''}`}
          onClick={() => setMode('dictionary')}
        >
          <IoLibrary /> Manager
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Auth />
          {/* Donation Button */}
          <a
            href="https://gateway.konnect.network/pay?payment_ref=67325e6348461274169ea39c&selectedPaymentMethod=bank_card"
            target="_blank"
            rel="noopener noreferrer"
            className="donate-btn"
          >
            <IoHeartSharp /> Support Us
          </a>
        </div>
      </nav>

      {/* HOME MODE */}
      {mode === 'home' && (
        <>
          <header className="main-header">
            <h1 className="logo">🇹🇳 TunisianRhymes</h1>
            <p className="subtitle">Find rhymes in Derja instantly</p>

            <div className="trending-section">
              <span className="trending-label">Trending:</span>
              <div className="trending-chips">
                {trending.map(word => (
                  <button
                    key={word}
                    className="trending-chip"
                    onClick={() => handleSearch(word)}
                  >
                    🔥 {word}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <main className="main-content">
            <SearchInput onSearch={handleSearch} />
            <RhymeResults results={results} searchedWord={searchedWord} />
          </main>

          <footer className="main-footer">
            <p>Made with ❤️ for Tunisia • {words.length} Words Loaded</p>
          </footer>
        </>
      )}

      {/* STUDIO MODE */}
      {mode === 'studio' && (
        <main className="studio-wrapper">
          <Studio />
        </main>
      )}

      {/* DICTIONARY MANAGER MODE */}
      {mode === 'dictionary' && (
        <main className="main-content">
          <DictionaryManager
            currentWords={words}
            onUpdateWords={setWords}
          />
        </main>
      )}
    </div>
  )
}

export default App
