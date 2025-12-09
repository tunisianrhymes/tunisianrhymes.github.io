import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { importWordsFromText, getDictionaryStats, removeDuplicates } from '../utils/dictionaryManager';
import { IoCloudUpload, IoLockClosed, IoKey, IoCheckmarkDone, IoTrash, IoStatsChart } from 'react-icons/io5';
import './DictionaryManager.css';

function DictionaryManager({ currentWords, onUpdateWords }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [inputText, setInputText] = useState('');
    const [previewWords, setPreviewWords] = useState([]);
    const [importedCount, setImportedCount] = useState(0);
    const [activeTab, setActiveTab] = useState('import'); // 'import' | 'stats'
    const [isUploading, setIsUploading] = useState(false);

    const stats = getDictionaryStats(currentWords);

    // 🔐 Admin Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const { data: isValid, error } = await supabase.rpc('verify_admin_password', {
                input_pass: password
            });

            if (error) throw error;

            if (isValid) {
                setIsAdmin(true);
            } else {
                setLoginError('Incorrect password');
            }
        } catch (err) {
            console.error(err);
            setLoginError('Access Denied');
        }
    };

    const handleTextChange = (e) => {
        const text = e.target.value;
        setInputText(text);

        // Live preview
        if (text.trim()) {
            const found = importWordsFromText(text);
            const uniqueNew = found.filter(w => !currentWords.includes(w));
            setPreviewWords(uniqueNew);
        } else {
            setPreviewWords([]);
        }
    };

    // 🌍 Cloud Upload (Backdoor)
    const handleCloudUpload = async () => {
        if (previewWords.length === 0) return;
        setIsUploading(true);

        try {
            // 1. Prepare data
            const cleanPreview = removeDuplicates(previewWords);
            const rows = cleanPreview.map(w => ({ word: w, syllables: 0 }));

            // 2. Insert to Supabase (Ignore duplicates)
            const { error } = await supabase
                .from('words')
                .upsert(rows, { onConflict: 'word', ignoreDuplicates: true });

            if (error) throw error;

            // 3. Update local state
            const newTotal = removeDuplicates([...currentWords, ...cleanPreview]);
            onUpdateWords(newTotal);

            setImportedCount(previewWords.length);
            setInputText('');
            setPreviewWords([]);
            setTimeout(() => setImportedCount(0), 3000);

        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // 🔒 Lock Screen layout
    if (!isAdmin) {
        return (
            <div className="dictionary-manager locked">
                <div className="login-card">
                    <IoLockClosed className="lock-icon" />
                    <h2>Admin Access</h2>
                    <p>Enter password to manage dictionary</p>
                    <form onSubmit={handleLogin}>
                        <div className="password-input-wrapper">
                            <IoKey />
                            <input
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="unlock-btn">Unlock Manager</button>
                    </form>
                    {loginError && <p className="error-msg">{loginError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="dictionary-manager">
            <div className="dm-header">
                <h2><IoCloudUpload /> Admin Panel</h2>
                <div className="dm-tabs">
                    <button
                        className={`dm-tab ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                    >
                        Add Words
                    </button>
                    <button
                        className={`dm-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Database Stats
                    </button>
                </div>
            </div>

            {activeTab === 'import' && (
                <div className="dm-content import-mode">
                    <div className="input-section">
                        <textarea
                            placeholder="Paste text here to extract rhymes... (comma, space, or newline separated)"
                            value={inputText}
                            onChange={handleTextChange}
                            className="dm-textarea"
                        />
                        <div className="preview-status">
                            {previewWords.length > 0 ? (
                                <span className="status-new">Ready to add <strong>{previewWords.length}</strong> new words!</span>
                            ) : (
                                <span className="status-idle">{inputText ? 'No new unique words found.' : 'Waiting for input...'}</span>
                            )}
                        </div>
                    </div>

                    <div className="action-section">
                        <button
                            className="dm-btn primary"
                            onClick={handleCloudUpload}
                            disabled={previewWords.length === 0 || isUploading}
                        >
                            {isUploading ? 'Uploading...' : <><IoCloudUpload /> Upload to Database</>}
                        </button>
                        <button
                            className="dm-btn secondary"
                            onClick={() => setInputText('')}
                            disabled={!inputText}
                        >
                            <IoTrash /> Clear
                        </button>
                    </div>

                    {importedCount > 0 && (
                        <div className="success-toast">
                            <IoCheckmarkDone /> Successfully uploaded {importedCount} words to the cloud!
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="dm-content stats-mode">
                    <div className="stat-card">
                        <IoStatsChart className="stat-icon" />
                        <h3>Total Words in App</h3>
                        <p className="stat-value">{stats.totalWords}</p>
                    </div>
                    <div className="stat-list">
                        <h4>Top Rhymes</h4>
                        <ul>
                            {stats.topEndings.map(([ending, count]) => (
                                <li key={ending}>
                                    <span className="ending">-{ending}</span>
                                    <span className="count">{count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DictionaryManager;
