import { useState } from 'react';
import { tunisianWords } from '../data/tunisianWords';
import './SearchInput.css';

function SearchInput({ onSearch }) {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleRandom = () => {
        const randomWord = tunisianWords[Math.floor(Math.random() * tunisianWords.length)];
        setQuery(randomWord);
        onSearch(randomWord);
    };

    return (
        <div className="search-container">
            <div className="search-form">
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Type a word..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div className="input-actions">
                        <button type="button" className="action-btn random-btn" onClick={handleRandom} title="Random Word">
                            🎲
                        </button>
                        <button type="button" className="action-btn search-btn" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchInput;
