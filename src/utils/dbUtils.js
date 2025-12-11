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
 * Get likes for multiple words at once (batch).
 * Returns a map of { word: likeCount }
 */
export const getWordsLikes = async (wordStrings) => {
    try {
        if (!wordStrings || wordStrings.length === 0) return {};

        const { data, error } = await supabase
            .from('words')
            .select('word, likes')
            .in('word', wordStrings);

        if (error) throw error;

        const likesMap = {};
        data.forEach(item => {
            likesMap[item.word] = item.likes || 0;
        });

        return likesMap;
    } catch (err) {
        console.error('Error fetching batch likes:', err);
        return {};
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

/**
 * Remove duplicate words from the database.
 * Keeps the version with the most likes.
 */
export const removeDbDuplicates = async () => {
    try {
        console.log("Starting deduplication...");
        // Fetch up to 10,000 words (supabase default limit is usually 1000, need range)
        const { data: allWords, error } = await supabase
            .from('words')
            .select('id, word, likes')
            .range(0, 9999);

        if (error) throw error;

        console.log(`Fetched ${allWords.length} words.`);

        const uniqueMap = new Map();
        const idsToDelete = [];

        // Identify duplicates
        allWords.forEach(record => {
            const normalized = record.word.trim().toLowerCase();

            if (uniqueMap.has(normalized)) {
                // Conflict! Decide which one to keep
                const existing = uniqueMap.get(normalized);

                // Keep the one with MORE likes
                if ((record.likes || 0) > (existing.likes || 0)) {
                    // New one is better, delete the old one
                    idsToDelete.push(existing.id);
                    uniqueMap.set(normalized, record);
                } else {
                    // Existing is better or equal, delete the new one
                    idsToDelete.push(record.id);
                }
            } else {
                uniqueMap.set(normalized, record);
            }
        });

        console.log(`Found ${idsToDelete.length} duplicates to remove.`);

        if (idsToDelete.length === 0) return 0;

        // Delete duplicates in batches of 50 to avoid URL length issues
        const batchSize = 50;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize);
            const { error: deleteError } = await supabase
                .from('words')
                .delete()
                .in('id', batch);

            if (deleteError) throw deleteError;
        }

        return idsToDelete.length;

    } catch (err) {
        console.error('Deduplication failed:', err);
        throw err;
    }
};
