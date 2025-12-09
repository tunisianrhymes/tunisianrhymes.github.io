import { supabase } from '../supabaseClient';



/**
 * Fetch approved words from Supabase dictionary.
 * Returns an array of strings.
 */
export const fetchDbWords = async () => {
    try {
        // Fetch words with more than 0 likes or just strictly 'approved' once we have that column
        // For now, fetch all from 'words' table
        const { data, error } = await supabase
            .from('words')
            .select('word, likes');

        if (error) throw error;
        // Return full objects now, not just strings
        return data;
    } catch (err) {
        console.error('Failed to fetch DB words:', err);
        return [];
    }
};

/**
 * Toggle Like for a word.
 * Wrapper for the RPC function 'toggle_like'
 */
export const toggleLikeWord = async (wordStr) => {
    try {
        // First get the ID of the word.
        // Note: This requires the word to exist in the 'words' table.
        // If it's a local-only word, we might need to insert it first?
        // STRATEGY: Only "DB" words can be liked for now, OR we auto-insert local words to DB when liked.

        // 1. Check if word exists
        let { data: wordRecord } = await supabase
            .from('words')
            .select('id')
            .eq('word', wordStr)
            .single();

        if (!wordRecord) {
            // It's a local word not yet in DB. Insert it!
            const { data: newWord, error: insertError } = await supabase
                .from('words')
                .insert({ word: wordStr, syllables: 0 }) // Syllables calc is local but we can store 0
                .select()
                .single();

            if (insertError) throw insertError;
            wordRecord = newWord;
        }

        // 2. Toggle Like
        const { error } = await supabase.rpc('toggle_like', { target_word_id: wordRecord.id });
        if (error) throw error;

        return true;
    } catch (err) {
        console.error('Error toggling like:', err);
        return false;
    }
};

/**
 * Get like count and user status for a word
 */
export const getWordStats = async (wordStr) => {
    try {
        const { data: wordRecord } = await supabase
            .from('words')
            .select('id, likes')
            .eq('word', wordStr)
            .single();

        if (!wordRecord) return { likes: 0, likedByUser: false };

        // Check if user liked it
        const { data: { session } } = await supabase.auth.getSession();
        let likedByUser = false;

        if (session) {
            const { data: likeRecord } = await supabase
                .from('user_likes')
                .select('*')
                .eq('word_id', wordRecord.id)
                .eq('user_id', session.user.id)
                .single();
            likedByUser = !!likeRecord;
        }

        return { likes: wordRecord.likes, likedByUser };

    } catch (err) {
        return { likes: 0, likedByUser: false };
    }
};

/**
 * Fetch logs for the current user
 */
export const fetchUserLyrics = async () => {
    try {
        const { data, error } = await supabase
            .from('lyrics')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching lyrics:', err);
        return [];
    }
};

/**
 * Save or Update lyrics
 */
export const saveUserLyric = async (id, title, content, isPublic = false) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const payload = {
            user_id: session.user.id,
            title,
            content,
            is_public: isPublic,
            updated_at: new Date()
        };

        if (id) {
            // Update
            const { data, error } = await supabase
                .from('lyrics')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            // Insert
            const { data, error } = await supabase
                .from('lyrics')
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    } catch (err) {
        console.error('Error saving lyric:', err);
        throw err;
    }
};

/**
 * Delete a lyric
 */
export const deleteUserLyric = async (id) => {
    try {
        const { error } = await supabase
            .from('lyrics')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting lyric:', err);
        return false;
    }
};
