import { useState } from 'react';
import { tunisianWords } from '../data/tunisianWords';
import './SearchInput.css';

function SearchInput({ onSearch }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleRandom = () => {
        const randomWord = tunisianWords[Math.floor(Math.random() * tunisianWords.length)];
        setQuery(randomWord);
        onSearch(randomWord);
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Type a word..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="input-actions">
                        <button type="button" className="action-btn random-btn" onClick={handleRandom} title="Random Word">
                            🎲
                        </button>
                        <button type="submit" className="action-btn search-btn">
                            Search
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default SearchInput;
