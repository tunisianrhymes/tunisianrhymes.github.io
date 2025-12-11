import { useState, useEffect } from 'react';
import BeatPlayer from './BeatPlayer';
import SearchInput from './SearchInput';
import RhymeResults from './RhymeResults';
import { findRhymes } from '../utils/rhymeEngine';
import { supabase } from '../supabaseClient';
import { fetchUserLyrics, saveUserLyric, deleteUserLyric } from '../utils/dbUtils';
import { IoListOutline, IoAdd, IoTrashOutline, IoSaveOutline } from 'react-icons/io5';
import './Studio.css';

function Studio() {
    const [lyrics, setLyrics] = useState('');
    const [title, setTitle] = useState('Untitled Track');
    const [currentId, setCurrentId] = useState(null);
    const [searchedWord, setSearchedWord] = useState('');
    const [results, setResults] = useState({ best: [], good: [], near: [] });

    const [user, setUser] = useState(null);
    const [savedLyrics, setSavedLyrics] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user);
            if (session?.user) loadSavedLyrics();
        });
    }, []);

    const loadSavedLyrics = async () => {
        const data = await fetchUserLyrics();
        setSavedLyrics(data || []);
    };

    const handleSearch = (word) => {
        const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        setSearchedWord(clean);
        const rhymes = findRhymes(clean);
        setResults(rhymes);
    };

    const handleWordClick = () => {
        const selection = window.getSelection().toString();
        if (selection && selection.trim().length > 0) {
            handleSearch(selection.trim());
        }
    };

    const handleSave = async () => {
        if (!user) return alert("Please sign in to save!");
        setIsSaving(true);
        try {
            const saved = await saveUserLyric(currentId, title, lyrics);
            setCurrentId(saved.id);
            await loadSavedLyrics();
            alert("Saved! ☁️");
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadlyric = (item) => {
        setCurrentId(item.id);
        setTitle(item.title || 'Untitled');
        setLyrics(item.content || '');
        setShowSidebar(false);
    };

    const handleNew = () => {
        setCurrentId(null);
        setTitle('Untitled Track');
        setLyrics('');
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm("Delete this song?")) {
            await deleteUserLyric(id);
            if (currentId === id) handleNew();
            loadSavedLyrics();
        }
    };

    return (
        <div className="studio-container">
            {/* Beat Player - Top */}
            <BeatPlayer />

            {/* Header with Title + Actions */}
            <div className="studio-header-simple">
                <input
                    type="text"
                    className="title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Track Title..."
                />
                {user && (
                    <div className="studio-actions">
                        <button className="studio-action-btn" onClick={() => setShowSidebar(!showSidebar)}>
                            <IoListOutline />
                        </button>
                        <button className="studio-action-btn" onClick={handleNew}>
                            <IoAdd />
                        </button>
                        <button className="studio-action-btn primary" onClick={handleSave} disabled={isSaving}>
                            <IoSaveOutline />
                        </button>
                    </div>
                )}
            </div>

            {/* Saved Songs Modal */}
            {showSidebar && user && (
                <div className="modal-overlay" onClick={() => setShowSidebar(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>My Songs</h3>
                        <ul className="saved-list">
                            {savedLyrics.map(l => (
                                <li key={l.id} className={currentId === l.id ? 'active' : ''} onClick={() => handleLoadlyric(l)}>
                                    <span className="song-title">{l.title || 'Untitled'}</span>
                                    <button className="del-btn" onClick={(e) => handleDelete(e, l.id)}>
                                        <IoTrashOutline />
                                    </button>
                                </li>
                            ))}
                            {savedLyrics.length === 0 && <p className="empty-msg">No saved songs.</p>}
                        </ul>
                    </div>
                </div>
            )}

            {/* Editor */}
            <div className="editor-simple">
                <textarea
                    className="lyrics-input"
                    placeholder="Write your bars here... (Double-tap a word to find rhymes)"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    onDoubleClick={handleWordClick}
                />
            </div>

            {/* Rhyme Finder */}
            <div className="rhyme-finder-simple">
                <SearchInput onSearch={handleSearch} />
                <div className="results-area">
                    <RhymeResults results={results} searchedWord={searchedWord} minimalist={true} />
                </div>
            </div>
        </div>
    );
}

export default Studio;

