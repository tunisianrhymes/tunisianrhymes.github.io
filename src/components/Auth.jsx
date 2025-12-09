import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { IoLogoGoogle, IoLogOutOutline, IoPersonCircleOutline } from 'react-icons/io5';
import './Auth.css';

const Auth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error.message);
            alert('Login failed: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <div className="auth-loading">...</div>;
    }

    return (
        <div className="auth-container">
            {user ? (
                <div className="user-profile">
                    <div className="user-info">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Avatar"
                                className="user-avatar"
                            />
                        ) : (
                            <IoPersonCircleOutline size={24} />
                        )}
                        <span className="user-name">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                    </div>
                    <button onClick={handleLogout} className="auth-btn logout" title="Sign Out">
                        <IoLogOutOutline size={20} />
                    </button>
                </div>
            ) : (
                <button onClick={handleLogin} className="auth-btn google-login">
                    <IoLogoGoogle size={18} />
                    <span>Sign in</span>
                </button>
            )}
        </div>
    );
};

export default Auth;
