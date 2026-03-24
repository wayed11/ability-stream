import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, Play, Pause, Volume2, VolumeX, Subtitles, ChevronDown, Wand2, Film, Trash2 } from 'lucide-react';
import { api } from './api';

interface VideoGen {
  id: string;
  prompt: string;
  status: string;
  video_url?: string;
  luma_gen_id?: string;
  model: string;
  created?: string;
}

interface Props {
  user: any;
  onClose: () => void;
}

const DAILY_LIMIT = 3;

export default function AbilityVideoGen({ user, onClose }: Props) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [pollRecordId, setPollRecordId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<VideoGen[]>([]);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [captionText, setCaptionText] = useState('');
  const captionRecRef = useRef<any>(null);

  const userId = user?.uid || user?.id || '';

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (captionRecRef.current) captionRecRef.current.stop();
    };
  }, []);

  const loadHistory = async () => {
    if (!userId) return;
    try {
      const items = await api.getVideoGens(userId);
      setHistory(items.map((r: any) => ({
        id: r.id,
        prompt: r.prompt,
        status: r.status,
        video_url: r.video_url,
        luma_gen_id: r.luma_gen_id,
        model: r.model,
        created: r.created,
      })));
    } catch {}
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setPrompt(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const startCaptionRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setCaptionText(t);
    };
    rec.onend = () => {
      if (captionsOn && videoRef.current && !videoRef.current.paused) {
        try { rec.start(); } catch {}
      }
    };
    captionRecRef.current = rec;
    try { rec.start(); } catch {}
  };

  const speakMoral = (promptText: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const morals = [
      `This story reminds us: ${promptText.includes('courage') ? 'courage lives in all of us' : 'every ability is a superpower'}.`,
      `Remember: what makes you different, makes you powerful.`,
      `The moral: never let anyone dim your inner light.`,
    ];
    const moral = morals[Math.floor(Math.random() * morals.length)];
    const utter = new SpeechSynthesisUtterance(moral);
    utter.rate = 0.85;
    utter.pitch = 1.1;
    setTimeout(() => window.speechSynthesis.speak(utter), 2000);
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!userId) { setError('Sign in as a creator to generate videos'); return; }

    setError('');
    setGenerating(true);
    setProgress(0);
    setStatusText('Checking daily limit...');
    setCurrentVideo(null);

    try {
      const count = await api.getDailyGenCount(userId);
      if (count >= DAILY_LIMIT) {
        setError('Generation limit reached. Try again tomorrow!');
        setGenerating(false);
        return;
      }

      setStatusText('Sending to Luma AI...');
      setProgress(10);

      const result = await api.lumaGenerate(prompt.trim(), 'ray-2', '5s', '720p', userId);

      if (result.error) {
        setError(result.error?.message || result.error || 'Generation failed');
        setGenerating(false);
        return;
      }

      const genId = result.id;
      if (!genId) {
        setError('No generation ID returned');
        setGenerating(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const record = await api.saveVideoGen({
        user_id: userId,
        prompt: prompt.trim(),
        luma_gen_id: genId,
        status: 'processing',
        model: 'ray-2',
        duration: '5s',
        resolution: '720p',
        captions_on: captionsOn,
        daily_date: today,
      });

      setPollId(genId);
      setPollRecordId(record.id);
      setStatusText('AI is dreaming your video...');
      setProgress(20);

      let pollCount = 0;
      pollIntervalRef.current = setInterval(async () => {
        pollCount++;
        try {
          const status = await api.lumaPollStatus(genId);
          const state = status.state;

          if (state === 'completed') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;

            const videoUrl = status.assets?.video || status.video?.url || '';
            setCurrentVideo(videoUrl);
            setProgress(100);
            setStatusText('Video ready!');
            setGenerating(false);
            setPollId(null);

            await api.updateVideoGen(record.id, {
              status: 'completed',
              video_url: videoUrl,
              thumbnail_url: status.assets?.thumbnail || '',
            });

            loadHistory();

            if (captionsOn) startCaptionRecognition();
            speakMoral(prompt.trim());
          } else if (state === 'failed') {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            const errMsg = status.failure_reason || 'Generation failed';
            setError(errMsg);
            setGenerating(false);
            setPollId(null);

            await api.updateVideoGen(record.id, {
              status: 'failed',
              error_msg: errMsg,
            });
          } else {
            const p = Math.min(20 + pollCount * 3, 90);
            setProgress(p);
            if (state === 'queued') setStatusText('Queued — waiting for Luma...');
            else if (state === 'dreaming') setStatusText('AI is dreaming your video...');
            else setStatusText(`Processing (${state || 'working'})...`);
          }
        } catch (e: any) {
          if (pollCount > 60) {
            clearInterval(pollIntervalRef.current!);
            pollIntervalRef.current = null;
            setError('Polling timed out');
            setGenerating(false);
          }
        }
      }, 5000);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setGenerating(false);
    }
  }, [prompt, userId, captionsOn]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const playFromHistory = (v: VideoGen) => {
    if (v.video_url) {
      setCurrentVideo(v.video_url);
      setPrompt(v.prompt);
      setShowHistory(false);
      if (captionsOn) startCaptionRecognition();
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await api.updateVideoGen(id, { status: 'deleted' });
      setHistory(h => h.filter(v => v.id !== id));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff1493]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#00ffff]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#9b5de5]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#ff1493]/30">
        <div className="flex items-center gap-2">
          <Wand2 size={20} className="text-[#ff1493] drop-shadow-[0_0_10px_#ff1493]" />
          <h1 className="text-lg font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ff1493] via-[#9b5de5] to-[#00ffff]">
            Video Gen
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-400 hover:text-[#00ffff] transition-colors"
          >
            <Film size={18} />
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {showHistory && history.length > 0 && (
          <div className="space-y-2 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00ffff]">Your Generations</h3>
            {history.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 p-3 bg-white/5 border border-[#ff1493]/20 rounded-xl cursor-pointer hover:bg-white/10 transition-colors group"
                onClick={() => playFromHistory(v)}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff1493]/30 to-[#9b5de5]/30 flex items-center justify-center flex-shrink-0">
                  <Play size={16} className="text-[#ff1493]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{v.prompt}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{v.model} · {v.created ? new Date(v.created).toLocaleDateString() : ''}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFromHistory(v.id); }}
                  className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-[#ff1493]/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-[#ff1493] rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-t-[#00ffff] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-4 border-4 border-transparent border-t-[#9b5de5] rounded-full animate-spin" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-[#ff1493]">{progress}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 text-center animate-pulse">{statusText}</p>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff1493] via-[#9b5de5] to-[#00ffff] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {currentVideo && !generating && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-[#ff1493]/30 shadow-[0_0_30px_rgba(255,20,147,0.2)]">
              <video
                ref={videoRef}
                src={currentVideo}
                className="w-full aspect-video bg-black"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  if (captionRecRef.current) captionRecRef.current.stop();
                  setCaptionText('');
                }}
                playsInline
                autoPlay
                loop
              />

              {captionsOn && captionText && (
                <div className="absolute bottom-12 left-4 right-4 text-center">
                  <span className="bg-black/80 text-white text-sm px-3 py-1.5 rounded-lg inline-block max-w-full">
                    {captionText}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                <button onClick={togglePlay} className="p-2 text-white hover:text-[#ff1493] transition-colors">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCaptionsOn(!captionsOn)}
                    className={`p-2 rounded-lg transition-colors ${captionsOn ? 'text-[#00ffff] bg-[#00ffff]/10' : 'text-gray-500'}`}
                  >
                    <Subtitles size={18} />
                  </button>
                  <button onClick={toggleMute} className="p-2 text-white hover:text-[#ff1493] transition-colors">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-[#9b5de5]/20">
              <p className="text-xs text-gray-400"><span className="text-[#9b5de5] font-bold">Prompt:</span> {prompt}</p>
            </div>
          </div>
        )}

        {!generating && !currentVideo && !showHistory && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff1493]/20 via-[#9b5de5]/20 to-[#00ffff]/20 border border-[#ff1493]/30 flex items-center justify-center">
              <Wand2 size={32} className="text-[#ff1493]" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white text-center">
              AI Video Generator
            </h2>
            <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
              Describe your video idea below. Type or use voice input. Our AI will dream it into reality.
            </p>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {['Pixar 3D kid finds courage in neon forest', 'Cyberpunk cat DJ at midnight rave', 'Underwater city with glowing jellyfish'].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-[10px] px-3 py-1.5 rounded-full border border-[#ff1493]/30 text-gray-400 hover:text-[#ff1493] hover:border-[#ff1493] transition-colors"
                >
                  {s.slice(0, 35)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-black/95 backdrop-blur-md border-t border-[#ff1493]/30">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder="Describe your video dream..."
            rows={2}
            disabled={generating}
            className="w-full bg-black/60 border-2 border-[#ff1493]/50 rounded-xl px-4 py-3 pr-24 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#ff1493] focus:shadow-[0_0_20px_rgba(255,20,147,0.3)] transition-all disabled:opacity-50"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={generating}
              className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-[#ff1493]'} disabled:opacity-30`}
              title="Voice input"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="p-2.5 bg-gradient-to-r from-[#ff1493] to-[#9b5de5] rounded-xl text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,20,147,0.4)]"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
