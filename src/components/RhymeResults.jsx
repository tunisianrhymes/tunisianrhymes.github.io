import { useState, useEffect } from 'react';
import { countSyllables } from '../utils/syllableCounter';
import { IoHeart, IoHeartOutline } from 'react-icons/io5';
import { toggleLikeWord, getWordStats } from '../utils/dbUtils';
import './RhymeResults.css';

// Extracted component to manage individual like state
// Defined outside to prevent re-mounting on parent re-renders
const WordCard = ({ item, type, minimalist, onCopy, copiedWord }) => {
    const [liked, setLiked] = useState(false);
    const [stats, setStats] = useState({ likes: 0, likedByUser: false });
    // Calculate syllables locally if not provided
    const syl = countSyllables(item.word);

    useEffect(() => {
        let isMounted = true;
        // Fetch real stats from DB
        getWordStats(item.word).then(data => {
            if (isMounted) {
                setStats(data);
                setLiked(data.likedByUser);
            }
        });
        return () => { isMounted = false; };
    }, [item.word]);

    const handleLike = async (e) => {
        e.stopPropagation();
        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setStats(prev => ({
            ...prev,
            likes: newLiked ? prev.likes + 1 : prev.likes - 1,
            likedByUser: newLiked
        }));

        await toggleLikeWord(item.word);
    };

    return (
        <div
            className={`word-card ${type === 'best' ? 'best-match' : ''} ${minimalist ? 'card-min' : ''}`}
            onClick={() => onCopy(item.word)}
            title="Click to Copy"
        >
            <div className="word-content">
                {item.word}
                {!minimalist && <span className="syl-badge">{syl}</span>}
            </div>

            {!minimalist && (
                <button
                    className={`like-btn ${liked ? 'liked' : ''}`}
                    onClick={handleLike}
                    title="Add to Favorites"
                >
                    {liked ? <IoHeart /> : <IoHeartOutline />}
                </button>
            )}

            {copiedWord === item.word && <span className="copy-toast">Copied!</span>}
        </div>
    );
};

function RhymeResults({ results, searchedWord, minimalist = false }) {
    const [copiedWord, setCopiedWord] = useState(null);

    if (!searchedWord && !minimalist) return null;
    if (!searchedWord && minimalist) return <div className="no-results-min">Select a word to search...</div>;

    const hasResults = results.best?.length > 0 || results.good?.length > 0 || results.near?.length > 0;

    if (!hasResults) {
        return (
            <div className={minimalist ? "no-results-min" : "no-results"}>
                <p>No rhymes found for "{searchedWord}"</p>
            </div>
        );
    }

    const handleCopy = (word) => {
        navigator.clipboard.writeText(word);
        setCopiedWord(word);
        setTimeout(() => setCopiedWord(null), 1500);
    };

    const renderGrid = (items, type) => (
        <div className={`words-grid ${minimalist ? 'grid-min' : ''}`}>
            {items.map((item, index) => (
                <WordCard
                    key={`${item.word}-${index}`}
                    item={item}
                    type={type}
                    minimalist={minimalist}
                    onCopy={handleCopy}
                    copiedWord={copiedWord}
                />
            ))}
        </div>
    );

    return (
        <div className="results-container">
            {!minimalist && <h2 className="results-title">Rhymes for <span className="highlight">{searchedWord}</span></h2>}

            {results.best?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>🔥 Perfect</h3>
                    {renderGrid(results.best, 'best')}
                </div>
            )}

            {results.good?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>✨ Good</h3>
                    {renderGrid(results.good, 'good')}
                </div>
            )}

            {results.near?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>🌊 Near</h3>
                    {renderGrid(results.near, 'near')}
                </div>
            )}
        </div>
    );
}

export default RhymeResults;
