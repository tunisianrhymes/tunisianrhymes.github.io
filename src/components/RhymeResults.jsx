import { useState, useEffect } from 'react';
import { countSyllables } from '../utils/syllableCounter';
import { IoHeart, IoHeartOutline } from 'react-icons/io5';
import { toggleLikeWord, getWordStats, getWordsLikes } from '../utils/dbUtils';
import './RhymeResults.css';

// Extracted component to manage individual like state
const WordCard = ({ item, type, minimalist, onCopy, copiedWord, onLikeChange }) => {
    const [liked, setLiked] = useState(false);
    const [stats, setStats] = useState({ likes: item.likes || 0, likedByUser: false });
    const syl = countSyllables(item.word);

    useEffect(() => {
        let isMounted = true;
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
        const newLiked = !liked;
        const newLikes = newLiked ? stats.likes + 1 : stats.likes - 1;

        setLiked(newLiked);
        setStats(prev => ({
            ...prev,
            likes: newLikes,
            likedByUser: newLiked
        }));

        await toggleLikeWord(item.word);

        // Notify parent if likes crossed the promotion threshold
        if (onLikeChange) {
            onLikeChange(item.word, newLikes);
        }
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
    const [promotedResults, setPromotedResults] = useState({ best: [], good: [], near: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch likes and reorganize results when results change
    useEffect(() => {
        if (!results || (!results.best?.length && !results.good?.length && !results.near?.length)) {
            setPromotedResults({ best: [], good: [], near: [] });
            setIsLoaded(true);
            return;
        }

        const fetchAndPromote = async () => {
            // Collect all words from all categories
            const allItems = [
                ...(results.best || []).map(i => ({ ...i, originalCategory: 'best' })),
                ...(results.good || []).map(i => ({ ...i, originalCategory: 'good' })),
                ...(results.near || []).map(i => ({ ...i, originalCategory: 'near' }))
            ];

            const allWords = allItems.map(i => i.word);

            // Fetch likes for all words
            const likesMap = await getWordsLikes(allWords);

            // Add likes to all items
            allItems.forEach(item => {
                item.likes = likesMap[item.word] || 0;
            });

            // Sort ALL items by likes (most liked first)
            allItems.sort((a, b) => (b.likes || 0) - (a.likes || 0));

            // The most liked words go to Perfect, next to Good, rest to Near
            const newBest = [];
            const newGood = [];
            const newNear = [];

            allItems.forEach(item => {
                const likes = item.likes || 0;

                // If it has any likes, promote it up one category
                // If it has many likes (top liked), go to Perfect
                if (likes > 0) {
                    if (item.originalCategory === 'best' || likes >= 2) {
                        // Already best OR has 2+ likes -> stays/goes to Perfect
                        newBest.push(item);
                    } else if (item.originalCategory === 'good' || likes >= 1) {
                        // Was good OR has 1 like -> goes to Good
                        newGood.push(item);
                    } else {
                        newNear.push(item);
                    }
                } else {
                    // No likes - keep in original category
                    if (item.originalCategory === 'best') {
                        newBest.push(item);
                    } else if (item.originalCategory === 'good') {
                        newGood.push(item);
                    } else {
                        newNear.push(item);
                    }
                }
            });

            // Sort each category by likes
            newBest.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            newGood.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            newNear.sort((a, b) => (b.likes || 0) - (a.likes || 0));

            setPromotedResults({ best: newBest, good: newGood, near: newNear });
            setIsLoaded(true);
        };

        fetchAndPromote();
    }, [results]);

    // Handle like changes to potentially re-promote
    const handleLikeChange = (word, newLikes) => {
        // Trigger a re-fetch after like changes
        // This is a simple approach - could optimize with local state updates
        setIsLoaded(false);
        setTimeout(() => setIsLoaded(true), 100);
    };

    if (!searchedWord && !minimalist) return null;
    if (!searchedWord && minimalist) return <div className="no-results-min">Select a word to search...</div>;

    const hasResults = promotedResults.best?.length > 0 || promotedResults.good?.length > 0 || promotedResults.near?.length > 0;

    if (isLoaded && !hasResults) {
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
                    onLikeChange={handleLikeChange}
                />
            ))}
        </div>
    );

    return (
        <div className="results-container">
            {!minimalist && <h2 className="results-title">Rhymes for <span className="highlight">{searchedWord}</span></h2>}

            {promotedResults.best?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>🔥 Perfect</h3>
                    {renderGrid(promotedResults.best, 'best')}
                </div>
            )}

            {promotedResults.good?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>✨ Good</h3>
                    {renderGrid(promotedResults.good, 'good')}
                </div>
            )}

            {promotedResults.near?.length > 0 && (
                <div className="results-group">
                    <h3 className={minimalist ? 'h3-min' : ''}>🌊 Near</h3>
                    {renderGrid(promotedResults.near, 'near')}
                </div>
            )}
        </div>
    );
}

export default RhymeResults;
