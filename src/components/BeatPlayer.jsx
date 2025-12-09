import { useEffect, useRef, useState } from 'react';
import {
    IoPlaySkipBack,
    IoPlaySkipForward,
    IoPlay,
    IoPause,
    IoMusicalNotes,
    IoRepeat,
    IoShuffle,
    IoVolumeHigh,
    IoVolumeLow
} from 'react-icons/io5';
import './BeatPlayer.css';

function BeatPlayer() {
    const playerRef = useRef(null);
    const progressInterval = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [currentTrack, setCurrentTrack] = useState('Loading...');
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);

    useEffect(() => {
        // Load YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Initialize player when API is ready
        window.onYouTubeIframeAPIReady = () => {
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '0',
                width: '0',
                videoId: 'pOmcqVVG6ZI',
                playerVars: {
                    listType: 'playlist',
                    list: 'PLyL1gt8qZIC5Lfn5IcZnAM7ofR5g05a1I',
                    autoplay: 0,
                    controls: 0, // Hide default controls
                },
                events: {
                    onReady: (event) => {
                        setIsReady(true);
                        updateTrackInfo();
                        event.target.setVolume(100);
                        // Default shuffle to true as per request "make the beats random"
                        event.target.setShuffle(true);
                        setIsShuffle(true);
                    },
                    onStateChange: (event) => {
                        handleStateChange(event);
                    },
                    onError: (e) => console.error("Player Error:", e)
                },
            });
        };

        if (window.YT && window.YT.Player) {
            window.onYouTubeIframeAPIReady();
        }

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, []);

    // Handle Player State Changes
    const handleStateChange = (event) => {
        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);

        if (event.data === window.YT.PlayerState.PLAYING) {
            updateTrackInfo();
            startProgressTimer();
        } else {
            stopProgressTimer();
        }

        // Handle Repeat One Logic
        if (event.data === window.YT.PlayerState.ENDED) {
            if (isRepeat) {
                // If repeat is on, replay the same video
                playerRef.current.seekTo(0);
                playerRef.current.playVideo();
            }
            // If shuffle is on (handled by playlist natively if setShuffle(true))
        }
    };

    const startProgressTimer = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                setCurrentTime(time);
                setDuration(dur);
            }
        }, 1000);
    };

    const stopProgressTimer = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    const updateTrackInfo = () => {
        if (playerRef.current && playerRef.current.getVideoData) {
            const videoData = playerRef.current.getVideoData();
            if (videoData && videoData.title) {
                setCurrentTrack(videoData.title);
            }
        }
    };

    const handlePlayPause = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleNext = () => {
        if (playerRef.current) {
            playerRef.current.nextVideo();
            setTimeout(updateTrackInfo, 500);
        }
    };

    const handlePrevious = () => {
        if (playerRef.current) {
            playerRef.current.previousVideo();
            setTimeout(updateTrackInfo, 500);
        }
    };

    const toggleShuffle = () => {
        if (playerRef.current) {
            const newShuffle = !isShuffle;
            playerRef.current.setShuffle(newShuffle);
            setIsShuffle(newShuffle);
            // YouTube requires playing next video to apply shuffle effectively usually
            // or just setting it is enough for next auto-play
        }
    };

    const toggleRepeat = () => {
        // We handle repeat manually in onStateChange
        setIsRepeat(!isRepeat);
    };

    const handleVolumeChange = (change) => {
        if (!playerRef.current) return;
        let newVol = volume + change;
        if (newVol > 100) newVol = 100;
        if (newVol < 0) newVol = 0;
        setVolume(newVol);
        playerRef.current.setVolume(newVol);
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (playerRef.current) {
            playerRef.current.seekTo(time, true);
        }
    };

    // Format time helper
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="beat-player">
            {/* Hidden Player */}
            <div id="youtube-player" style={{ display: 'none' }}></div>

            <div className="player-info">
                <IoMusicalNotes className="player-icon" />
                <span className="player-title">{currentTrack}</span>
            </div>

            {/* Time & Progress */}
            <div className="progress-container">
                <span className="time-text">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="progress-bar"
                />
                <span className="time-text">{formatTime(duration)}</span>
            </div>

            <div className="controls-row">
                {/* Secondary Controls */}
                <div className="secondary-controls">
                    <button
                        className={`control-btn small ${isShuffle ? 'active' : ''}`}
                        onClick={toggleShuffle}
                        title="Shuffle"
                        disabled={!isReady}
                    >
                        <IoShuffle />
                    </button>

                    <button
                        className="control-btn small"
                        onClick={() => handleVolumeChange(-10)}
                        title="Volume Down"
                        disabled={!isReady}
                    >
                        <IoVolumeLow />
                    </button>
                    <button
                        className="control-btn small"
                        onClick={() => handleVolumeChange(10)}
                        title="Volume Up"
                        disabled={!isReady}
                    >
                        <IoVolumeHigh />
                    </button>
                </div>

                {/* Main Controls */}
                <div className="main-controls">
                    <button className="control-btn" onClick={handlePrevious} disabled={!isReady}>
                        <IoPlaySkipBack />
                    </button>

                    <button className="control-btn play-btn-main" onClick={handlePlayPause} disabled={!isReady}>
                        {isPlaying ? <IoPause /> : <IoPlay />}
                    </button>

                    <button className="control-btn" onClick={handleNext} disabled={!isReady}>
                        <IoPlaySkipForward />
                    </button>
                </div>

                {/* Repeat Control */}
                <div className="secondary-controls">
                    <button
                        className={`control-btn small ${isRepeat ? 'active' : ''}`}
                        onClick={toggleRepeat}
                        title="Repeat Song"
                        disabled={!isReady}
                    >
                        <IoRepeat />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BeatPlayer;
