import { useState, useEffect } from 'react';
import BeatPlayer from './BeatPlayer';
import SearchInput from './SearchInput';
import RhymeResults from './RhymeResults';
import { findRhymes } from '../utils/rhymeEngine';
import { supabase } from '../supabaseClient';
import { fetchUserLyrics, saveUserLyric, deleteUserLyric } from '../utils/dbUtils';
import { IoCloudUploadOutline, IoListOutline, IoAdd, IoTrashOutline, IoSaveOutline } from 'react-icons/io5';
import './Studio.css';

function Studio() {
    const [lyrics, setLyrics] = useState('');
    const [title, setTitle] = useState('Untitled Track'); // New: Track Title
    const [currentId, setCurrentId] = useState(null); // ID of currently open lyric
    const [searchedWord, setSearchedWord] = useState('');
    const [results, setResults] = useState({ best: [], good: [], near: [] });

    // Cloud State
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

    const handleWordClick = (e) => {
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
            alert("Saved successfully! ☁️");
        } catch (err) {
            alert("Error saving: " + err.message);
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
            <div className="studio-header">
                <div className="header-left">
                    <h2>🎛️ Studio</h2>
                    {user && (
                        <div className="studio-controls">
                            <button className="ctrl-btn" onClick={() => setShowSidebar(!showSidebar)}>
                                <IoListOutline /> My Songs
                            </button>
                            <button className="ctrl-btn" onClick={handleNew}>
                                <IoAdd /> New
                            </button>
                            <button className="ctrl-btn primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : <><IoSaveOutline /> Save</>}
                            </button>
                        </div>
                    )}
                </div>
                <BeatPlayer />
            </div>

            <div className="studio-workspace">
                {/* Lyrics List Sidebar (Overlay or Shift) */}
                {showSidebar && user && (
                    <div className="lyrics-sidebar">
                        <h3>My Collection</h3>
                        <ul className="saved-list">
                            {savedLyrics.map(l => (
                                <li
                                    key={l.id}
                                    className={currentId === l.id ? 'active' : ''}
                                    onClick={() => handleLoadlyric(l)}
                                >
                                    <div className="song-info">
                                        <span className="song-title">{l.title || 'Untitled'}</span>
                                        <span className="song-date">{new Date(l.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <button className="del-btn" onClick={(e) => handleDelete(e, l.id)}>
                                        <IoTrashOutline />
                                    </button>
                                </li>
                            ))}
                            {savedLyrics.length === 0 && <p className="empty-msg">No saved songs yet.</p>}
                        </ul>
                    </div>
                )}

                <div className="editor-panel">
                    <div className="panel-controls">
                        <input
                            type="text"
                            className="title-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Track Title..."
                        />
                        <span className="panel-hint">Double-click words to rhyme</span>
                    </div>
                    <textarea
                        className="lyrics-input"
                        placeholder="Write your bars here..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        onDoubleClick={handleWordClick}
                    />
                </div>

                <div className="rhyme-panel">
                    <div className="panel-label">🔍 Rhyme Finder</div>
                    <SearchInput onSearch={handleSearch} />
                    <div className="results-scroll-area">
                        <RhymeResults results={results} searchedWord={searchedWord} minimalist={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Studio;
