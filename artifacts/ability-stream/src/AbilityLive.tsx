// Open-source Jitsi Meet from github.com/jitsi/jitsi-meet
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Video, VideoOff, MessageSquare, Subtitles, Users, PhoneOff, Share2, Maximize2, Minimize2, Save, Trash2, Clock, Radio } from 'lucide-react';
import { api } from './api';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface AbilityLiveProps {
  user: any;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function AbilityLive({ user, onClose }: AbilityLiveProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const sessionStartRef = useRef<number>(0);
  const peakParticipantsRef = useRef<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionsEverUsed, setCaptionsEverUsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [roomName, setRoomName] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [activeRoom, setActiveRoom] = useState('');
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  const generateRoomName = useCallback(() => {
    const uid = user?.uid || Date.now().toString();
    return 'ability-live-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) + '-' + Date.now().toString(36);
  }, [user]);

  useEffect(() => {
    setRoomName(generateRoomName());
  }, [generateRoomName]);

  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      if (sessionStartRef.current) {
        setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isJoined]);

  const loadJitsiScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi'));
      document.head.appendChild(script);
    });
  }, []);

  const startCall = useCallback(async (room: string) => {
    if (!jitsiContainerRef.current) return;
    setIsLoading(true);
    setError('');

    try {
      await loadJitsiScript();

      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      const displayName = user?.username || user?.email?.split('@')[0] || 'AbilityCreator';
      setActiveRoom(room);
      sessionStartRef.current = Date.now();
      peakParticipantsRef.current = 1;
      setCaptionsEverUsed(false);
      setElapsedTime(0);

      const jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: room,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [],
          hideConferenceSubject: true,
          hideConferenceTimer: false,
          disableModeratorIndicator: false,
          enableClosePage: false,
          enableNoisyMicDetection: true,
          resolution: 720,
          constraints: { video: { height: { ideal: 720, max: 1080, min: 360 } } },
          transcription: { enabled: true, useAppLanguage: true },
          disableThirdPartyRequests: false,
          enableWelcomePage: false,
          enableLobby: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          TOOLBAR_TIMEOUT: 3000,
          FILM_STRIP_MAX_HEIGHT: 100,
          DISABLE_VIDEO_BACKGROUND: false,
          DEFAULT_BACKGROUND: '#0a0a0a',
          HIDE_INVITE_MORE_HEADER: true,
          MOBILE_APP_PROMO: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISABLE_FOCUS_INDICATOR: true,
          SHOW_POWERED_BY: false,
        },
      });

      jitsiApi.addEventListener('videoConferenceJoined', () => {
        setIsJoined(true);
        setIsLoading(false);
      });

      jitsiApi.addEventListener('participantJoined', () => {
        setParticipantCount(prev => {
          const next = prev + 1;
          if (next > peakParticipantsRef.current) peakParticipantsRef.current = next;
          return next;
        });
      });

      jitsiApi.addEventListener('participantLeft', () => {
        setParticipantCount(prev => Math.max(1, prev - 1));
      });

      jitsiApi.addEventListener('videoConferenceLeft', () => {
        setIsJoined(false);
      });

      jitsiApi.addEventListener('audioMuteStatusChanged', (data: any) => {
        setIsMuted(data.muted);
      });

      jitsiApi.addEventListener('videoMuteStatusChanged', (data: any) => {
        setIsVideoOff(data.muted);
      });

      jitsiApiRef.current = jitsiApi;
    } catch (err: any) {
      setError(err.message || 'Failed to start call');
      setIsLoading(false);
    }
  }, [loadJitsiScript, user]);

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    jitsiApiRef.current?.executeCommand('toggleAudio');
  };

  const toggleVideo = () => {
    jitsiApiRef.current?.executeCommand('toggleVideo');
  };

  const toggleCaptions = () => {
    setCaptionsOn(prev => {
      const next = !prev;
      if (next) setCaptionsEverUsed(true);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.executeCommand('toggleSubtitles');
      }
      return next;
    });
  };

  const toggleChat = () => {
    jitsiApiRef.current?.executeCommand('toggleChat');
    setShowChat(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const shareRoom = () => {
    const url = `https://meet.jit.si/${activeRoom || roomName}`;
    if (navigator.share) {
      navigator.share({ title: 'Join my Ability Live stream', url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const endCall = () => {
    const duration = sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0;

    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('hangup');
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }

    const isGuest = !user?.uid || user.uid.startsWith('guest_');

    if (!isGuest && duration >= 5) {
      setSessionData({
        room_name: activeRoom,
        duration_seconds: duration,
        participant_count: peakParticipantsRef.current,
        captions_used: captionsEverUsed,
      });
      setShowSavePrompt(true);
    }

    setIsJoined(false);
    setIsLoading(false);
    setParticipantCount(1);
    setCaptionsOn(false);
    setShowChat(false);
  };

  const handleSaveSession = async () => {
    if (!sessionData || !user?.uid) return;
    setSaving(true);
    try {
      await api.saveLiveSession({
        user_id: user.uid,
        room_name: sessionData.room_name,
        display_name: user.username || user.email?.split('@')[0] || 'User',
        duration_seconds: sessionData.duration_seconds,
        participant_count: sessionData.participant_count,
        captions_used: sessionData.captions_used,
        notes: saveNotes.trim() || undefined,
      });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
    setSaving(false);
    setShowSavePrompt(false);
    setSessionData(null);
    setSaveNotes('');
    setActiveRoom('');
  };

  const handleDiscardSession = () => {
    setShowSavePrompt(false);
    setSessionData(null);
    setSaveNotes('');
    setActiveRoom('');
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col ability-live-root">
      <div className="ability-live-scanlines" />

      {showSavePrompt && sessionData && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="ability-live-card w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff1493]/10 border border-[#ff1493]/30 mb-3">
                <Radio size={14} className="text-[#ff1493]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff1493]">Session Ended</span>
              </div>
              <h2 className="text-xl font-black italic text-white">
                <span className="text-[#39ff14] glow-text">Save</span> this session?
              </h2>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-gray-400">Room</span>
                <span className="text-[11px] font-mono text-[#39ff14] truncate ml-3 max-w-[180px]">{sessionData.room_name}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-gray-400">Duration</span>
                <span className="text-[11px] font-black text-[#00ffff]">{formatDuration(sessionData.duration_seconds)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-gray-400">Peak Participants</span>
                <span className="text-[11px] font-black text-[#9b5de5]">{sessionData.participant_count}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase text-gray-400">Captions Used</span>
                <span className="text-[11px] font-black text-white">{sessionData.captions_used ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] mb-2 block">Session Notes (optional)</label>
              <textarea
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="What was this session about?"
                rows={2}
                className="ability-live-input w-full resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="ability-live-btn-primary flex-1"
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save to Profile'}</span>
              </button>
              <button
                onClick={handleDiscardSession}
                className="ability-live-btn-close px-4"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isJoined && !isLoading && !showSavePrompt && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="ability-live-logo-glow mb-6">
            <h1 className="text-4xl font-black italic tracking-tight">
              <span className="text-[#ff1493] glow-text">ABILITY</span>
              <span className="text-[#39ff14] glow-text">LIVE</span>
            </h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Real-time streaming</p>
          </div>

          <div className="ability-live-card w-full max-w-md p-6">
            <div className="mb-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] mb-2 block">Room Name</label>
              <input
                type="text"
                value={customRoom || roomName}
                onChange={(e) => setCustomRoom(e.target.value)}
                placeholder="ability-live-room"
                className="ability-live-input w-full"
              />
              <p className="text-[9px] text-gray-500 mt-2 font-mono">Share this name so others can join your stream</p>
            </div>

            <button
              onClick={() => startCall(customRoom || roomName)}
              className="ability-live-btn-primary w-full mb-4"
            >
              <Video size={20} />
              <span>GO LIVE</span>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const joinRoom = prompt('Enter room name to join:');
                  if (joinRoom) {
                    setCustomRoom(joinRoom);
                    startCall(joinRoom);
                  }
                }}
                className="ability-live-btn-secondary flex-1"
              >
                <Users size={16} />
                <span>JOIN ROOM</span>
              </button>

              <button onClick={onClose} className="ability-live-btn-close">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-[#39ff14]/5 border border-[#39ff14]/20">
              <p className="text-[10px] text-[#39ff14] font-bold uppercase tracking-wider mb-1">Voice-to-Text Available</p>
              <p className="text-[9px] text-gray-400 leading-relaxed">Enable auto-captions during your call for accessibility. Powered by Jitsi's built-in speech recognition.</p>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-[#ff1493]/5 border border-[#ff1493]/20">
              <p className="text-[10px] text-[#ff1493] font-bold uppercase tracking-wider mb-1">Live Chat Saves</p>
              <p className="text-[9px] text-gray-400 leading-relaxed">Your live sessions can be saved to your profile after each call. Track duration, participants, and add notes.</p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-[10px] text-red-400 font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && !isJoined && (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className="ability-live-loader mb-4" />
          <p className="text-[#39ff14] font-black text-sm uppercase tracking-widest animate-pulse">Connecting to stream...</p>
        </div>
      )}

      <div
        ref={jitsiContainerRef}
        className={`flex-1 relative z-10 ${isJoined ? 'block' : 'hidden'}`}
        style={{ minHeight: 0 }}
      />

      {isJoined && (
        <div className="ability-live-controls z-20">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-2">
            <button onClick={toggleMute} className={`ability-live-ctrl-btn ${isMuted ? 'ability-live-ctrl-danger' : ''}`} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button onClick={toggleVideo} className={`ability-live-ctrl-btn ${isVideoOff ? 'ability-live-ctrl-danger' : ''}`} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            <button onClick={toggleCaptions} className={`ability-live-ctrl-btn ${captionsOn ? 'ability-live-ctrl-active' : ''}`} title="Toggle captions (voice-to-text)">
              <Subtitles size={20} />
            </button>

            <button onClick={toggleChat} className={`ability-live-ctrl-btn ${showChat ? 'ability-live-ctrl-active' : ''}`} title="Toggle chat">
              <MessageSquare size={20} />
            </button>

            <button onClick={shareRoom} className="ability-live-ctrl-btn" title="Share room link">
              <Share2 size={20} />
            </button>

            <button onClick={toggleFullscreen} className="ability-live-ctrl-btn" title="Fullscreen">
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            <button onClick={endCall} className="ability-live-ctrl-btn ability-live-ctrl-end" title="End call">
              <PhoneOff size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-[#00ffff]" />
              <span className="text-[10px] font-mono font-bold text-[#00ffff]">{formatDuration(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={12} className="text-[#39ff14]" />
              <span className="text-[10px] font-bold text-[#39ff14]">{participantCount}</span>
            </div>
            {captionsOn && (
              <div className="flex items-center gap-1">
                <Subtitles size={12} className="text-[#00ffff]" />
                <span className="text-[10px] font-bold text-[#00ffff] uppercase">CC</span>
              </div>
            )}
            <button onClick={endCall} className="text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors">
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
