import { useState, useEffect } from 'react'
import { IoHeartSharp, IoLibrary, IoHome, IoCreate, IoLogoInstagram, IoSchool } from 'react-icons/io5'
import SearchInput from './components/SearchInput'
import RhymeResults from './components/RhymeResults'
import Studio from './components/Studio'
import RhymeTrainer from './components/RhymeTrainer'
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

      {/* Header Actions (Auth + Support) */}
      {mode !== 'studio' && (
        <div className="header-actions">
          <Auth />
          <a
            href="https://gateway.konnect.network/pay?payment_ref=67325e6348461274169ea39c&selectedPaymentMethod=bank_card"
            target="_blank"
            rel="noopener noreferrer"
            className="donate-btn-icon"
            aria-label="Support Us"
          >
            <IoHeartSharp />
          </a>
        </div>
      )}

      {/* Mode Switcher (Bottom Nav on Mobile) */}
      <nav className="mode-switcher">
        <button
          className={`mode-btn ${mode === 'home' ? 'active' : ''}`}
          onClick={() => setMode('home')}
        >
          <span className="nav-icon"><IoHome /></span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`mode-btn ${mode === 'studio' ? 'active' : ''}`}
          onClick={() => setMode('studio')}
        >
          <span className="nav-icon"><IoCreate /></span>
          <span className="nav-label">Studio</span>
        </button>
        <button
          className={`mode-btn ${mode === 'dictionary' ? 'active' : ''}`}
          onClick={() => setMode('dictionary')}
        >
          <span className="nav-icon"><IoLibrary /></span>
          <span className="nav-label">Manager</span>
        </button>
      </nav>

      {/* HOME MODE */}
      {mode === 'home' && (
        <>
          <header className="main-header">
            <h1 className="logo">TunisianRhymes</h1>
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

            {/* Feature Cards - show when no search */}
            {!searchedWord && (
              <div className="feature-cards">
                <div className="feature-card">
                  <span className="feature-icon">🎯</span>
                  <h4>Smart Rhymes</h4>
                  <p>Find perfect, good, and near rhymes for any Tunisian word</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">📊</span>
                  <h4>Syllable Groups</h4>
                  <p>Results organized by syllable count for better flow</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">❤️</span>
                  <h4>Community Picks</h4>
                  <p>Like your favorites - popular words get promoted</p>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">🎵</span>
                  <h4>Studio Mode</h4>
                  <p>Write lyrics with beats and instant rhyme lookup</p>
                </div>
              </div>
            )}

            <RhymeResults results={results} searchedWord={searchedWord} />
          </main>

          <footer className="main-footer">
            <p>Made with ❤️ for Tunisia • {words.length} Words Loaded</p>
            <div className="footer-links">
              <a href="https://instagram.com/chiheb_elouni" target="_blank" rel="noopener noreferrer" className="instagram-link">
                <IoLogoInstagram /> @chiheb_elouni
              </a>
            </div>
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

      {/* NEW: TRAINER MODE */}
      {mode === 'trainer' && (
        <main className="trainer-wrapper" style={{ height: '80vh' }}>
          <RhymeTrainer words={words} />
          <button onClick={() => setMode('home')} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: '#fff', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </main>
      )}

    </div>
  )
}

export default App
