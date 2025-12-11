import React, { useState, useEffect } from 'react';
import { findRhymes } from '../utils/rhymeEngine';
import './RhymeTrainer.css';

// Helper to save/load corrections from localStorage
const STORAGE_KEY = 'rhyme_corrections';
export const getCorrections = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
const saveCorrections = (corrections) => localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));

export default function RhymeTrainer({ words = [] }) {
    const [word, setWord] = useState('');
    const [results, setResults] = useState({ best: [], good: [], near: [] });
    const [corrections, setCorrections] = useState(getCorrections());
    const [stats, setStats] = useState({
        perfect: 0, good: 0, near: 0, wrong: 0, duplicate: 0,
        percentage: 0, total: 0, verified: 0
    });
    const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);

    useEffect(() => {
        if (!word) return;

        // simple debounce
        const timer = setTimeout(() => {
            refreshResults();
        }, 500);
        return () => clearTimeout(timer);
    }, [word, corrections, showUnverifiedOnly]);

    const suggestNextWord = () => {
        if (!words || words.length === 0) {
            alert("No dictionary loaded.");
            return;
        }

        // Filter words that have NO corrections entry in localStorage
        // Note: corrections keys are lowercased
        const candidates = words.filter(w => !corrections[w.toLowerCase()]);

        if (candidates.length === 0) {
            alert("🎉 You have verified the entire dictionary! Amazing!");
            return;
        }

        const randomWord = candidates[Math.floor(Math.random() * candidates.length)];
        setWord(randomWord);
        setShowUnverifiedOnly(true); // Automatically help user focus
    };

    const refreshResults = () => {
        // 1. Get raw engine results
        const rawResults = findRhymes(word);

        // 2. Apply corrections locally for the view
        const wordCorrections = corrections[word.toLowerCase()] || {};
        const processed = { best: [], good: [], near: [], wrong: [], duplicate: [] };

        // Stats calculation vars
        let totalItems = 0;
        let verifiedItems = 0;

        // Collect all raw items to count
        const allRawItems = [
            ...rawResults.best.map(i => ({ ...i, rawCat: 'best' })),
            ...rawResults.good.map(i => ({ ...i, rawCat: 'good' })),
            ...rawResults.near.map(i => ({ ...i, rawCat: 'near' }))
        ];

        totalItems = allRawItems.length;

        // Process placement
        allRawItems.forEach(item => {
            const override = wordCorrections[item.word];

            if (override) {
                verifiedItems++;
                // If override exists, place in that category
                if (processed[override]) processed[override].push(item);
            } else {
                // Otherwise keep original
                processed[item.rawCat].push(item);
            }
        });

        // Filter for "Unverified Only" view
        if (showUnverifiedOnly) {
            ['best', 'good', 'near', 'wrong', 'duplicate'].forEach(cat => {
                processed[cat] = processed[cat].filter(item => !wordCorrections[item.word]);
            });
        }

        setResults(processed);

        // Calculate stats
        setStats({
            perfect: processed.best.length,
            good: processed.good.length,
            near: processed.near.length,
            wrong: processed.wrong?.length || 0,
            duplicate: processed.duplicate?.length || 0,
            percentage: totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0,
            total: totalItems,
            verified: verifiedItems
        });
    };

    const handleAction = (targetWord, action) => {
        const newCorrections = { ...corrections };
        const key = word.toLowerCase();

        if (!newCorrections[key]) newCorrections[key] = {};

        if (action === 'reset') {
            delete newCorrections[key][targetWord];
        } else {
            newCorrections[key][targetWord] = action;
        }

        if (Object.keys(newCorrections[key]).length === 0) {
            delete newCorrections[key];
        }

        setCorrections(newCorrections);
        saveCorrections(newCorrections);
    };

    const categories = [
        { id: 'best', label: '🔥 Perfect', color: '#ff4d4d' },
        { id: 'good', label: '✨ Good', color: '#ffb347' },
        { id: 'near', label: '🌊 Near', color: '#4da6ff' },
        { id: 'wrong', label: '❌ Wrong', color: '#666' },
        { id: 'duplicate', label: '👯 Dupe', color: '#999' }
    ];

    return (
        <div className="trainer-container">
            <div className="trainer-header">
                <h2>🧠 Rhyme Trainer</h2>
                <div className="trainer-search" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder="Type a word..."
                        style={{ margin: 0 }}
                    />
                    <button
                        onClick={suggestNextWord}
                        className="dice-btn"
                        title="Give me a random unverified word"
                        style={{
                            background: '#a855f7',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            color: '#fff',
                            height: 'auto'
                        }}
                    >
                        🎲
                    </button>
                </div>

                {/* Progress Bar */}
                {stats.total > 0 && (
                    <div className="trainer-progress-section" style={{ maxWidth: '500px', margin: '1rem auto 0' }}>
                        <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#bbb' }}>
                            <span>Verified: {stats.verified} / {stats.total}</span>
                            <span>{stats.percentage}%</span>
                        </div>
                        <div className="progress-track" style={{ background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${stats.percentage}%`,
                                    background: stats.percentage === 100 ? '#4ade80' : '#60a5fa',
                                    height: '100%',
                                    transition: 'width 0.3s ease'
                                }}
                            />
                        </div>

                        <div className="filter-controls" style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={showUnverifiedOnly}
                                    onChange={(e) => setShowUnverifiedOnly(e.target.checked)}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <span style={{ color: showUnverifiedOnly ? '#fff' : '#bbb' }}>Show Unverified Only</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="trainer-stats" style={{ marginTop: '1rem' }}>
                    Loaded Rules: {Object.keys(corrections).length} | Total Words: {words.length}
                </div>
            </div>

            <div className="trainer-board">
                {categories.map(cat => (
                    <div key={cat.id} className={`trainer-column col-${cat.id}`}>
                        <div className="col-header" style={{ borderBottomColor: cat.color }}>
                            <h3>{cat.label}</h3>
                            <span className="count">{results[cat.id]?.length || 0}</span>
                        </div>
                        <div className="col-content">
                            {results[cat.id]?.map((item) => (
                                <div key={item.word} className="trainer-card">
                                    <span className="word-text">{item.word}</span>
                                    <div className="card-actions">
                                        {cat.id !== 'best' && <button onClick={() => handleAction(item.word, 'best')} title="Move to Perfect">🔥</button>}
                                        {cat.id !== 'good' && <button onClick={() => handleAction(item.word, 'good')} title="Move to Good">✨</button>}
                                        {cat.id !== 'near' && <button onClick={() => handleAction(item.word, 'near')} title="Move to Near">🌊</button>}
                                        {cat.id !== 'wrong' && <button onClick={() => handleAction(item.word, 'wrong')} title="Mark Wrong">❌</button>}
                                        {cat.id !== 'duplicate' && <button onClick={() => handleAction(item.word, 'duplicate')} title="Mark Dupe">👯</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="trainer-footer">
                <button className="export-btn" onClick={() => {
                    console.log(JSON.stringify(corrections, null, 2));
                    alert('Corrections printed to console! You can send this to the developer.');
                }}>
                    📤 Export Training Data
                </button>
            </div>
        </div>
    );
}
