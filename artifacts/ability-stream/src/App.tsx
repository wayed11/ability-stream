import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Camera, Plus, Wallet, Heart, Play, User, VolumeX, Volume2, Video, Eye, X, ArrowLeft, Maximize2, Ear, Accessibility, Type, Contrast, ZapOff, Star, Tv, Clock, CheckCircle, Upload, Brush, Eraser, Palette, Save, Sparkles, Image as ImageIcon, LogOut, Shield, ExternalLink, DollarSign, Gift, Award, Trophy, Crown, Mail, Radio, Wand2 } from 'lucide-react';
import { api } from './api';
import { getSocket } from './socket';
import AdminPortal, { DEFAULT_CONFIG, type PlatformConfig, type AdSlotConfig } from './AdminPortal';
import AbilityLive from './AbilityLive';
import AbilityVideoGen from './AbilityVideoGen';

const SensorySystem = {
  triggerHaptic(pattern: number | number[]) {
    if (typeof window !== 'undefined' && navigator && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch(e) {}
    }
  },
  playSnap() { this.triggerHaptic(20); },
  playBlip() { this.triggerHaptic(30); },
  playBassDrop() { this.triggerHaptic([50, 50, 100]); },
  playHiss() { this.triggerHaptic(10); },
  readAloud(text: string) {
     if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
        this.triggerHaptic([30, 30]);
     }
  }
};

const OPTIC_FILTERS = [
  { name: 'Normal', class: '' },
  { name: 'Cyber Pink', class: 'filter-cyber' },
  { name: 'Neon Mint', class: 'filter-neon-mint' },
  { name: 'Golden Hour', class: 'filter-golden' },
  { name: 'Vaporwave', class: 'filter-vaporwave' },
  { name: 'Cinematic Noir', class: 'filter-noir' },
  { name: 'Glitch Mode', class: 'filter-glitch' }
];

const MOCK_POSTS = [{ id: 'default1', type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', author: 'Neon_Admin', views: 14500, likes: 3402, filterClass: 'filter-cyber', title: 'Welcome to the Stream' }];
const MOCK_STORIES = [
  { id: 1, user: 'Alex_N', image: 'https://placehold.co/150x150/1a1a1a/FF00FF?text=A', url: 'https://placehold.co/800x1200/1a1a1a/FF00FF?text=Alex+Story', type: 'photo' },
  { id: 2, user: 'Sam_G', image: 'https://placehold.co/150x150/1a1a1a/39FF14?text=S', url: 'https://placehold.co/800x1200/1a1a1a/39FF14?text=Sam+Story', type: 'photo' },
];
const MOCK_REELS = [{ id: 'r1', type: 'video', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', author: 'Alex_Neon', views: 89000, likes: 12000, filterClass: 'filter-neon-mint', title: 'Spray Paint Mural' }];

const MOCK_SHOWS: any[] = [
  { id: 'show_hero', seriesTitle: 'Neon Overdrive', author: 'Cyber_Synth', categories: ['Trending', 'Neon Originals'], avatar: 'https://placehold.co/100x100/1a1a1a/39ff14?text=C', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', filterClass: 'filter-cyber', isVideoThumb: true, views: 1250000, description: "A high-octane journey through the cyberpunk underground. Strap in and feel the neon.", episodes: [{ id: 'e1', title: 'Ep 1: The Spark', duration: '24:15', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }] },
  { id: 'show2', seriesTitle: 'Spray Paint Kings', author: 'Mural_Master', categories: ['Trending'], avatar: 'https://placehold.co/100x100/1a1a1a/ff1493?text=M', thumbnail: 'https://placehold.co/1280x720/1a1a1a/ff1493?text=Spray+Kings', filterClass: 'filter-vaporwave', isVideoThumb: false, views: 89000, episodes: [{ id: 'e1', title: 'Ep 1: Blank Canvas', duration: '32:10', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }] },
  { id: 'show3', seriesTitle: 'Silent Symphony', author: 'Deaf_Creator', categories: ['Trending', 'Audio Described'], avatar: 'https://placehold.co/100x100/1a1a1a/00ffff?text=D', thumbnail: 'https://placehold.co/1280x720/1a1a1a/00ffff?text=Silent+Symphony', filterClass: 'filter-noir', isVideoThumb: false, views: 450000, episodes: [{ id: 'e1', title: 'Ep 1: Visual Sound', duration: '18:45', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' }] },
  { id: 'show4', seriesTitle: 'Wheelchair Wonders', author: 'Roll_Model', categories: ['Neon Originals'], avatar: 'https://placehold.co/100x100/1a1a1a/9b5de5?text=R', thumbnail: 'https://placehold.co/1280x720/1a1a1a/9b5de5?text=Wheelchair+Wonders', filterClass: 'filter-golden', isVideoThumb: false, views: 210000, episodes: [{ id: 'e1', title: 'Ep 1: The Ramp', duration: '40:00', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }] },
  { id: 'show5', seriesTitle: 'Blind Gaming', author: 'Audio_Ninja', categories: ['Audio Described'], avatar: 'https://placehold.co/100x100/1a1a1a/ff1493?text=A', thumbnail: 'https://placehold.co/1280x720/1a1a1a/39ff14?text=Blind+Gaming', filterClass: 'filter-glitch', isVideoThumb: false, views: 67000, episodes: [{ id: 'e1', title: 'Ep 1: Soundscapes', duration: '15:20', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }] }
];

const AdSlot = ({ slot, className = '' }: { slot: AdSlotConfig; className?: string }) => {
  if (!slot.enabled) return null;

  if (slot.adNetwork === 'direct' && slot.sponsorImageUrl) {
    return (
      <div className={`relative ${className}`}>
        <a href={slot.sponsorClickUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative overflow-hidden rounded-xl border border-[#ff1493]/30 bg-black">
            <img src={slot.sponsorImageUrl} alt={slot.sponsorName || 'Sponsor'} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full">
              <span className="text-[8px] font-bold text-gray-400 uppercase">Sponsored</span>
              <ExternalLink size={8} className="text-gray-400" />
            </div>
            {slot.sponsorName && (
              <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-full">
                <span className="text-[10px] font-bold text-[#ff1493]">{slot.sponsorName}</span>
              </div>
            )}
          </div>
        </a>
      </div>
    );
  }

  const networkBorder: any = { adsense: '#4285F4', admob: '#FFCA28', ad_manager: '#34A853' };
  const borderColor = networkBorder[slot.adNetwork] || '#333';

  if (slot.type === 'banner') {
    return (
      <div className={`${className}`}>
        <div className="w-full h-[60px] rounded-xl border border-dashed flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ borderColor: borderColor + '40' }}>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: borderColor }}>
              {slot.adUnitId ? 'Ad Loading...' : `${slot.adNetwork.toUpperCase()} Banner`}
            </p>
            <p className="text-[8px] text-gray-600">ID: {slot.adUnitId || 'Not configured'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (slot.type === 'native') {
    return (
      <div className={`h-screen w-full snap-start relative flex items-center justify-center overflow-hidden bg-black ${className}`}>
        <div className="w-[85%] max-w-[400px] aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-gradient-to-b from-gray-900/50 to-black/50 backdrop-blur-sm" style={{ borderColor: borderColor + '30' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-4 border border-white/10">
            <Tv size={28} style={{ color: borderColor }} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: borderColor }}>
            {slot.adUnitId ? 'Ad Loading...' : 'Native Ad Slot'}
          </p>
          <p className="text-[10px] text-gray-600 font-bold">{slot.name}</p>
          <p className="text-[9px] text-gray-700 mt-1">ID: {slot.adUnitId || 'Configure in Admin'}</p>
          <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 rounded-full">
            <span className="text-[8px] font-bold text-gray-500 uppercase">Ad</span>
          </div>
        </div>
      </div>
    );
  }

  if (slot.type === 'video-preroll') {
    return (
      <div className={`w-full rounded-xl border border-dashed p-4 flex items-center gap-3 bg-black/50 ${className}`} style={{ borderColor: borderColor + '30' }}>
        <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 border border-white/10">
          <Play size={20} style={{ color: borderColor }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase" style={{ color: borderColor }}>
            {slot.adUnitId ? 'Pre-Roll Loading...' : 'Pre-Roll Ad Slot'}
          </p>
          <p className="text-[10px] text-gray-600">Plays before show episodes</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[250px] rounded-xl border border-dashed flex items-center justify-center bg-black/30 ${className}`} style={{ borderColor: borderColor + '30' }}>
      <p className="text-xs font-bold text-gray-600">{slot.name} ({slot.type})</p>
    </div>
  );
};

const SVGSprayTexture = () => (
  <svg style={{ width: 0, height: 0, position: 'absolute' }}>
    <filter id="spray-paint-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" />
      <feBlend mode="multiply" in2="SourceGraphic" />
    </filter>
  </svg>
);

const Ticker = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0; const end = Math.floor(value);
    if (start === end) return;
    const timer = setInterval(() => { start += Math.ceil(end / 15); if (start >= end) { start = end; clearInterval(timer); } setCount(start); }, duration / 15);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{count.toLocaleString()}</>;
};

const NeonDust = () => {
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    bottom: `${Math.random() * 20}%`,
    animationDuration: `${4 + Math.random() * 5}s`,
    animationDelay: `${Math.random() * 3}s`,
    size: `${2 + Math.random() * 5}px`,
    color: ['#ff1493', '#39ff14', '#00ffff', '#9b5de5'][Math.floor(Math.random() * 4)]
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full animate-float-dust"
             style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, backgroundColor: p.color, animationDuration: p.animationDuration, animationDelay: p.animationDelay, boxShadow: `0 0 10px ${p.color}` }}
        />
      ))}
    </div>
  );
};

const CardBurst = ({ onComplete }: { onComplete: () => void }) => {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    const p = Array.from({length: 16}).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 60 + Math.random() * 60;
      return {
        id: i,
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist}px`,
        color: ['#ff1493', '#39ff14', '#00ffff', '#9b5de5'][Math.floor(Math.random()*4)]
      }
    });
    setParticles(p);
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-50">
      {particles.map(p => (
        <div key={p.id} className="absolute w-3 h-3 rounded-full -ml-1.5 -mt-1.5"
             style={{
               backgroundColor: p.color,
               boxShadow: `0 0 10px ${p.color}`,
               '--tx': p.tx,
               '--ty': p.ty,
               animation: 'burstParticle 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
             } as any}
        />
      ))}
    </div>
  );
};

const TIP_AMOUNTS = [1, 3, 5, 10];

const TipModal = ({ creatorName, creatorUid, currentUserId, onClose, onTipSent }: { creatorName: string; creatorUid?: string; currentUserId?: string; onClose: () => void; onTipSent: (amount: number) => void }) => {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleSendTip = async (amount: number) => {
    setSelectedAmount(amount);
    setSending(true);
    SensorySystem.playSnap();
    try {
      if (creatorUid && !creatorUid.startsWith('guest_')) {
        await api.sendTip({
          creator_id: creatorUid,
          supporter_id: currentUserId && !currentUserId.startsWith('guest_') ? currentUserId : null,
          amount
        });
      }
    } catch (e) { console.error('Tip error:', e); }
    setSending(false);
    setSuccess(true);
    SensorySystem.playBassDrop();
    SensorySystem.triggerHaptic([50, 30, 50, 30, 100]);
    onTipSent(amount);
    setTimeout(() => { onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-950 border-t-2 border-[#39ff14] rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#39ff14]/20 border-2 border-[#39ff14] flex items-center justify-center mb-4 shadow-[0_0_30px_#39ff14]">
              <CheckCircle size={40} className="text-[#39ff14]" />
            </div>
            <h3 className="text-2xl font-black text-[#39ff14] mb-1">Tip Sent!</h3>
            <p className="text-gray-400 text-sm">${selectedAmount} sent to @{creatorName}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff1493] to-[#9b5de5] flex items-center justify-center">
                  <Gift size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Send Tip</h3>
                  <p className="text-xs text-gray-500">to @{creatorName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {TIP_AMOUNTS.map(amt => (
                <button key={amt} onClick={() => handleSendTip(amt)} disabled={sending}
                  className="relative bg-black border-2 border-white/10 rounded-2xl py-4 flex flex-col items-center gap-1 hover:border-[#39ff14] hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] active:scale-95 transition-all disabled:opacity-50">
                  <span className="text-2xl font-black text-[#39ff14]">${amt}</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Tip</span>
                </button>
              ))}
            </div>
            {sending && (
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-5 h-5 border-t-2 border-[#39ff14] rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400 font-bold">Sending tip...</span>
              </div>
            )}
            <p className="text-[10px] text-gray-600 text-center mt-2">70% goes to the creator, 30% platform fee</p>
          </>
        )}
      </div>
    </div>
  );
};

const MILESTONES = [
  { views: 100, label: 'Starter', icon: Award, color: '#00ffff' },
  { views: 5000, label: 'Rising Star', icon: Trophy, color: '#39ff14' },
  { views: 50000, label: 'Legend', icon: Crown, color: '#9b5de5' },
];

const MilestoneBadges = ({ totalViews }: { totalViews: number }) => {
  return (
    <div className="bg-gradient-to-br from-[#9b5de5]/5 to-[#ff1493]/5 border border-[#9b5de5]/20 rounded-2xl p-4 mb-5">
      <h3 className="text-xs font-black uppercase text-[#9b5de5] mb-3 tracking-widest flex items-center gap-2">
        <Trophy size={14} /> Milestones
      </h3>
      <div className="flex gap-3">
        {MILESTONES.map(m => {
          const unlocked = totalViews >= m.views;
          const Icon = m.icon;
          return (
            <div key={m.views} className={`flex-1 rounded-xl p-3 border text-center transition-all ${unlocked ? 'bg-black/40 shadow-[0_0_10px_' + m.color + '30]' : 'bg-black/20 opacity-50'}`} style={{ borderColor: unlocked ? m.color : 'rgba(255,255,255,0.1)' }}>
              <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: unlocked ? m.color + '20' : '#1f2937', boxShadow: unlocked ? `0 0 12px ${m.color}` : 'none' }}>
                <Icon size={18} style={{ color: unlocked ? m.color : '#6b7280' }} />
              </div>
              <p className="text-[9px] font-black uppercase" style={{ color: unlocked ? m.color : '#6b7280' }}>{m.label}</p>
              <p className="text-[8px] text-gray-600 mt-0.5">{m.views >= 1000 ? (m.views/1000) + 'K' : m.views} views</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RoleSelectScreen = ({ pendingUser, onSelectRole }: { pendingUser: any; onSelectRole: (role: 'creator' | 'guest') => void }) => {
  return null;
};

const AuthScreen = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true);
    setError('');
    try {
      const result = isSignUp
        ? await api.signup(email, password, 'creator')
        : await api.login(email, password);
      const dbUser = result.user;
      if (dbUser) {
        const displayName = dbUser.display_name || dbUser.email?.split('@')[0] || 'NeonUser';
        onLogin({
          uid: dbUser.id,
          username: displayName.replace(/\s+/g, '_'),
          email: dbUser.email,
          photoURL: null,
          role: dbUser.role || 'creator',
          views: dbUser.total_views || 0,
          likes: dbUser.total_likes || 0,
          earnings: dbUser.total_earnings || 0,
          walletBal: parseFloat(dbUser.wallet_balance) || 0
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleGuestLogin = () => {
    if (username.length > 2) {
      onLogin({ uid: 'guest_' + Date.now(), username: username.replace('@', ''), role: 'guest', views: 0, likes: 0, earnings: 0, walletBal: 0 });
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white relative overflow-hidden">
      <img src="/logo-mural.jpeg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
      <img src="/logo-main.jpeg" alt="Ability Stream" className="w-56 h-auto rounded-2xl shadow-[0_0_40px_rgba(57,255,20,0.4)] mb-8 z-10" />
      <div className="z-10 flex flex-col items-center p-6 bg-black/60 rounded-2xl backdrop-blur-md border border-[#39ff14] w-80">
        <h3 className="text-sm font-black uppercase text-[#39ff14] mb-4 tracking-widest">{isSignUp ? 'Create Account' : 'Creator Sign In'}</h3>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="px-4 py-3 rounded-xl bg-black/80 text-white font-mono border-2 border-[#39ff14]/50 focus:outline-none focus:border-[#39ff14] mb-3 text-center w-full text-sm" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="px-4 py-3 rounded-xl bg-black/80 text-white font-mono border-2 border-[#39ff14]/50 focus:outline-none focus:border-[#39ff14] mb-3 text-center w-full text-sm" />
        <button onClick={handleEmailAuth} disabled={loading}
          className="w-full bg-gradient-to-r from-[#39ff14] to-[#00ffff] text-black font-black px-8 py-3 rounded-full hover:scale-105 transition-transform mb-2 disabled:opacity-50">
          {loading ? 'Please wait...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
        </button>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-[11px] text-[#39ff14] font-bold mb-3 hover:underline">
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
        {error && <p className="text-red-300 text-xs mb-3 text-center">{error}</p>}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px bg-white/30"></div>
          <span className="text-xs text-gray-300 font-bold uppercase">or join as supporter</span>
          <div className="flex-1 h-px bg-white/30"></div>
        </div>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@your_name" className="px-4 py-3 rounded-xl bg-black/80 text-[#39ff14] font-mono border-2 border-[#ff1493] focus:outline-none mb-4 text-center w-full" />
        <button onClick={handleGuestLogin} className="bg-gradient-to-r from-[#ff1493] to-[#9b5de5] text-white font-black px-8 py-3 rounded-full hover:scale-105 transition-transform w-full">SUPPORT A CREATOR</button>
        <p className="text-[10px] text-gray-500 text-center mt-3 leading-relaxed">Guests can watch, like, and tip creators. Sign in with email to upload content as a disabled creator.</p>
      </div>
    </div>
  );
};

const WalletScreen = ({ user, setUser, onBack, platformConfig, adSlots = [] }: any) => {
  const mon = platformConfig?.monetization || DEFAULT_CONFIG.monetization;
  const tier1 = mon.payoutTier1 || 10;
  const tier2 = mon.payoutTier2 || 50;
  const tier3 = mon.payoutTier3 || 100;
  const adBoostRate = mon.adBoostRate || 0.10;
  const creatorSplit = mon.creatorSplit || 70;
  const platformSplit = mon.platformSplit || 30;
  const walletAdSlots = adSlots.filter((s: AdSlotConfig) => s.placement === 'wallet' && s.enabled);

  const tier1Progress = Math.min((user.walletBal / tier1) * 100, 100);
  const tier2Progress = Math.min((user.walletBal / tier2) * 100, 100);
  const tier3Progress = Math.min((user.walletBal / tier3) * 100, 100);
  const currentTier = user.walletBal >= tier3 ? 3 : user.walletBal >= tier2 ? 2 : user.walletBal >= tier1 ? 1 : 0;

  const viewRate = mon.perViewRate || 0.001;
  const likeRate = mon.perLikeRate || 0.05;
  const storyRate = mon.perStoryViewRate || 0.07;
  const showRate = mon.perShowViewRate || 0.15;

  const remaining1 = Math.max(tier1 - user.walletBal, 0);
  const remaining2 = Math.max(tier2 - user.walletBal, 0);
  const remaining3 = Math.max(tier3 - user.walletBal, 0);
  const viewsToTier1 = viewRate > 0 ? Math.ceil(remaining1 / viewRate) : 0;
  const viewsToTier2 = viewRate > 0 ? Math.ceil(remaining2 / viewRate) : 0;
  const viewsToTier3 = viewRate > 0 ? Math.ceil(remaining3 / viewRate) : 0;

  const [payoutMethod, setPayoutMethod] = useState<string | null>(null);
  const [payoutEmail, setPayoutEmail] = useState('');
  const [payoutVenmo, setPayoutVenmo] = useState('');

  return (
    <div className="h-full w-full bg-black pt-16 px-6 text-white relative animate-slide-down overflow-y-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-black/60 border-2 border-[#39ff14] text-[#39ff14] rounded-full shadow-[0_0_15px_#39ff14] hover:bg-[#39ff14] hover:text-black transition-all"><ArrowLeft size={32} /></button>
        <h1 className="text-4xl font-black italic mb-0 glow-text">WALLET</h1>
      </div>

      <div className="bg-gradient-to-br from-[#9b5de5]/20 to-[#ff1493]/20 border-2 border-[#ff1493] rounded-3xl p-6 mb-6 relative overflow-hidden shadow-[0_0_20px_#ff1493]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Balance</p>
        <h2 className="text-5xl font-black text-[#39ff14] drop-shadow-[0_0_15px_#39ff14]">${user.walletBal.toFixed(3)}</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400">Revenue Split:</span>
          <span className="text-[10px] font-black text-[#39ff14]">{creatorSplit}% You</span>
          <span className="text-[10px] text-gray-600">/</span>
          <span className="text-[10px] font-black text-[#ff1493]">{platformSplit}% Platform</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <Eye size={10} className="text-gray-500" />
          <span className="text-[10px] text-gray-500">{user.views.toLocaleString()} total views</span>
          <span className="text-[10px] text-gray-600 mx-1">|</span>
          <Heart size={10} className="text-gray-500" />
          <span className="text-[10px] text-gray-500">{user.likes.toLocaleString()} likes</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { tier: 1, amount: tier1, color: '#00ffff', label: 'Starter', progress: tier1Progress, viewsLeft: viewsToTier1 },
          { tier: 2, amount: tier2, color: '#39ff14', label: 'Standard', progress: tier2Progress, viewsLeft: viewsToTier2 },
          { tier: 3, amount: tier3, color: '#9b5de5', label: 'Priority', progress: tier3Progress, viewsLeft: viewsToTier3 },
        ].map(t => {
          const unlocked = currentTier >= t.tier;
          return (
            <div key={t.tier} className={`flex-1 rounded-2xl p-3 border-2 relative overflow-hidden ${unlocked ? `bg-opacity-5 shadow-[0_0_15px_${t.color}30]` : 'bg-white/5'}`} style={{ borderColor: unlocked ? t.color : 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs`} style={{ backgroundColor: unlocked ? t.color : '#1f2937', color: unlocked ? (t.tier === 3 ? '#fff' : '#000') : '#6b7280', boxShadow: unlocked ? `0 0 12px ${t.color}` : 'none' }}>
                  {unlocked ? <CheckCircle size={16} /> : <Star size={16} />}
                </div>
                <div>
                  <p className="text-base font-black leading-none" style={{ color: unlocked ? t.color : '#fff' }}>${t.amount}</p>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-gray-500">Tier {t.tier}</p>
                </div>
              </div>
              <p className="text-[9px] font-bold mb-1.5" style={{ color: unlocked ? t.color : '#9ca3af' }}>
                {unlocked ? 'UNLOCKED' : t.label}
              </p>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden" style={{ borderColor: `${t.color}20` }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${t.progress}%`, backgroundColor: t.color, boxShadow: `0 0 6px ${t.color}` }}></div>
              </div>
              {!unlocked && (
                <p className="text-[8px] text-gray-500 mt-1">
                  <span className="font-bold" style={{ color: t.color }}>{t.viewsLeft.toLocaleString()}</span> views
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-[#00ffff]/5 to-[#39ff14]/5 border border-[#00ffff]/20 rounded-2xl p-4 mb-5">
        <h3 className="text-xs font-black uppercase text-[#00ffff] mb-3 tracking-widest flex items-center gap-2">
          <DollarSign size={14} /> How You Earn
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ff1493]/10 border border-[#ff1493]/20 flex items-center justify-center"><Play size={14} className="text-[#ff1493]" /></div>
              <div>
                <p className="text-xs font-bold text-white">Post / Reel View</p>
                <p className="text-[9px] text-gray-500">Each time someone watches your content</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#39ff14]">{(viewRate * 100).toFixed(1)}&cent;</p>
              <p className="text-[8px] text-gray-600">per view</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ff1493]/10 border border-[#ff1493]/20 flex items-center justify-center"><Heart size={14} className="text-[#ff1493]" /></div>
              <div>
                <p className="text-xs font-bold text-white">Like Received</p>
                <p className="text-[9px] text-gray-500">When someone likes your post or reel</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#39ff14]">{(likeRate * 100).toFixed(1)}&cent;</p>
              <p className="text-[8px] text-gray-600">per like</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00ffff]/10 border border-[#00ffff]/20 flex items-center justify-center"><Eye size={14} className="text-[#00ffff]" /></div>
              <div>
                <p className="text-xs font-bold text-white">Story View</p>
                <p className="text-[9px] text-gray-500">Each time someone views your story</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#39ff14]">{(storyRate * 100).toFixed(1)}&cent;</p>
              <p className="text-[8px] text-gray-600">per view</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#9b5de5]/10 border border-[#9b5de5]/20 flex items-center justify-center"><Tv size={14} className="text-[#9b5de5]" /></div>
              <div>
                <p className="text-xs font-bold text-white">Show Episode View</p>
                <p className="text-[9px] text-gray-500">When someone watches your show episode</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#39ff14]">{(showRate * 100).toFixed(1)}&cent;</p>
              <p className="text-[8px] text-gray-600">per view</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center"><Sparkles size={14} className="text-[#39ff14]" /></div>
              <div>
                <p className="text-xs font-bold text-white">Ad Boost</p>
                <p className="text-[9px] text-gray-500">Watch an ad to earn a bonus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#39ff14]">{(adBoostRate * 100).toFixed(0)}&cent;</p>
              <p className="text-[8px] text-gray-600">per boost</p>
            </div>
          </div>
        </div>
      </div>

      <MilestoneBadges totalViews={user.views} />

      <div className="bg-gradient-to-br from-[#ff1493]/5 to-[#9b5de5]/5 border border-[#ff1493]/20 rounded-2xl p-4 mb-5">
        <h3 className="text-xs font-black uppercase text-[#ff1493] mb-3 tracking-widest flex items-center gap-2">
          <Mail size={14} /> Payout Method
        </h3>
        <div className="flex gap-3 mb-3">
          <button onClick={() => setPayoutMethod('paypal')} className={`flex-1 rounded-xl py-3 border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${payoutMethod === 'paypal' ? 'border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba] shadow-[0_0_10px_rgba(0,112,186,0.3)]' : 'border-white/10 text-gray-500'}`}>
            <DollarSign size={16} /> PayPal
          </button>
          <button onClick={() => setPayoutMethod('venmo')} className={`flex-1 rounded-xl py-3 border-2 font-black text-sm flex items-center justify-center gap-2 transition-all ${payoutMethod === 'venmo' ? 'border-[#3d95ce] bg-[#3d95ce]/10 text-[#3d95ce] shadow-[0_0_10px_rgba(61,149,206,0.3)]' : 'border-white/10 text-gray-500'}`}>
            <DollarSign size={16} /> Venmo
          </button>
        </div>
        {payoutMethod === 'paypal' && (
          <input type="email" value={payoutEmail} onChange={e => setPayoutEmail(e.target.value)} placeholder="your@email.com"
            className="w-full bg-black/50 border border-[#0070ba]/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0070ba] transition-colors" />
        )}
        {payoutMethod === 'venmo' && (
          <input type="text" value={payoutVenmo} onChange={e => setPayoutVenmo(e.target.value)} placeholder="@venmo-username"
            className="w-full bg-black/50 border border-[#3d95ce]/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#3d95ce] transition-colors" />
        )}
        {payoutMethod && (
          <button onClick={() => { SensorySystem.playSnap(); }} className="mt-3 w-full bg-white/10 border border-white/20 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-white/20 transition-all">
            Save Payout Method
          </button>
        )}
      </div>

      <button onClick={() => { SensorySystem.playBlip(); setTimeout(() => { setUser((p: any) => ({ ...p, walletBal: p.walletBal + adBoostRate, earnings: p.earnings + adBoostRate })); SensorySystem.playBassDrop(); }, 1000); }} className="w-full bg-gradient-to-r from-[#9b5de5] to-[#ff1493] text-white font-black py-4 rounded-xl text-lg shadow-[0_0_20px_#9b5de5] flex items-center justify-center gap-3 mb-4 active:scale-95 transition-transform">
        <Play size={24} className="fill-white" /> Watch Ad Boost (+{(adBoostRate * 100).toFixed(0)}&cent;)
      </button>

      {currentTier >= 1 && payoutMethod && (
        <button onClick={() => { SensorySystem.playBassDrop(); }} className="w-full bg-gradient-to-r from-[#39ff14] to-[#00ffff] text-black font-black py-4 rounded-xl text-lg shadow-[0_0_20px_#39ff14] flex items-center justify-center gap-3 mb-4 active:scale-95 transition-transform">
          <Wallet size={24} /> Request Payout (${user.walletBal.toFixed(2)})
        </button>
      )}

      {walletAdSlots.map((slot: AdSlotConfig) => (
        <AdSlot key={slot.id} slot={slot} className="mb-4" />
      ))}
    </div>
  );
};

const UploadScreen = ({ onPost, user, uploadDest, setUploadDest, onBack }: any) => {
  const [file, setFile] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('Normal');

  if (uploading) return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 text-center z-[200]"><h1 className="text-4xl font-black italic text-[#ff1493] glow-text mb-4 uppercase">Painting...</h1><div className="w-16 h-16 border-t-4 border-[#39ff14] rounded-full animate-spin"></div></div>
  );

  return (
    <div className="h-full w-full bg-black pt-16 px-6 text-white overflow-y-auto pb-24 animate-slide-down">
       <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 bg-black/60 border-2 border-[#9b5de5] text-[#9b5de5] rounded-full shadow-[0_0_15px_#9b5de5]"><ArrowLeft size={32} /></button>
         <h1 className="text-4xl font-black italic glow-text mb-0">DROP</h1>
       </div>
       <div className="flex gap-2 mb-6 bg-gray-900 p-1.5 rounded-xl border border-white/10">
          {['stream', 'reel', 'story'].map(d => (
            <button key={d} onClick={() => { setUploadDest(d); SensorySystem.playSnap(); }} className={`flex-1 py-2 rounded-lg font-black text-xs uppercase tracking-widest ${uploadDest === d ? 'bg-[#ff1493] text-white shadow-[0_0_10px_#ff1493]' : 'text-gray-500'}`}>{d}</button>
          ))}
       </div>
       {!file ? (
         <label className="w-full h-64 border-4 border-dashed border-[#ff1493] rounded-3xl flex flex-col items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(255,20,147,0.3)] bg-gray-900/50 hover:bg-gray-800 transition-colors">
           <Camera size={64} className="text-[#ff1493] mb-4" />
           <span className="font-bold text-lg">Tap to Open Camera Roll</span>
           <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
             const selected = e.target.files?.[0];
             if (selected) {
                const isVid = selected.type.includes('video') || !!selected.name.match(/\.(mp4|mov|webm|avi|mkv|m4v)$/i);
                setFileType(isVid ? 'video' : 'photo');
                setFile(URL.createObjectURL(selected));
                setRawFile(selected);
             }
           }} />
         </label>
       ) : (
         <div className="flex flex-col gap-6">
           <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#39ff14] shadow-[0_0_15px_#39ff14] bg-black">
              {fileType === 'video' ?
                 <video key={file} src={file} className={`w-full h-full object-contain bg-black ultra-cinematic ${OPTIC_FILTERS.find(f=>f.name===filter)?.class || ''}`} autoPlay loop muted playsInline /> :
                 <img key={file} src={file} className={`w-full h-full object-contain bg-black ultra-cinematic ${OPTIC_FILTERS.find(f=>f.name===filter)?.class || ''}`} alt="upload" />
              }
           </div>
           <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Cinematic Filters</h3>
             <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
               {OPTIC_FILTERS.map(f => (
                 <button key={f.name} onClick={() => { setFilter(f.name); SensorySystem.playSnap(); }} className={`min-w-max px-4 py-2 text-sm rounded-full font-bold transition-all border ${filter === f.name ? 'bg-[#39ff14] text-black border-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-transparent text-white border-white/30 hover:border-white/80'}`}>{f.name}</button>
               ))}
             </div>
           </div>
           <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={`Caption your ${uploadDest}...`} className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-[#ff1493] transition-all resize-none font-bold" rows={2} />
           <button onClick={() => {
               setUploading(true); SensorySystem.playSnap();
               setTimeout(() => onPost({ id: Date.now(), type: fileType, url: file, _file: rawFile, author: user.username, title: caption, views: 0, likes: 0, filterClass: OPTIC_FILTERS.find(f=>f.name===filter)?.class || '', destination: uploadDest }), 300);
             }} className="w-full bg-gradient-to-r from-[#ff1493] to-[#9b5de5] font-black text-xl py-4 rounded-full shadow-[0_0_20px_#ff1493] active:scale-95 transition-transform">
             PAINT IT VIRAL
           </button>
         </div>
       )}
    </div>
  );
};

const Post = ({ post, index, isActive, setUser, isFirstInFeed, stories, onAddStory, onOpenStory, likeRate = 0.05, viewRate = 0.001, onTip, currentUserId }: any) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [glowPulse, setGlowPulse] = useState(false);
  const hasCountedView = useRef(false);

  const videoRefCenter = useRef<HTMLVideoElement>(null);
  const videoRefBg = useRef<HTMLVideoElement>(null);
  const isLocalBlobVideo = post.type === 'video' && post.url.startsWith('blob:');

  useEffect(() => {
    if (isActive && !hasCountedView.current && post.id && !String(post.id).startsWith('default')) {
      hasCountedView.current = true;
      api.viewPost(post.id).catch(() => {});
      setUser((prev: any) => ({ ...prev, views: prev.views + 1, earnings: prev.earnings + viewRate, walletBal: prev.walletBal + viewRate }));
    }
  }, [isActive, viewRate, setUser, post.id]);

  useEffect(() => {
    if (isActive && post.type === 'video') {
      if (videoRefCenter.current) { videoRefCenter.current.muted = isMuted; videoRefCenter.current.play().catch(() => {}); }
      if (!isLocalBlobVideo && videoRefBg.current) {
         videoRefBg.current.muted = true;
         videoRefBg.current.play().catch(() => {});
      }
    } else if (!isActive && post.type === 'video') {
      videoRefCenter.current?.pause();
      if (!isLocalBlobVideo && videoRefBg.current) { videoRefBg.current.pause(); }
    }
  }, [isActive, post.type, isLocalBlobVideo, isMuted]);

  const handleTap = () => {
    setIsPulsing(true); setTimeout(() => setIsPulsing(false), 600);
    if (post.type === 'video') {
      const nextMuted = !isMuted; setIsMuted(nextMuted);
      if (videoRefCenter.current) { videoRefCenter.current.muted = nextMuted; }
    }
  };

  const toggleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setGlowPulse(true);
      setTimeout(() => setGlowPulse(false), 800);
      SensorySystem.playBassDrop();
      if (currentUserId && post.id && !String(post.id).startsWith('default')) {
        api.likePost(post.id, currentUserId).catch(() => {});
      }
      setUser((prev: any) => ({ ...prev, likes: prev.likes + 1, earnings: prev.earnings + likeRate, walletBal: prev.walletBal + likeRate }));
    } else {
      setLiked(false);
      SensorySystem.playBlip();
      setUser((prev: any) => ({ ...prev, likes: prev.likes - 1, earnings: prev.earnings - likeRate, walletBal: prev.walletBal - likeRate }));
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!liked) toggleLike();
    setShowHeart(true); setTimeout(() => setShowHeart(false), 1500);
  };

  const isSplatter = index % 5 === 4;

  const renderMediaCenter = () => {
    const finalClass = `w-full h-full object-contain bg-black ultra-cinematic ${post.filterClass || ''}`;
    if (post.type === 'video') {
      return <video ref={videoRefCenter} src={post.url} className={finalClass} loop playsInline muted />;
    }
    return <img src={post.url} alt="post" className={finalClass} />;
  };

  const renderAmbilightBackground = () => {
    const bgClass = `ambient-backdrop ultra-cinematic ${post.filterClass || ''}`;
    if (post.type === 'video' && !isLocalBlobVideo) {
      return <video ref={videoRefBg} src={post.url} className={bgClass} loop playsInline muted />;
    }
    return <img src={post.url} alt="" className={bgClass} />;
  };

  return (
    <div className={`h-screen w-full snap-start relative flex items-center justify-center overflow-hidden bg-black ${glowPulse ? 'glow-pulse-like' : ''}`} onDoubleClick={handleDoubleTap}>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center bg-black">
         {renderAmbilightBackground()}
         <div className="absolute inset-0 bg-black/30 mix-blend-overlay"></div>
      </div>

      {isFirstInFeed && (
        <div className="absolute top-20 left-0 w-full z-50 px-4 pt-2 pb-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <h3 className="text-[#ff1493] text-xs font-black italic mb-2 drop-shadow-[0_0_5px_#ff1493] uppercase tracking-widest">Ability Stories</h3>
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2">
            {onAddStory && (
              <button className="flex-shrink-0 flex flex-col items-center space-y-1" onClick={() => { SensorySystem.playSnap(); onAddStory(); }}>
                <div className="w-16 h-16 rounded-full bg-black border-2 border-dashed border-[#39ff14] flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-transform cursor-pointer">
                  <Plus className="w-6 h-6 text-[#39ff14]" />
                </div>
              </button>
            )}
            {stories.map((story: any, idx: number) => (
              <button key={story.id} onClick={() => onOpenStory(idx)} className="flex-shrink-0 flex flex-col items-center space-y-1 group outline-none">
                <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#39ff14] to-[#ff1493] shadow-[0_0_15px_rgba(255,20,147,0.5)] group-hover:scale-105 transition-transform cursor-pointer">
                  <img src={story.image} alt="" className="w-full h-full rounded-full border-2 border-black object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isSplatter && isActive && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 drip-animation">
          <div className="w-4 h-full bg-[#ff1493] absolute left-[10%] drop-shadow-[0_0_10px_#ff1493]"></div>
          <div className="w-2 h-full bg-[#39ff14] absolute left-[25%] drop-shadow-[0_0_10px_#39ff14]"></div>
          <div className="w-8 h-full bg-[#9b5de5] absolute left-[70%] drop-shadow-[0_0_10px_#9b5de5]"></div>
          <div className="w-3 h-full bg-[#00ffff] absolute left-[85%] drop-shadow-[0_0_10px_#00ffff]"></div>
        </div>
      )}

      <div className={`post-center ${isActive ? 'spray-border-active' : ''} ${isPulsing ? 'rainbow-pulse-active' : ''}`} onClick={handleTap}>
        {renderMediaCenter()}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="pointer-events-none">
            {post.title && <p className="text-white font-bold mb-1 max-w-[200px] truncate">{post.title}</p>}
            <h3 className="font-bold text-lg drop-shadow-md text-[#39ff14]">@{post.author}</h3>
            <p className="text-xs font-semibold text-gray-300 drop-shadow-md">{(post.views).toLocaleString()} views</p>
          </div>
          <div className="flex gap-3">
            <button onClick={toggleLike} className="flex flex-col items-center z-50 pointer-events-auto">
              <Heart size={28} className={`transition-all ${liked ? 'text-[#ff1493] fill-[#ff1493] drop-shadow-[0_0_15px_#ff1493]' : 'text-white drop-shadow-md'}`} />
              <span className="text-xs font-bold mt-1">{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (onTip) onTip(post.author, post.uid); }} className="flex flex-col items-center z-50 pointer-events-auto text-[#39ff14] drop-shadow-md">
              <Gift size={24} />
              <span className="text-[9px] font-bold mt-1">Tip</span>
            </button>
            {post.type === 'video' && (
               <button className="flex flex-col items-center text-white drop-shadow-md mt-1">
                 {isMuted ? <VolumeX size={26} /> : <Volume2 size={26} />}
               </button>
            )}
          </div>
        </div>
      </div>

      {showHeart && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <Heart size={200} className="text-[#ff1493] fill-[#ff1493] drop-shadow-[0_0_50px_#ff1493] animate-ping" />
        </div>
      )}
    </div>
  );
};

const Feed = ({ posts, user, setUser, isReelsTab, stories, onAddStory, onOpenStory, onOpenProfileCard, onBack, adSlots = [], platformConfig, onTip }: any) => {
  const isCreatorUser = user?.role === 'creator';
  const [activeIndex, setActiveIndex] = useState(0);
  const viewRate = platformConfig?.monetization?.perViewRate || 0.001;
  const likeRate = platformConfig?.monetization?.perLikeRate || 0.05;

  const feedAdSlots = useMemo(() => {
    const placement = isReelsTab ? 'reels' : 'feed';
    return adSlots.filter((s: AdSlotConfig) => s.placement === placement && s.enabled);
  }, [adSlots, isReelsTab]);

  const feedItems = useMemo(() => {
    const items: any[] = [];
    let adIdx = 0;
    posts.forEach((post: any, i: number) => {
      items.push({ type: 'post', data: post, postIndex: i });
      if ((i + 1) % 3 === 0 && feedAdSlots.length > 0) {
        items.push({ type: 'ad', data: feedAdSlots[adIdx % feedAdSlots.length] });
        adIdx++;
      }
    });
    return items;
  }, [posts, feedAdSlots]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newIndex = Math.round((e.target as HTMLDivElement).scrollTop / window.innerHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex); SensorySystem.playSnap();
    }
  };

  return (
    <div className="h-full w-full relative bg-black">
      <div className="absolute top-4 left-4 right-4 z-[60] flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBack && <button onClick={onBack} className="p-1.5 bg-black/60 border border-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all"><ArrowLeft size={18} /></button>}
          <div onClick={onOpenProfileCard} className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#ff1493] shadow-[0_0_10px_rgba(255,20,147,0.5)] cursor-pointer hover:scale-105 transition-transform">
            <User size={14} className="text-[#ff1493]" /><span className="text-white font-bold text-xs glow-text">@{user.username}</span>
          </div>
        </div>
        {isCreatorUser ? (
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 pointer-events-auto shadow-[0_0_10px_rgba(57,255,20,0.4)]">
            <Wallet size={16} className="text-[#39ff14]" /><span className="font-bold text-[#39ff14] text-sm">${user.walletBal.toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#ff1493]/30 pointer-events-auto">
            <Eye size={16} className="text-[#ff1493]" /><span className="font-bold text-[#ff1493] text-[10px] uppercase tracking-wider">Viewer</span>
          </div>
        )}
      </div>

      <div onScroll={handleScroll} className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative">
        {feedItems.map((item: any, i: number) => {
          if (item.type === 'ad') return <AdSlot key={'ad_' + i} slot={item.data} />;
          return <Post key={item.data.id} post={item.data} index={item.postIndex} isActive={i === activeIndex} setUser={setUser} isFirstInFeed={item.postIndex === 0 && !isReelsTab} stories={stories} onAddStory={onAddStory} onOpenStory={onOpenStory} likeRate={likeRate} viewRate={viewRate} onTip={onTip} currentUserId={user?.uid} />;
        })}
        {posts.length === 0 && <div className="h-screen w-full snap-start flex flex-col items-center justify-center text-center p-8"><h2 className="text-3xl font-black italic glow-text mb-2">No Drops Yet</h2></div>}
      </div>
    </div>
  );
};

const StatsDropdownCard = ({ user, userPosts, onClose, onExpand, onPlayPost, a11ySettings, onLogout }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => { SensorySystem.triggerHaptic([20, 40, 60]); SensorySystem.playHiss(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || a11ySettings.reduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    let animationFrameId: number;
    const fade = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      animationFrameId = requestAnimationFrame(fade);
    };
    fade();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [a11ySettings.reduceMotion]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (a11ySettings.reduceMotion) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setTilt({ x: ((y - centerY) / centerY) * -8, y: ((x - centerX) / centerX) * 8 });

      if (isDragging.current && canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (!ctx) return;
         ctx.beginPath();
         ctx.arc(x, y, Math.random() * 12 + 4, 0, Math.PI * 2);
         ctx.fillStyle = (x + y) % 2 === 0 ? '#ff1493' : '#39ff14';
         ctx.shadowBlur = 15;
         ctx.shadowColor = ctx.fillStyle;
         ctx.fill();
         if (Math.random() > 0.7) SensorySystem.triggerHaptic(5);
      }
    }
  };

  const resetTilt = () => { setTilt({ x: 0, y: 0 }); isDragging.current = false; };

  return (
    <div
      ref={cardRef} onPointerDown={() => { isDragging.current = true; SensorySystem.playSnap(); }} onPointerUp={resetTilt} onPointerLeave={resetTilt} onPointerMove={handlePointerMove}
      style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: 'preserve-3d' }}
      className="absolute top-[70px] left-4 right-4 z-[90] bg-black/75 backdrop-blur-3xl border-2 border-[#ff1493] rounded-3xl p-5 shadow-[0_20px_50px_rgba(255,20,147,0.5)] animate-slide-down touch-none transition-transform duration-100 ease-out"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none opacity-80" />
      <div style={{ transform: 'translateZ(20px)' }} className="relative z-10 pointer-events-auto">
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
               <div className="relative w-14 h-14 flex items-center justify-center">
                  {!a11ySettings.reduceMotion && (
                     <>
                       <div className="absolute inset-[-4px] rounded-full border-t-2 border-r-2 border-[#ff1493] spin-slow opacity-80 shadow-[0_0_10px_#ff1493]"></div>
                       <div className="absolute inset-[-8px] rounded-full border-b-2 border-l-2 border-[#39ff14] spin-fast-reverse opacity-60 shadow-[0_0_10px_#39ff14]"></div>
                     </>
                  )}
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-2xl font-black italic text-white z-10 border border-white/20">{user.username.charAt(0).toUpperCase()}</div>
               </div>
               <div>
                  <h2 className="text-2xl font-black italic glow-text tracking-tight">@{user.username}</h2>
                  <p className="text-[#39ff14] font-bold text-[10px] uppercase flex items-center gap-1"><Star size={10} /> Viral Core: {(user.views * 0.1 + user.likes * 2).toFixed(0)}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => SensorySystem.readAloud(`Live stats for ${user.username}. Views ${user.views}. Likes ${user.likes}.`)} className="p-2 bg-white/10 rounded-full text-white hover:bg-[#39ff14] hover:text-black transition-colors"><Ear size={18} /></button>
               <button onClick={() => { SensorySystem.playSnap(); onClose(); }} className="p-2 bg-white/10 rounded-full text-white hover:bg-[#ff1493] hover:text-white transition-colors"><X size={18} /></button>
            </div>
         </div>

         <div className="bg-black/50 rounded-2xl p-4 mb-4 border border-white/20 shadow-inner">
            <div className="flex justify-between text-2xl font-black">
               <div className="flex flex-col items-center"><span className="text-[#00ffff] drop-shadow-[0_0_8px_#00ffff]">{a11ySettings.reduceMotion ? user.views : <Ticker value={user.views} />}</span><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Views</span></div>
               <div className="flex flex-col items-center"><span className="text-[#ff1493] drop-shadow-[0_0_8px_#ff1493]">{a11ySettings.reduceMotion ? user.likes : <Ticker value={user.likes} />}</span><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Likes</span></div>
               <div className="flex flex-col items-center"><span className="text-[#39ff14] drop-shadow-[0_0_8px_#39ff14]">${user.earnings.toFixed(2)}</span><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Earnt</span></div>
            </div>
         </div>

         <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-300 uppercase text-[10px] tracking-widest">Latest Drops</h3>
            <div className="flex gap-2">
               {onLogout && <button onClick={() => { SensorySystem.playBlip(); onLogout(); }} className="text-red-400 flex items-center gap-1 text-[10px] font-black uppercase bg-red-500/10 px-2 py-1 rounded-full hover:bg-red-500 hover:text-white transition-all"><LogOut size={12} /> Logout</button>}
               <button onClick={() => { SensorySystem.playBlip(); onExpand(); }} className="text-[#00ffff] flex items-center gap-1 text-[10px] font-black uppercase bg-[#00ffff]/10 px-2 py-1 rounded-full hover:bg-[#00ffff] hover:text-black transition-all">Expand Hub <Maximize2 size={12} /></button>
            </div>
         </div>

         <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1" onPointerDown={(e) => e.stopPropagation()}>
            {userPosts.slice(0, 10).map((p: any) => (
               <div key={p.id} onClick={() => onPlayPost(p)} className="min-w-[90px] h-[130px] rounded-xl overflow-hidden relative border border-white/20 cursor-pointer flex-shrink-0 hover:border-[#39ff14] hover:shadow-[0_0_15px_#39ff14] transition-all">
                  {p.type === 'video' ? <video src={p.url} className={`w-full h-full object-cover ultra-cinematic ${p.filterClass}`} /> : <img src={p.url} className={`w-full h-full object-cover ultra-cinematic ${p.filterClass}`} />}
                  <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Eye size={10} className="text-[#39ff14]" /> {p.views >= 1000 ? (p.views/1000).toFixed(1)+'k' : p.views}</div>
               </div>
            ))}
            {userPosts.length === 0 && <div className="w-full text-center text-[#ff1493] font-black italic text-sm py-8 border-2 border-dashed border-[#ff1493]/30 rounded-xl">NO DROPS YET. PAINT IT!</div>}
         </div>
      </div>
    </div>
  );
};

const LiveChatSaves = ({ userId }: { userId: string }) => {
  const [saves, setSaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getLiveSaves(userId);
        setSaves(data);
      } catch (e) { console.error('Failed to load live saves:', e); }
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLiveSave(id);
      setSaves(prev => prev.filter(s => s.id !== id));
    } catch (e) { console.error('Failed to delete:', e); }
  };

  const formatDur = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  if (loading) return <div className="text-center py-4"><div className="w-6 h-6 border-t-2 border-[#ff1493] rounded-full animate-spin mx-auto" /></div>;
  if (saves.length === 0) return <p className="text-[10px] text-gray-500 text-center py-4">No live sessions saved yet. Go Live to start!</p>;

  return (
    <div className="space-y-3">
      {saves.map((s) => (
        <div key={s.id} className="p-3 rounded-xl bg-black/60 border border-[#ff1493]/20 hover:border-[#ff1493]/50 transition-colors relative group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff1493]" />
              <span className="text-[10px] font-mono text-[#39ff14] truncate max-w-[160px]">{s.room_name}</span>
            </div>
            <span className="text-[9px] text-gray-500">{formatDate(s.created_at)}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-[#00ffff]"><Clock size={10} /> {formatDur(s.duration_seconds)}</span>
            <span className="flex items-center gap-1 text-[#9b5de5]"><User size={10} /> {s.participant_count}</span>
            {s.captions_used && <span className="flex items-center gap-1 text-[#39ff14]"><Ear size={10} /> CC</span>}
          </div>
          {s.notes && <p className="text-[9px] text-gray-400 mt-2 leading-relaxed italic">"{s.notes}"</p>}
          <button onClick={() => handleDelete(s.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

const FullProfileScreen = ({ user, userPosts, onClose, onPlayPost, a11ySettings, setA11ySettings }: any) => {
  const toggleA11y = (setting: string) => { SensorySystem.playBlip(); setA11ySettings((prev: any) => ({ ...prev, [setting]: !prev[setting] })); };
  return (
    <div className="absolute inset-0 bg-black z-[95] pt-16 px-6 text-white overflow-y-auto pb-24 animate-slide-up">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 bg-black/60 border-2 border-[#00ffff] text-[#00ffff] rounded-full shadow-[0_0_15px_#00ffff]"><ArrowLeft size={32} /></button>
        <h1 className="text-4xl font-black italic glow-text mb-0 uppercase">Profile Hub</h1>
      </div>
      <div className="bg-gray-900 rounded-2xl p-4 mb-8 border border-gray-700">
         <h3 className="font-bold text-[#ff1493] mb-3 uppercase text-sm flex items-center gap-2"><Accessibility size={16} /> Accessibility Center</h3>
         <div className="grid grid-cols-3 gap-2">
            <button onClick={() => toggleA11y('reduceMotion')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${a11ySettings.reduceMotion ? 'border-[#39ff14] bg-[#39ff14]/20 text-[#39ff14]' : 'border-gray-700 text-gray-400'}`}><ZapOff size={20} className="mb-1" /><span className="text-[10px] font-bold text-center">Reduce<br/>Motion</span></button>
            <button onClick={() => toggleA11y('highContrast')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${a11ySettings.highContrast ? 'border-white bg-white/20 text-white' : 'border-gray-700 text-gray-400'}`}><Contrast size={20} className="mb-1" /><span className="text-[10px] font-bold text-center">High<br/>Contrast</span></button>
            <button onClick={() => toggleA11y('dyslexicFont')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${a11ySettings.dyslexicFont ? 'border-[#00ffff] bg-[#00ffff]/20 text-[#00ffff]' : 'border-gray-700 text-gray-400'}`}><Type size={20} className="mb-1" /><span className="text-[10px] font-bold text-center">Readable<br/>Font</span></button>
         </div>
      </div>

      {user?.uid && !user.uid.startsWith('guest_') && (
        <div className="bg-gray-900 rounded-2xl p-4 mb-8 border border-[#ff1493]/30">
          <h3 className="font-bold text-[#ff1493] mb-3 uppercase text-sm flex items-center gap-2"><Video size={16} /> Live Chat Saves</h3>
          <LiveChatSaves userId={user.uid} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
         {userPosts.map((p: any) => (
            <button key={p.id} onClick={() => onPlayPost(p)} className="aspect-[3/4] rounded-xl overflow-hidden relative border border-white/20 cursor-pointer">
               {p.type === 'video' ? <video src={p.url} className={`w-full h-full object-cover ultra-cinematic ${p.filterClass || ''}`} /> : <img src={p.url} className={`w-full h-full object-cover ultra-cinematic ${p.filterClass || ''}`} />}
            </button>
         ))}
      </div>
    </div>
  );
};

const ProfilePostPlayer = ({ post, onClose, onMonetize, onTip }: any) => {
  const [liked, setLiked] = useState(false);
  useEffect(() => { onMonetize(post.id); SensorySystem.playSnap(); }, []);

  const toggleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!liked) { setLiked(true); SensorySystem.playBassDrop(); }
    else { setLiked(false); SensorySystem.playBlip(); }
  };

  return (
    <div className="absolute inset-0 bg-black z-[300] flex flex-col items-center justify-center animate-slide-up" onDoubleClick={(e) => { e.preventDefault(); if(!liked) toggleLike(); }}>
       <div className="absolute top-12 left-6 z-50">
          <button onClick={onClose} className="p-3 bg-black/60 border-2 border-[#ff1493] text-[#ff1493] rounded-full shadow-[0_0_15px_#ff1493]"><ArrowLeft size={28} /></button>
       </div>
       <div className={`w-full h-full flex justify-center items-center bg-black ${post.filterClass || ''}`}>
          {post.type === 'video' ? <video src={post.url} autoPlay playsInline loop className="w-full h-[85vh] object-contain ultra-cinematic" /> : <img src={post.url} className="w-full h-[85vh] object-contain ultra-cinematic" alt="post" />}
       </div>
       <div className="absolute bottom-8 left-6 right-6 z-30 flex justify-between items-end bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <div>
             <h3 className="font-black text-xl text-[#39ff14] glow-text mb-1">@{post.author}</h3>
             <p className="text-sm font-bold text-gray-300 flex items-center gap-1"><Eye size={14} className="text-[#00ffff]"/> {(post.views + 1).toLocaleString()} views</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={(e) => { e.stopPropagation(); if (onTip) onTip(post.author, post.uid); }} className="flex flex-col items-center z-50 pointer-events-auto text-[#39ff14]">
                <Gift size={28} />
                <span className="text-[9px] font-bold mt-1">Tip</span>
             </button>
             <div className="flex flex-col items-center">
               <button onClick={toggleLike} className="flex flex-col items-center z-50 pointer-events-auto">
                  <Heart size={36} className={`transition-all ${liked ? 'text-[#ff1493] fill-[#ff1493]' : 'text-white'}`} />
               </button>
               <span className="text-sm font-black mt-1">{post.likes + (liked ? 1 : 0)}</span>
             </div>
          </div>
       </div>
    </div>
  );
};

const StoryViewer = ({ stories, initialIndex, onClose, onStoryMonetize }: any) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  useEffect(() => { onStoryMonetize(); }, [currentIndex]);
  const story = stories[currentIndex];
  if (!story) return null;

  return (
    <div className="absolute inset-0 z-[200] bg-black flex flex-col">
      <div className="absolute top-10 left-4 right-4 z-20 flex justify-between items-center">
         <div className="flex items-center gap-3">
           <button onClick={onClose} className="p-2 mr-2 bg-black/60 border border-[#ff1493] text-[#ff1493] rounded-full shadow-[0_0_10px_#ff1493]"><ArrowLeft size={20} /></button>
           <div className="font-black italic text-lg text-white">@{story.user}</div>
         </div>
      </div>
      <div className="absolute inset-0 z-10 flex">
         <div className="w-1/3 h-full" onClick={() => { if(currentIndex>0) setCurrentIndex(currentIndex-1); }}></div>
         <div className="w-2/3 h-full" onClick={() => { if(currentIndex<stories.length-1) setCurrentIndex(currentIndex+1); else onClose(); }}></div>
      </div>
      <div className="w-full h-full flex items-center justify-center">
         {story.type === 'video' ? <video src={story.url} autoPlay playsInline loop muted className="w-full h-full object-contain" /> : <img src={story.url} className="w-full h-full object-contain" alt="story" />}
      </div>
    </div>
  );
};

const CinematicShowCard = ({ show, onSelect, onPlay, isActive }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showBurst, setShowBurst] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
       videoRef.current.currentTime = 0;
       videoRef.current.play().catch(() => {});
    } else if (!isActive && videoRef.current) {
       videoRef.current.pause();
    }
  }, [isActive]);

  const handleInteract = () => {
    if (isActive) { onPlay(); }
    else { SensorySystem.playBlip(); setShowBurst(true); onSelect(); }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -15;
    const tiltY = ((x - centerX) / centerX) * 15;
    setTilt({ x: tiltX, y: tiltY });
    if (Math.random() > 0.9) SensorySystem.triggerHaptic(5);
  };

  const handleMouseLeave = () => { setIsHovered(false); setTilt({ x: 0, y: 0 }); };

  const getTransform = () => {
    if (isHovered && isActive) return `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.15) translateZ(30px)`;
    if (isHovered) return `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.1) translateZ(20px)`;
    if (isActive) return `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05) translateZ(10px)`;
    return `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)`;
  };

  return (
    <div
       ref={cardRef}
       className={`cinematic-card ${isActive ? 'cinematic-card-active spray-border-active' : ''}`}
       onMouseEnter={() => { setIsHovered(true); SensorySystem.playSnap(); }}
       onMouseLeave={handleMouseLeave}
       onMouseMove={handleMouseMove}
       onClick={handleInteract}
       style={{ transform: getTransform(), transition: isHovered ? 'none' : 'transform 0.4s ease-out' }}
    >
       {showBurst && <CardBurst onComplete={() => setShowBurst(false)} />}
       <div className="glass-glare"></div>
       {show.isVideoThumb ? (
          <video src={show.thumbnail} className={`cinematic-card-img object-cover ultra-cinematic ${show.filterClass || ''}`} muted playsInline />
       ) : (
          <img src={show.thumbnail} alt={show.seriesTitle} className={`cinematic-card-img ultra-cinematic ${show.filterClass || ''}`} />
       )}
       <video ref={videoRef} src={show.episodes[0].url} className={`cinematic-card-vid ultra-cinematic ${show.filterClass || ''}`} muted loop playsInline />
       <div className="cinematic-card-info flex flex-col justify-end pointer-events-none">
          <h3 className="font-black text-lg text-white mb-1 leading-tight glow-text">{show.seriesTitle}</h3>
          <div className="flex items-center gap-2 mb-2">
             <span className="text-xs font-bold text-[#39ff14] border border-[#39ff14] px-1.5 py-0.5 rounded uppercase">{show.episodes.length} EP</span>
             <span className="text-xs text-gray-300 flex items-center gap-1"><Eye size={12} className="text-[#00ffff]"/> {(show.views / 1000).toFixed(0)}K</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">{show.description || `Created by @${show.author}. Dive into the latest masterpiece.`}</p>
       </div>
    </div>
  );
};

const ShowsScreen = ({ shows, onPlayEpisode, onUploadShow }: any) => {
  const [featuredShow, setFeaturedShow] = useState(shows[0]);
  const [activeFilter, setActiveFilter] = useState('All Shows');
  const containerRef = useRef<HTMLDivElement>(null);

  const filters = ['All Shows', 'Trending', 'Neon Originals', 'Audio Described'];

  const displayedShows = useMemo(() => {
    if (activeFilter === 'All Shows') return shows;
    return shows.filter((s: any) => s.categories && s.categories.includes(activeFilter));
  }, [shows, activeFilter]);

  const handleSelectShow = (show: any) => {
    setFeaturedShow(show);
    if(containerRef.current) { containerRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <div ref={containerRef} className="h-full w-full bg-black pb-24 overflow-y-auto animate-slide-down scroll-smooth relative z-0 hide-scrollbar">
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden bg-black">
         <video key={"bg_" + featuredShow.id} src={featuredShow.episodes[0].url} autoPlay loop muted playsInline className={`w-full h-full object-cover opacity-80 ultra-cinematic ${featuredShow.filterClass || ''}`} />
      </div>
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-t from-black via-black/80 to-black/30 cinematic-vignette"></div>
      <NeonDust />

      <div className="sticky top-0 left-0 w-full z-50 pt-4 pb-2 transition-all">
        <div className="px-6 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Tv size={32} className="text-[#00ffff] drop-shadow-[0_0_15px_#00ffff]" />
            <h1 className="text-3xl font-black italic text-white leading-none tracking-tighter drop-shadow-md">
              ABILITY<span className="text-[#39ff14] glow-text">SHOWS</span>
            </h1>
          </div>
          {onUploadShow && (
            <button onClick={onUploadShow} className="p-2.5 bg-gradient-to-r from-[#39ff14] to-[#00ffff] rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:scale-110 active:scale-95 transition-transform">
              <Upload size={20} className="text-black" />
            </button>
          )}
        </div>
        <div className="flex gap-3 px-6 overflow-x-auto hide-scrollbar pb-2">
          {filters.map(f => (
            <button key={f} onClick={() => { setActiveFilter(f); SensorySystem.playSnap(); }}
              className={`px-5 py-2 text-sm font-black rounded-full transition-all border-2 whitespace-nowrap ${activeFilter === f ? 'bg-gradient-to-r from-[#39ff14] to-[#00ffff] text-black border-transparent shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-black/60 backdrop-blur-md border-white/20 text-white hover:bg-white/10 hover:border-white/50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full min-h-[50vh] flex flex-col justify-end px-6 pb-8 pt-8 z-20">
         <div className="animate-slide-up" key={featuredShow.id + "_info"}>
            <div className="flex items-center gap-3 mb-3">
               <span className="text-xs font-black uppercase tracking-widest bg-[#ff1493] text-white px-3 py-1 rounded shadow-[0_0_10px_#ff1493]">{featuredShow.categories ? featuredShow.categories[0] : 'Featured'}</span>
            </div>
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter mb-4 glow-text text-white leading-none">
               {featuredShow.seriesTitle.toUpperCase()}
            </h1>
            <p className="text-gray-200 font-bold text-base sm:text-lg mb-8 max-w-xl drop-shadow-md">
               {featuredShow.description || "Dive into the latest creative masterpiece curated exclusively for the Ability Stream network."}
            </p>
            <div className="flex gap-4">
               <button onClick={() => { SensorySystem.playBassDrop(); onPlayEpisode(featuredShow, featuredShow.episodes[0]); }}
                  className="flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                  <Play size={24} className="fill-black" /> WATCH NOW
               </button>
               <button onClick={() => SensorySystem.readAloud(`Now featuring ${featuredShow.seriesTitle} by ${featuredShow.author}. ${featuredShow.description || ''}`)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white font-black px-6 py-4 rounded-xl border border-white/30 hover:border-white/80 transition-all">
                  <Ear size={20} /> <span className="hidden sm:inline">Read Aloud</span>
               </button>
            </div>
         </div>
      </div>

      <div className="px-6 pb-8 z-30 relative">
         <h2 className="text-xl font-black italic text-white mb-2 flex items-center gap-2">
            <Sparkles size={20} className="text-[#39ff14]" />
            {activeFilter === 'All Shows' ? 'All Shows' : activeFilter}
         </h2>
         <div className="cinematic-row-container hide-scrollbar">
            {displayedShows.map((show: any) => (
               <CinematicShowCard key={show.id} show={show} isActive={featuredShow.id === show.id} onSelect={() => handleSelectShow(show)} onPlay={() => { SensorySystem.playBassDrop(); onPlayEpisode(show, show.episodes[0]); }} />
            ))}
         </div>
      </div>
    </div>
  );
};

const ThumbnailStudio = ({ onSave, onSkip }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff1493');
  const [brushSize, setBrushSize] = useState(8);
  const [mode, setMode] = useState('draw');
  const colors = ['#ff1493', '#39ff14', '#00ffff', '#9b5de5', '#ff6b00', '#ffffff', '#000000'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        SensorySystem.playSnap();
      };
      img.src = imgUrl;
    }
  };

  const startDrawing = (e: any) => { setIsDrawing(true); draw(e); SensorySystem.playHiss(); };
  const stopDrawing = () => { setIsDrawing(false); const ctx = canvasRef.current?.getContext('2d'); if(ctx) ctx.beginPath(); };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.shadowBlur = brushSize * 2;
      ctx.shadowColor = color;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (Math.random() > 0.8) SensorySystem.triggerHaptic(5);
  };

  const handleSave = () => {
    SensorySystem.playBassDrop();
    try {
      const dataUrl = canvasRef.current?.toDataURL('image/png');
      onSave(dataUrl);
    } catch (err) {
      console.error("Canvas export blocked, using default", err);
      onSave(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] animate-slide-up rounded-2xl overflow-hidden border border-white/20">
       <div className="p-4 bg-black flex justify-between items-center border-b border-white/10">
          <h3 className="font-black italic text-[#39ff14] flex items-center gap-2"><Palette size={20}/> Neon Canvas</h3>
          <button onClick={onSkip} className="text-gray-400 text-sm font-bold hover:text-white transition-colors">Skip</button>
       </div>
       <div className="p-4 flex-1 flex flex-col items-center">
          <div className="flex w-full max-w-2xl justify-between items-end mb-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Spray Paint Your Cover Art</p>
            <label className="flex items-center gap-2 text-xs font-bold text-[#ff1493] cursor-pointer hover:text-white transition-colors">
              <ImageIcon size={16} /> Upload Background
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadBg} />
            </label>
          </div>
          <div className="drawing-canvas-container max-w-2xl">
             <canvas ref={canvasRef} className="drawing-canvas"
                onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onMouseMove={draw}
                onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchCancel={stopDrawing} onTouchMove={draw}
             />
             <div className="absolute top-2 left-2 flex flex-col gap-2 z-20">
                <button onClick={() => { setMode('draw'); SensorySystem.playSnap(); }} className={`p-2 rounded-full ${mode === 'draw' ? 'bg-[#ff1493] text-white shadow-[0_0_15px_#ff1493]' : 'bg-black/80 text-gray-400'}`}><Brush size={20}/></button>
                <button onClick={() => { setMode('erase'); SensorySystem.playSnap(); }} className={`p-2 rounded-full ${mode === 'erase' ? 'bg-white text-black shadow-[0_0_15px_white]' : 'bg-black/80 text-gray-400'}`}><Eraser size={20}/></button>
             </div>
          </div>
          <div className="w-full max-w-2xl mt-6 flex justify-between items-center bg-[#111] p-3 rounded-xl border border-white/10">
             <div className="flex gap-2">
                {colors.map(c => (
                   <button key={c} onClick={() => { setColor(c); setMode('draw'); SensorySystem.playBlip(); }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && mode === 'draw' ? 'scale-125 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}` : 'none' }}
                   />
                ))}
             </div>
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400">Size</span>
                <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-24 accent-[#00ffff]" />
             </div>
          </div>
          <button onClick={handleSave} className="w-full max-w-2xl bg-gradient-to-r from-[#39ff14] to-[#00ffff] text-black font-black text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-6 flex items-center justify-center gap-2">
             <Save size={24} /> SAVE MASTERPIECE
          </button>
       </div>
    </div>
  );
};

const ShowsUploadScreen = ({ user, onPublishShow, onBack, categories }: any) => {
  const [phase, setPhase] = useState('select');
  const [file, setFile] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trending');
  const [filter, setFilter] = useState('Normal');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(URL.createObjectURL(selected));
      setRawFile(selected);
      SensorySystem.playSnap();
      setPhase('details');
    }
  };

  const goToStudio = () => {
    if(!seriesTitle) return;
    SensorySystem.playSnap();
    setPhase('thumbnail_studio');
  };

  const dataUrlToFile = (dataUrl: string, filename: string): File | null => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], filename, { type: mime });
    } catch { return null; }
  };

  const handlePublish = (customThumbUrl: string | null = null) => {
    SensorySystem.playSnap();
    setPhase('uploading');
    const finalThumb = customThumbUrl || file || `https://placehold.co/1280x720/1a1a1a/ff1493?text=${encodeURIComponent(seriesTitle)}`;
    const selectedFilterClass = OPTIC_FILTERS.find(f=>f.name===filter)?.class || '';
    const thumbFile = customThumbUrl ? dataUrlToFile(customThumbUrl, `thumb_${Date.now()}.png`) : null;
    setTimeout(() => {
      onPublishShow({
        id: 'show_' + Date.now(),
        seriesTitle: seriesTitle,
        description: description,
        author: user.username,
        categories: [category],
        avatar: `https://placehold.co/100x100/1a1a1a/39ff14?text=${user.username.charAt(0).toUpperCase()}`,
        thumbnail: finalThumb,
        _thumbnailFile: thumbFile,
        filterClass: selectedFilterClass,
        isVideoThumb: false,
        views: 0,
        episodes: [{
          id: 'ep_' + Date.now(),
          title: episodeTitle || 'Episode 1',
          duration: 'New',
          url: file ? file : 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          _file: rawFile
        }]
      });
    }, 1500);
  };

  if (phase === 'uploading') return (
    <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center p-6 text-center z-[200]">
       <h1 className="text-5xl font-black italic text-[#39ff14] glow-text mb-6 uppercase leading-tight tracking-tighter">Publishing<br/>To Shows...</h1>
       <div className="w-20 h-20 border-t-8 border-[#ff1493] border-solid rounded-full animate-spin shadow-[0_0_30px_#ff1493]"></div>
    </div>
  );

  if (phase === 'thumbnail_studio') return (
    <div className="h-full w-full bg-[#050505] p-4 flex flex-col z-[200] animate-slide-down pb-20 overflow-y-auto">
       <ThumbnailStudio videoUrl={file} onSave={(dataUrl: string | null) => { handlePublish(dataUrl); }} onSkip={() => handlePublish(null)} />
    </div>
  );

  return (
    <div className="h-full w-full bg-[#050505] pt-12 px-4 flex flex-col text-white animate-slide-down pb-20 overflow-y-auto">
       <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 bg-black/60 border border-white/20 hover:border-[#ff1493] hover:text-[#ff1493] transition-colors rounded-full"><X size={24} /></button>
          <h1 className="text-3xl font-black italic text-[#ff1493] drop-shadow-[0_0_10px_#ff1493] mb-0 uppercase">Studio</h1>
       </div>

       {phase === 'select' && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
             <label className="w-full max-w-md aspect-square rounded-[40px] border-4 border-dashed border-[#ff1493] bg-[#111] hover:bg-[#1a1a1a] transition-colors flex flex-col items-center justify-center cursor-pointer shadow-[0_0_50px_rgba(255,20,147,0.2)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff1493]/10 to-[#39ff14]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-[#ff1493] to-[#9b5de5] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_#ff1493] group-hover:scale-110 transition-transform">
                   <Upload size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-black italic mb-2">Select files to upload</h2>
                <p className="text-gray-400 text-sm font-bold text-center px-8">Your videos will be private until you hit publish.</p>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
             </label>
          </div>
       )}

       {phase === 'details' && (
          <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
             <div className="bg-[#111] p-5 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-[#39ff14]"/> Details</h2>
                <div className="mb-4">
                   <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Category</label>
                   <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-[#39ff14]">
                      {(categories && categories.length > 0 ? categories : ['Trending', 'Neon Originals', 'Audio Described']).map((c: string) => (
                        <option key={c}>{c}</option>
                      ))}
                   </select>
                </div>
                <div className="mb-4">
                   <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Series / Playlist</label>
                   <input type="text" value={seriesTitle} onChange={e=>setSeriesTitle(e.target.value)} placeholder="e.g. Neon Tutorials" className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-[#39ff14] transition-colors" />
                </div>
                <div className="mb-4">
                   <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Episode Title (Required)</label>
                   <input type="text" value={episodeTitle} onChange={e=>setEpisodeTitle(e.target.value)} placeholder="Add a title that describes your video" className="w-full bg-black border border-[#ff1493]/50 rounded-xl p-3 text-white focus:outline-none focus:border-[#ff1493] shadow-[0_0_10px_rgba(255,20,147,0.1)] transition-colors" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Description</label>
                   <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell viewers about your video" rows={3} className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-[#00ffff] transition-colors resize-none"></textarea>
                </div>
                <div className="mt-6">
                   <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Cinematic Filters</label>
                   <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                     {OPTIC_FILTERS.map(f => (
                       <button key={f.name} onClick={() => { setFilter(f.name); SensorySystem.playSnap(); }} className={`min-w-max px-4 py-2 text-sm rounded-full font-bold transition-all border ${filter === f.name ? 'bg-[#39ff14] text-black border-[#39ff14] shadow-[0_0_10px_#39ff14]' : 'bg-transparent text-white border-white/30 hover:border-white/80'}`}>{f.name}</button>
                     ))}
                   </div>
                </div>
             </div>
             <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="w-full aspect-video bg-black relative">
                   {file ? (
                      <video key={file} src={file} autoPlay loop muted playsInline className={`w-full h-full object-cover ultra-cinematic ${OPTIC_FILTERS.find(f=>f.name===filter)?.class || ''}`} />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><Video size={48} /></div>
                   )}
                   <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold border border-white/20 pointer-events-none">Preview</div>
                </div>
             </div>
             <button onClick={goToStudio} className="w-full bg-gradient-to-r from-[#9b5de5] to-[#ff1493] text-white font-black text-xl py-4 rounded-full shadow-[0_0_20px_rgba(255,20,147,0.4)] hover:scale-[1.02] active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                NEXT: CREATE THUMBNAIL <Brush size={20}/>
             </button>
          </div>
       )}
    </div>
  );
};

const ShowPlayer = ({ show, episode, onClose, onMonetize, onTip }: any) => {
  const [liked, setLiked] = useState(false);
  useEffect(() => { onMonetize(); SensorySystem.playSnap(); }, []);

  const toggleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!liked) { setLiked(true); SensorySystem.playBassDrop(); }
    else { setLiked(false); SensorySystem.playBlip(); }
  };

  return (
    <div className="absolute inset-0 bg-black z-[300] flex flex-col animate-slide-up" onDoubleClick={(e) => { e.preventDefault(); if (!liked) toggleLike(); }}>
       <div className="absolute top-12 left-4 z-50"><button onClick={onClose} className="p-2 bg-black/60 border border-[#00ffff] text-[#00ffff] rounded-full shadow-[0_0_15px_#00ffff] hover:scale-110 transition-transform"><ArrowLeft size={24} /></button></div>
       <div className="flex-1 flex items-center bg-black justify-center mt-0 pt-20">
          <video src={episode.url} autoPlay playsInline controls className={`w-full max-h-[70vh] object-contain shadow-[0_0_50px_rgba(57,255,20,0.1)] ultra-cinematic ${show.filterClass || ''}`} />
       </div>
       <div className="p-6 bg-gradient-to-t from-gray-950 to-black border-t border-white/10">
          <h2 className="text-[#00ffff] font-black text-sm uppercase tracking-widest mb-1">{show.seriesTitle}</h2>
          <div className="flex justify-between items-start"><h3 className="font-bold text-2xl text-white mb-2 leading-tight pr-4">{episode.title}</h3><span className="bg-white/10 border border-white/20 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 mt-1"><Clock size={12}/>{episode.duration}</span></div>
          <div className="flex justify-between items-center mt-4">
             <div className="flex gap-3 items-center">
               <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20"><img src={show.avatar} className="w-full h-full object-cover"/></div>
               <div><p className="font-bold text-[#39ff14]">@{show.author}</p><p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Eye size={12}/> {(show.views + 1).toLocaleString()} views</p></div>
             </div>
             <div className="flex items-center gap-4">
               <button onClick={(e) => { e.stopPropagation(); if (onTip) onTip(show.author, show.uid); }} className="flex flex-col items-center text-[#39ff14]">
                  <Gift size={28} />
                  <span className="text-[9px] font-bold mt-0.5">Tip</span>
               </button>
               <button onClick={toggleLike} className="flex flex-col items-center"><Heart size={32} className={`transition-all ${liked ? 'text-[#ff1493] fill-[#ff1493] drop-shadow-[0_0_15px_#ff1493]' : 'text-white'}`} /></button>
             </div>
          </div>
       </div>
    </div>
  );
};

async function uploadFileToStorage(file: File, _path: string): Promise<string> {
  return api.uploadFile(file);
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [reels, setReels] = useState(MOCK_REELS);
  const [shows, setShows] = useState(MOCK_SHOWS);
  const [stories, setStories] = useState(MOCK_STORIES);

  const [currentTab, setCurrentTab] = useState('shows');
  const [uploadDest, setUploadDest] = useState('stream');
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [playingProfilePost, setPlayingProfilePost] = useState<any>(null);
  const [playingShow, setPlayingShow] = useState<any>(null);
  const [a11ySettings, setA11ySettings] = useState({ highContrast: false, reduceMotion: false, dyslexicFont: false });
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showAbilityLive, setShowAbilityLive] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [tipTarget, setTipTarget] = useState<{ name: string; uid?: string } | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = localStorage.getItem('ability_stream_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);

          if (parsed.uid && !parsed.uid.startsWith('guest_')) {
            try {
              const walletData = await api.getWallet(parsed.uid);
              if (walletData && walletData.user) {
                const freshBal = parseFloat(walletData.user.wallet_balance) || 0;
                const totalViews = parseInt(walletData.stats?.total_views) || 0;
                const totalLikes = parseInt(walletData.stats?.total_likes) || 0;
                let totalEarnings = 0;
                if (walletData.earnings) {
                  walletData.earnings.forEach((e: any) => { totalEarnings += parseFloat(e.total) || 0; });
                }
                const updated = {
                  ...parsed,
                  walletBal: freshBal,
                  views: totalViews,
                  likes: totalLikes,
                  earnings: totalEarnings,
                  email: walletData.user.email || parsed.email,
                  username: walletData.user.display_name || parsed.username,
                  role: walletData.user.role || parsed.role,
                };
                setUser(updated);
                localStorage.setItem('ability_stream_user', JSON.stringify(updated));
              }
            } catch (e) {
              console.log('Offline mode: using cached user data');
            }
          }
        }
      } catch (e) {}
      setAuthChecked(true);
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const loadPlatformConfig = async () => {
      try {
        const data = await api.getAdminConfig();
        if (data) {
          const mon = typeof data.monetization === 'string' ? JSON.parse(data.monetization) : data.monetization;
          const slots = typeof data.ad_slots === 'string' ? JSON.parse(data.ad_slots) : data.ad_slots;
          const cats = typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories;
          const featured = typeof data.featured_show_ids === 'string' ? JSON.parse(data.featured_show_ids) : data.featured_show_ids;
          setPlatformConfig({
            monetization: { ...DEFAULT_CONFIG.monetization, ...mon },
            adSlots: slots || DEFAULT_CONFIG.adSlots,
            featuredShowIds: featured || [],
            categories: cats || DEFAULT_CONFIG.categories,
          });
        }
      } catch (e) {
        console.error('Failed to load platform config:', e);
      }
    };
    loadPlatformConfig();
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await api.getPosts();
        if (data && data.length > 0) {
          const allPosts = data.map((p: any) => ({
            ...p,
            url: p.media_url || p.url,
            filterClass: p.filter_class,
            createdAt: p.created_at,
            seriesTitle: p.title,
          }));
          const dbPosts = allPosts.filter((p: any) => p.type === 'post');
          const dbReels = allPosts.filter((p: any) => p.type === 'reel');
          const dbStories = allPosts.filter((p: any) => p.type === 'story').map((s: any) => ({
            ...s, user: s.author, image: s.media_url || s.url
          }));
          const dbShows = allPosts.filter((p: any) => p.type === 'show').map((s: any) => ({
            ...s,
            seriesTitle: s.title,
            episodes: typeof s.episodes === 'string' ? JSON.parse(s.episodes) : (s.episodes || []),
            categories: typeof s.categories === 'string' ? JSON.parse(s.categories) : (s.categories || []),
          }));

          const mergedPosts = [...MOCK_POSTS];
          dbPosts.forEach((fp: any) => { if (!mergedPosts.find(m => m.id === fp.id)) mergedPosts.unshift(fp); });
          setPosts(mergedPosts);

          const mergedReels = [...MOCK_REELS];
          dbReels.forEach((fr: any) => { if (!mergedReels.find(m => m.id === fr.id)) mergedReels.unshift(fr); });
          setReels(mergedReels);

          const mergedStories = [...MOCK_STORIES];
          dbStories.forEach((fs: any) => { if (!mergedStories.find((m: any) => m.id === fs.id)) mergedStories.unshift(fs); });
          setStories(mergedStories);

          const mergedShows = [...MOCK_SHOWS];
          dbShows.forEach((fs: any) => { if (!mergedShows.find(m => m.id === fs.id)) mergedShows.unshift(fs); });
          setShows(mergedShows);
        }
      } catch (e) { console.error('Failed to load content:', e); }
    };
    loadContent();
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    socket.on('like_update', (data: any) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? { ...p, likes: data.likes } : p));
      setReels(prev => prev.map(p => p.id === data.postId ? { ...p, likes: data.likes } : p));
    });

    socket.on('view_update', (data: any) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? { ...p, views: data.views } : p));
      setReels(prev => prev.map(p => p.id === data.postId ? { ...p, views: data.views } : p));
    });

    socket.on('wallet_update', (data: any) => {
      if (data.userId === user.uid) {
        setUser((prev: any) => {
          const updated = { ...prev, walletBal: data.wallet_balance };
          localStorage.setItem('ability_stream_user', JSON.stringify(updated));
          return updated;
        });
      }
    });

    socket.on('new_post', (post: any) => {
      const mapped = { ...post, url: post.media_url || post.url, filterClass: post.filter_class, createdAt: post.created_at, seriesTitle: post.title };
      if (post.type === 'reel') setReels(prev => [mapped, ...prev]);
      else if (post.type === 'story') setStories(prev => [{ ...mapped, user: post.author, image: post.media_url }, ...prev]);
      else if (post.type === 'show') setShows(prev => [{ ...mapped, seriesTitle: post.title, episodes: post.episodes || [], categories: post.categories || [] }, ...prev]);
      else setPosts(prev => [mapped, ...prev]);
    });

    socket.on('tip_received', (data: any) => {
      if (data.creatorId === user.uid) {
        SensorySystem.playBassDrop();
      }
    });

    return () => {
      socket.off('like_update');
      socket.off('view_update');
      socket.off('wallet_update');
      socket.off('new_post');
      socket.off('tip_received');
    };
  }, [user]);

  const savePostToDb = useCallback(async (data: any) => {
    try {
      const destination = data.destination === 'reel' ? 'reel' : data.destination === 'story' ? 'story' : 'post';

      let fileUrl = data.url;
      if (data._file && user?.uid && !user.uid.startsWith('guest_')) {
        fileUrl = await uploadFileToStorage(data._file, '');
      }

      const postType = destination === 'reel' ? 'reel' : destination === 'story' ? 'story' : 'post';
      await api.createPost({
        user_id: user?.uid?.startsWith('guest_') ? null : user?.uid,
        content: data.title || '',
        media_url: fileUrl,
        type: postType,
        author: data.author || user?.username,
        title: data.title || '',
        filter_class: data.filterClass || '',
      });
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [user]);

  const saveShowToDb = useCallback(async (showData: any) => {
    try {
      const isAuthUser = user?.uid && !user.uid.startsWith('guest_');
      let thumbnailUrl = showData.thumbnail;
      if (showData._thumbnailFile && isAuthUser) {
        thumbnailUrl = await uploadFileToStorage(showData._thumbnailFile, '');
      }

      const uploadedEpisodes = await Promise.all(
        (showData.episodes || []).map(async (ep: any) => {
          let episodeUrl = ep.url;
          if (ep._file && isAuthUser) {
            episodeUrl = await uploadFileToStorage(ep._file, '');
          }
          const { _file, ...cleanEp } = ep;
          return { ...cleanEp, url: episodeUrl };
        })
      );

      const { _thumbnailFile, ...cleanShow } = showData;
      await api.createPost({
        user_id: isAuthUser ? user?.uid : null,
        content: cleanShow.description || '',
        media_url: thumbnailUrl,
        type: 'show',
        author: cleanShow.author || user?.username || '',
        title: cleanShow.seriesTitle || cleanShow.series_title || '',
        thumbnail: thumbnailUrl,
        episodes: uploadedEpisodes,
        description: cleanShow.description || '',
        categories: cleanShow.categories || [],
        avatar: cleanShow.avatar || '',
      });
    } catch (err) {
      console.error('Show save error:', err);
    }
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem('ability_stream_user');
    setUser(null);
  };

  const openTipModal = useCallback((creatorName: string, creatorUid?: string) => {
    setTipTarget({ name: creatorName, uid: creatorUid });
  }, []);

  const handleTipSent = useCallback((amount: number) => {
    SensorySystem.playBassDrop();
  }, []);

  const userPosts = useMemo(() => { if (!user) return []; return [...posts, ...reels].filter(p => p.author === user.username); }, [posts, reels, user]);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
        <img src="/logo-main.jpeg" alt="Ability Stream" className="w-64 h-auto rounded-2xl shadow-[0_0_40px_rgba(57,255,20,0.3)] mb-6" />
        <div className="w-12 h-12 border-t-4 border-[#39ff14] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={(u: any) => { if (u.uid) { localStorage.setItem(`ability_role_${u.uid}`, u.role); localStorage.setItem('ability_stream_user', JSON.stringify(u)); } setUser(u); }} />;
  const isCreator = user.role === 'creator';
  const isSuperAdmin = user.email === 'wayed11@gmail.com';
  const a11yClasses = [a11ySettings.highContrast ? 'a11y-high-contrast' : '', a11ySettings.reduceMotion ? 'a11y-reduce-motion' : '', a11ySettings.dyslexicFont ? 'a11y-dyslexic' : ''].filter(Boolean).join(' ');
  const noopMonetize = () => {};

  return (
    <div className={`h-screen w-full bg-black text-white relative overflow-hidden font-sans ${a11yClasses}`}>
      <SVGSprayTexture />
      <div className="film-grain-overlay"></div>

      {showAdminPortal && isSuperAdmin && <AdminPortal user={user} onClose={() => setShowAdminPortal(false)} />}

      {showAbilityLive && <AbilityLive user={user} onClose={() => setShowAbilityLive(false)} />}

      {showVideoGen && <AbilityVideoGen user={user} onClose={() => setShowVideoGen(false)} />}

      {tipTarget && <TipModal creatorName={tipTarget.name} creatorUid={tipTarget.uid} currentUserId={user?.uid} onClose={() => setTipTarget(null)} onTipSent={handleTipSent} />}

      {viewingStoryIndex !== null && <StoryViewer stories={stories} initialIndex={viewingStoryIndex} onClose={() => setViewingStoryIndex(null)} onStoryMonetize={isCreator ? () => { const rate = platformConfig.monetization.perStoryViewRate; SensorySystem.playBlip(); setUser((prev: any) => ({ ...prev, views: prev.views + 1, earnings: prev.earnings + rate, walletBal: prev.walletBal + rate })); } : noopMonetize} />}
      {showStatsCard && !showFullProfile && <StatsDropdownCard user={user} userPosts={userPosts} onClose={() => setShowStatsCard(false)} onExpand={() => { SensorySystem.playSnap(); setShowFullProfile(true); setShowStatsCard(false); }} onPlayPost={(p: any) => setPlayingProfilePost(p)} a11ySettings={a11ySettings} onLogout={handleLogout} />}
      {showFullProfile && <FullProfileScreen user={user} userPosts={userPosts} onClose={() => { SensorySystem.playSnap(); setShowFullProfile(false); }} onPlayPost={(p: any) => setPlayingProfilePost(p)} a11ySettings={a11ySettings} setA11ySettings={setA11ySettings} />}
      {playingProfilePost && <ProfilePostPlayer post={playingProfilePost} onClose={() => { SensorySystem.playSnap(); setPlayingProfilePost(null); }} onMonetize={isCreator ? () => { const rate = platformConfig.monetization.perViewRate; setUser((prev: any) => ({ ...prev, views: prev.views + 1, earnings: prev.earnings + rate, walletBal: prev.walletBal + rate })); } : noopMonetize} onTip={openTipModal} />}

      {playingShow && <ShowPlayer show={playingShow.show} episode={playingShow.episode} onClose={() => setPlayingShow(null)} onMonetize={isCreator ? () => { const rate = platformConfig.monetization.perShowViewRate; setUser((prev: any) => ({ ...prev, views: prev.views + 1, earnings: prev.earnings + rate, walletBal: prev.walletBal + rate })); } : noopMonetize} onTip={openTipModal} />}

      {currentTab === 'feed' && <Feed posts={posts} user={user} setUser={setUser} isReelsTab={false} stories={stories} onAddStory={isCreator ? () => { setUploadDest('story'); setCurrentTab('upload'); } : undefined} onOpenStory={setViewingStoryIndex} onOpenProfileCard={() => { SensorySystem.playBlip(); setShowStatsCard(!showStatsCard); }} adSlots={platformConfig.adSlots} platformConfig={platformConfig} onTip={openTipModal} />}
      {currentTab === 'reels' && <Feed posts={reels} user={user} setUser={setUser} isReelsTab={true} stories={stories} onAddStory={isCreator ? () => { setUploadDest('story'); setCurrentTab('upload'); } : undefined} onOpenStory={setViewingStoryIndex} onOpenProfileCard={() => { SensorySystem.playBlip(); setShowStatsCard(!showStatsCard); }} onBack={() => { SensorySystem.playSnap(); setCurrentTab('feed'); }} adSlots={platformConfig.adSlots} platformConfig={platformConfig} onTip={openTipModal} />}

      {currentTab === 'shows' && <ShowsScreen shows={shows} onPlayEpisode={(show: any, ep: any) => setPlayingShow({show, episode: ep})} onUploadShow={isCreator ? () => { SensorySystem.playBassDrop(); setCurrentTab('showsUpload'); } : undefined} />}

      {currentTab === 'showsUpload' && isCreator && <ShowsUploadScreen user={user} categories={platformConfig.categories} onPublishShow={(newShow: any) => { setShows([newShow, ...shows]); saveShowToDb(newShow); setCurrentTab('shows'); }} onBack={() => setCurrentTab('shows')} />}

      {currentTab === 'upload' && isCreator && <UploadScreen onPost={(data: any) => { savePostToDb(data); if (data.destination === 'story') { setStories([{ id: data.id, user: user.username, image: data.url, url: data.url, type: data.type }, ...stories]); setCurrentTab('feed'); } else if (data.destination === 'reel') { setReels([data, ...reels]); setCurrentTab('reels'); } else { setPosts([data, ...posts]); setCurrentTab('feed'); } }} user={user} uploadDest={uploadDest} setUploadDest={setUploadDest} onBack={() => { SensorySystem.playSnap(); setCurrentTab('feed'); }} />}

      {currentTab === 'wallet' && isCreator && <WalletScreen user={user} setUser={setUser} onBack={() => { SensorySystem.playSnap(); setCurrentTab('feed'); }} platformConfig={platformConfig} adSlots={platformConfig.adSlots} />}

      {(currentTab !== 'showsUpload') && (
        <nav className="absolute bottom-0 w-full h-16 bg-black/95 backdrop-blur-md border-t border-[#39ff14]/30 flex justify-around items-center z-[70] pb-2 pt-1">
          <button onClick={() => { SensorySystem.playBlip(); setCurrentTab('feed'); setShowStatsCard(false); setShowFullProfile(false); }} className={`flex flex-col items-center ${currentTab === 'feed' ? 'text-[#ff1493] scale-110 drop-shadow-[0_0_10px_#ff1493]' : 'text-gray-500'}`}><Play size={24} /><span className="text-[9px] font-bold uppercase mt-1">Stream</span></button>
          <button onClick={() => { SensorySystem.playBlip(); setCurrentTab('reels'); setShowStatsCard(false); setShowFullProfile(false); }} className={`flex flex-col items-center ${currentTab === 'reels' ? 'text-[#00ffff] scale-110 drop-shadow-[0_0_10px_#00ffff]' : 'text-gray-500'}`}><Video size={24} /><span className="text-[9px] font-bold uppercase mt-1">Reels</span></button>

          <button onClick={() => { SensorySystem.playBassDrop(); setShowAbilityLive(true); }} className="flex flex-col items-center text-gray-500 hover:text-[#ff1493] transition-colors relative">
            <div className="relative">
              <Radio size={24} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-[9px] font-bold uppercase mt-1">Live</span>
          </button>

          {isCreator && (
            <button onClick={() => { SensorySystem.playBassDrop(); setShowVideoGen(true); }} className="flex flex-col items-center text-gray-500 hover:text-[#ff1493] transition-colors relative">
              <div className="relative">
                <Wand2 size={24} />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#9b5de5] rounded-full animate-pulse" />
              </div>
              <span className="text-[9px] font-bold uppercase mt-1">AI Gen</span>
            </button>
          )}

          {isCreator ? (
            <button
               onClick={() => { SensorySystem.playBassDrop(); setUploadDest('stream'); setCurrentTab('upload'); setShowStatsCard(false); setShowFullProfile(false); }}
               className="p-3 bg-[#ff1493] rounded-full -mt-8 border-4 border-black active:scale-95 shadow-[0_0_20px_#ff1493] hover:scale-110 transition-transform"
            >
               <Plus size={32} className="text-[#39ff14] font-black" strokeWidth={3} />
            </button>
          ) : (
            <div className="p-3 bg-[#ff1493]/30 rounded-full -mt-8 border-4 border-black">
               <Heart size={32} className="text-[#ff1493]" strokeWidth={2} />
            </div>
          )}

          <button onClick={() => { SensorySystem.playBlip(); setCurrentTab('shows'); setShowStatsCard(false); setShowFullProfile(false); }} className={`flex flex-col items-center ${currentTab === 'shows' ? 'text-[#39ff14] scale-110 drop-shadow-[0_0_10px_#39ff14]' : 'text-gray-500'}`}><Tv size={24} /><span className="text-[9px] font-bold uppercase mt-1">Shows</span></button>
          {isCreator ? (
            <button onClick={() => { SensorySystem.playBlip(); setCurrentTab('wallet'); setShowStatsCard(false); setShowFullProfile(false); }} className={`flex flex-col items-center ${currentTab === 'wallet' ? 'text-[#9b5de5] scale-110 drop-shadow-[0_0_10px_#9b5de5]' : 'text-gray-500'}`}><Wallet size={24} /><span className="text-[9px] font-bold uppercase mt-1">Wallet</span></button>
          ) : (
            <button onClick={() => { SensorySystem.playBlip(); setShowStatsCard(!showStatsCard); setShowFullProfile(false); }} className={`flex flex-col items-center ${showStatsCard ? 'text-[#9b5de5] scale-110 drop-shadow-[0_0_10px_#9b5de5]' : 'text-gray-500'}`}><User size={24} /><span className="text-[9px] font-bold uppercase mt-1">Profile</span></button>
          )}
        </nav>
      )}

      {isSuperAdmin && (
        <button
          onClick={() => { SensorySystem.playBlip(); setShowAdminPortal(true); }}
          className="fixed top-4 right-4 z-[80] p-2.5 bg-black/80 backdrop-blur-md border border-[#ff1493]/50 rounded-xl shadow-[0_0_15px_rgba(255,20,147,0.3)] hover:scale-110 transition-transform hover:border-[#ff1493] group"
          title="Admin Portal"
        >
          <Shield size={18} className="text-[#ff1493] group-hover:drop-shadow-[0_0_10px_#ff1493]" />
        </button>
      )}

      {!isCreator && !isSuperAdmin && (
        <div className="fixed top-4 right-4 z-[80] px-3 py-1.5 bg-black/80 backdrop-blur-md border border-[#ff1493]/30 rounded-full">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff1493]">Guest Supporter</span>
        </div>
      )}
    </div>
  );
}
