import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { IoLogoGoogle, IoClose } from 'react-icons/io5';
import './LoginPrompt.css';

const LoginPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // If not logged in & haven't dismissed it this session
            if (!session && !sessionStorage.getItem('loginPromptDismissed')) {
                // Show after 2 seconds
                const timer = setTimeout(() => setIsVisible(true), 2000);
                return () => clearTimeout(timer);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error.message);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('loginPromptDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="login-prompt-overlay" onClick={handleDismiss}>
            <div className="login-prompt-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={handleDismiss}>
                    <IoClose />
                </button>
                <div className="prompt-content">
                    <h3>Unlock Full Features 🔓</h3>
                    <p>Sign in to save your lyrics and like your favorite rhymes!</p>
                    <button className="google-login-large" onClick={handleLogin}>
                        <IoLogoGoogle /> Continue with Google
                    </button>
                    <button className="maybe-later" onClick={handleDismiss}>
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPrompt;
