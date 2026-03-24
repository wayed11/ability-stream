import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, DollarSign, ToggleLeft, ToggleRight, Tv, Image as ImageIcon, Video, Layout, Users, Settings, BarChart3, Shield, Eye, ChevronDown, ChevronUp, ExternalLink, X, Edit3, Check, AlertTriangle, Move, Smartphone, Monitor, Zap, Copy } from 'lucide-react';
import { api } from './api';

const ADMIN_UIDS = ['ADMIN'];

interface AdSlotConfig {
  id: string;
  name: string;
  placement: string;
  type: string;
  adNetwork: string;
  adUnitId: string;
  enabled: boolean;
  sponsorName?: string;
  sponsorImageUrl?: string;
  sponsorClickUrl?: string;
  sponsorBudget?: number;
  order: number;
}

interface MonetizationConfig {
  creatorSplit: number;
  platformSplit: number;
  payoutTier1: number;
  payoutTier2: number;
  payoutTier3: number;
  perViewRate: number;
  perLikeRate: number;
  perStoryViewRate: number;
  perShowViewRate: number;
  adBoostRate: number;
}

interface PlatformConfig {
  monetization: MonetizationConfig;
  adSlots: AdSlotConfig[];
  featuredShowIds: string[];
  categories: string[];
}

const DEFAULT_CONFIG: PlatformConfig = {
  monetization: {
    creatorSplit: 70,
    platformSplit: 30,
    payoutTier1: 10,
    payoutTier2: 50,
    payoutTier3: 100,
    perViewRate: 0.001,
    perLikeRate: 0.05,
    perStoryViewRate: 0.07,
    perShowViewRate: 0.15,
    adBoostRate: 0.10,
  },
  adSlots: [
    { id: 'feed_inline_1', name: 'Feed In-Line Ad', placement: 'feed', type: 'native', adNetwork: 'adsense', adUnitId: '', enabled: true, order: 0 },
    { id: 'reels_between_1', name: 'Reels Between Ad', placement: 'reels', type: 'native', adNetwork: 'admob', adUnitId: '', enabled: true, order: 1 },
    { id: 'shows_preroll', name: 'Shows Pre-Roll', placement: 'shows', type: 'video-preroll', adNetwork: 'ad_manager', adUnitId: '', enabled: true, order: 2 },
    { id: 'stories_between', name: 'Stories Between Ad', placement: 'stories', type: 'banner', adNetwork: 'adsense', adUnitId: '', enabled: true, order: 3 },
    { id: 'wallet_banner', name: 'Wallet Banner', placement: 'wallet', type: 'banner', adNetwork: 'adsense', adUnitId: '', enabled: true, order: 4 },
    { id: 'feed_sponsor_1', name: 'Feed Sponsor Slot', placement: 'feed', type: 'sponsor', adNetwork: 'direct', adUnitId: '', enabled: false, sponsorName: '', sponsorImageUrl: '', sponsorClickUrl: '', sponsorBudget: 0, order: 5 },
  ],
  featuredShowIds: [],
  categories: ['Trending', 'Neon Originals', 'Audio Described'],
};

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true, badge }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-gray-900/80 border border-white/10 rounded-2xl overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 min-h-[60px] text-left active:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1493]/20 to-[#9b5de5]/20 flex items-center justify-center border border-[#ff1493]/30">
            <Icon size={22} className="text-[#ff1493]" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase text-sm tracking-wider">{title}</h3>
            {badge && <span className="text-[9px] font-bold text-[#39ff14] uppercase">{badge}</span>}
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          {open ? <ChevronUp size={22} className="text-gray-400" /> : <ChevronDown size={22} className="text-gray-400" />}
        </div>
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/5 pt-4">{children}</div>}
    </div>
  );
};

const QUICK_ADD_TEMPLATES = [
  { label: 'AdSense Banner', icon: '📊', network: 'adsense', type: 'banner', placement: 'feed' },
  { label: 'AdMob Native', icon: '📱', network: 'admob', type: 'native', placement: 'feed' },
  { label: 'Ad Manager Pre-Roll', icon: '🎬', network: 'ad_manager', type: 'video-preroll', placement: 'shows' },
  { label: 'Direct Sponsor', icon: '🤝', network: 'direct', type: 'sponsor', placement: 'feed' },
];

const PLACEMENT_MAP: Record<string, string> = {
  feed: 'Main Feed — between posts',
  reels: 'Reels Tab — between reels',
  shows: 'Shows Tab — before episodes',
  stories: 'Stories — between stories',
  wallet: 'Wallet Screen — banner area',
  profile: 'Profile Page — sidebar',
};

const DraggableAdSlot = ({ slot, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onDuplicate }: any) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(slot);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setLocal(slot); }, [slot]);

  const networkColors: any = { adsense: '#4285F4', admob: '#FFCA28', ad_manager: '#34A853', direct: '#ff1493' };
  const networkLabels: any = { adsense: 'AdSense', admob: 'AdMob', ad_manager: 'Ad Manager', direct: 'Sponsor' };
  const networkIcons: any = { adsense: '📊', admob: '📱', ad_manager: '🎬', direct: '🤝' };

  const saveEdit = () => { onUpdate(local); setEditing(false); };

  return (
    <div className={`border-2 rounded-2xl mb-3 transition-all overflow-hidden ${slot.enabled ? 'border-[#39ff14]/30 bg-[#39ff14]/5' : 'border-white/10 bg-white/5 opacity-70'}`}>
      <div className="flex items-center gap-2 p-4 min-h-[72px]">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="p-2 rounded-lg text-gray-500 disabled:opacity-20 hover:text-white active:bg-white/10 min-h-[48px] min-w-[48px] flex items-center justify-center"><ChevronUp size={20} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="p-2 rounded-lg text-gray-500 disabled:opacity-20 hover:text-white active:bg-white/10 min-h-[48px] min-w-[48px] flex items-center justify-center"><ChevronDown size={20} /></button>
        </div>
        <div className="text-xl flex-shrink-0">{networkIcons[slot.adNetwork] || '📊'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-white truncate">{slot.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: networkColors[slot.adNetwork], borderColor: networkColors[slot.adNetwork] + '50', backgroundColor: networkColors[slot.adNetwork] + '10' }}>
              {networkLabels[slot.adNetwork]}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">{slot.placement} / {slot.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onUpdate({ ...slot, enabled: !slot.enabled })} className={`p-2.5 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center ${slot.enabled ? 'text-[#39ff14] bg-[#39ff14]/10' : 'text-gray-500 bg-white/5'}`}>
            {slot.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
          <button onClick={() => setEditing(!editing)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-white/20"><Edit3 size={18} /></button>
        </div>
      </div>

      {editing && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Slot Name</label>
            <input value={local.name} onChange={e => setLocal({ ...local, name: e.target.value })} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#ff1493] min-h-[48px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Where to Show</label>
              <select value={local.placement} onChange={e => setLocal({ ...local, placement: e.target.value })} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px] appearance-none">
                <option value="feed">Feed</option>
                <option value="reels">Reels</option>
                <option value="shows">Shows</option>
                <option value="stories">Stories</option>
                <option value="wallet">Wallet</option>
                <option value="profile">Profile</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Ad Format</label>
              <select value={local.type} onChange={e => setLocal({ ...local, type: e.target.value })} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px] appearance-none">
                <option value="banner">Banner</option>
                <option value="native">Native In-Feed</option>
                <option value="video-preroll">Video Pre-Roll</option>
                <option value="interstitial">Interstitial</option>
                <option value="sponsor">Sponsor Card</option>
              </select>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-gray-400 flex items-center gap-2"><Smartphone size={14} className="text-[#00ffff]" /> <strong className="text-white">{PLACEMENT_MAP[local.placement] || local.placement}</strong></p>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Ad Network</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'adsense', label: 'Google AdSense', color: '#4285F4', icon: '📊' },
                { value: 'admob', label: 'Google AdMob', color: '#FFCA28', icon: '📱' },
                { value: 'ad_manager', label: 'Google Ad Manager', color: '#34A853', icon: '🎬' },
                { value: 'direct', label: 'Direct Sponsor', color: '#ff1493', icon: '🤝' },
              ].map(net => (
                <button key={net.value} onClick={() => setLocal({ ...local, adNetwork: net.value })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left min-h-[52px] transition-all active:scale-95 ${local.adNetwork === net.value ? 'border-current shadow-[0_0_10px_currentColor]' : 'border-white/10 opacity-60'}`}
                  style={{ color: local.adNetwork === net.value ? net.color : undefined }}>
                  <span className="text-lg">{net.icon}</span>
                  <span className="text-xs font-black">{net.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Ad Unit ID</label>
            <input value={local.adUnitId} onChange={e => setLocal({ ...local, adUnitId: e.target.value })} placeholder="ca-pub-xxx/1234 or slot ID" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#39ff14] min-h-[48px]" />
            <p className="text-[10px] text-gray-600 mt-1">Paste your Google ad unit ID here. You'll get this from your Google Ads dashboard.</p>
          </div>

          {local.adNetwork === 'direct' && (
            <div className="space-y-3 bg-[#ff1493]/5 border border-[#ff1493]/20 rounded-xl p-4">
              <h4 className="text-xs font-black text-[#ff1493] uppercase flex items-center gap-2"><Users size={14} /> Sponsor Details</h4>
              <input value={local.sponsorName || ''} onChange={e => setLocal({ ...local, sponsorName: e.target.value })} placeholder="Sponsor Brand Name" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px]" />
              <input value={local.sponsorImageUrl || ''} onChange={e => setLocal({ ...local, sponsorImageUrl: e.target.value })} placeholder="Creative Image URL (banner/logo)" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px]" />
              {local.sponsorImageUrl && (
                <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img src={local.sponsorImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <input value={local.sponsorClickUrl || ''} onChange={e => setLocal({ ...local, sponsorClickUrl: e.target.value })} placeholder="Click-through URL (https://...)" className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px]" />
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Campaign Budget ($)</label>
                <input type="number" value={local.sponsorBudget || 0} onChange={e => setLocal({ ...local, sponsorBudget: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none min-h-[48px]" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex-1 bg-[#39ff14] text-black font-black py-3.5 rounded-xl text-base flex items-center justify-center gap-2 min-h-[52px] active:scale-95 transition-transform shadow-[0_0_15px_rgba(57,255,20,0.3)]"><Check size={18} /> Save Changes</button>
            <button onClick={() => { setLocal(slot); setEditing(false); }} className="px-5 bg-white/10 text-white font-bold py-3.5 rounded-xl text-base min-h-[52px]">Cancel</button>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/5">
            <button onClick={() => { onDuplicate(slot); setEditing(false); }} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 bg-white/5 py-2.5 rounded-xl active:bg-white/10 min-h-[44px]">
              <Copy size={14} /> Duplicate Slot
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-red-400 bg-red-500/5 py-2.5 rounded-xl active:bg-red-500/10 min-h-[44px]">
                <Trash2 size={14} /> Delete Slot
              </button>
            ) : (
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white bg-red-500 py-2.5 rounded-xl active:scale-95 min-h-[44px]">
                <Trash2 size={14} /> Confirm Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ContentModeration = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const postsData = await api.getPosts();
        if (postsData) {
          setPosts(postsData.filter((p: any) => p.type !== 'show'));
          setShows(postsData.filter((p: any) => p.type === 'show').map((s: any) => ({ ...s, seriesTitle: s.title })));
        }
      } catch (e) { console.error('Failed to load content:', e); }
    };
    loadContent();
  }, []);

  const removePost = async (id: string) => {
    try { await api.deletePost(id); setPosts(prev => prev.filter(p => p.id !== id)); } catch (e) { console.error(e); }
  };
  const removeShow = async (id: string) => {
    try { await api.deletePost(id); setShows(prev => prev.filter(s => s.id !== id)); } catch (e) { console.error(e); }
  };

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Video size={16} /> User Posts ({posts.length})</h4>
      {posts.length === 0 && <p className="text-sm text-gray-600 mb-4 bg-white/5 rounded-xl p-4 text-center">No user posts yet. Content will appear here as users create it.</p>}
      <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
        {posts.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-black/50 rounded-xl p-3 border border-white/10 min-h-[60px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {p.media_url ? <img src={p.media_url} alt="" className="w-full h-full object-cover" /> : p.type === 'video' ? <Video size={20} className="text-gray-500" /> : <ImageIcon size={20} className="text-gray-500" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">@{p.author}</p>
                <p className="text-xs text-gray-500 truncate">{p.title || 'Untitled'} — {p.type}</p>
              </div>
            </div>
            <button onClick={() => removePost(p.id)} className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-red-500/30"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Tv size={16} /> User Shows ({shows.length})</h4>
      {shows.length === 0 && <p className="text-sm text-gray-600 bg-white/5 rounded-xl p-4 text-center">No user shows yet.</p>}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {shows.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-black/50 rounded-xl p-3 border border-white/10 min-h-[60px]">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{s.seriesTitle || s.series_title}</p>
              <p className="text-xs text-gray-500">by @{s.author}</p>
            </div>
            <button onClick={() => removeShow(s.id)} className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center active:bg-red-500/30"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminPortal({ user, onClose }: { user: any; onClose: () => void }) {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.getAdminConfig();
        if (data) {
          const mon = typeof data.monetization === 'string' ? JSON.parse(data.monetization) : data.monetization;
          const slots = typeof data.ad_slots === 'string' ? JSON.parse(data.ad_slots) : data.ad_slots;
          const cats = typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories;
          const featured = typeof data.featured_show_ids === 'string' ? JSON.parse(data.featured_show_ids) : data.featured_show_ids;
          setConfig({
            monetization: { ...DEFAULT_CONFIG.monetization, ...mon },
            adSlots: slots || DEFAULT_CONFIG.adSlots,
            featuredShowIds: featured || [],
            categories: cats || DEFAULT_CONFIG.categories,
          });
        }
      } catch (e) {
        console.error('Failed to load admin config:', e);
      }
      setLoading(false);
    };
    loadConfig();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.saveAdminConfig({
        monetization: config.monetization,
        ad_slots: config.adSlots,
        featured_show_ids: config.featuredShowIds,
        categories: config.categories,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Failed to save config:', e);
    }
    setSaving(false);
  };

  const updateMonetization = (field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      monetization: { ...prev.monetization, [field]: value }
    }));
  };

  const updateAdSlot = (index: number, updated: AdSlotConfig) => {
    setConfig(prev => {
      const slots = [...prev.adSlots];
      slots[index] = updated;
      return { ...prev, adSlots: slots };
    });
  };

  const deleteAdSlot = (index: number) => {
    setConfig(prev => ({
      ...prev,
      adSlots: prev.adSlots.filter((_, i) => i !== index)
    }));
  };

  const moveAdSlot = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const slots = [...prev.adSlots];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= slots.length) return prev;
      [slots[index], slots[newIndex]] = [slots[newIndex], slots[index]];
      slots.forEach((s, i) => s.order = i);
      return { ...prev, adSlots: slots };
    });
  };

  const duplicateAdSlot = (slot: AdSlotConfig) => {
    const newSlot: AdSlotConfig = {
      ...slot,
      id: 'slot_' + Date.now(),
      name: slot.name + ' (Copy)',
      order: config.adSlots.length,
    };
    setConfig(prev => ({ ...prev, adSlots: [...prev.adSlots, newSlot] }));
  };

  const addAdSlot = () => {
    const newSlot: AdSlotConfig = {
      id: 'slot_' + Date.now(),
      name: 'New Ad Slot',
      placement: 'feed',
      type: 'banner',
      adNetwork: 'adsense',
      adUnitId: '',
      enabled: false,
      order: config.adSlots.length,
    };
    setConfig(prev => ({ ...prev, adSlots: [...prev.adSlots, newSlot] }));
  };

  const quickAddSlot = (template: typeof QUICK_ADD_TEMPLATES[0]) => {
    const newSlot: AdSlotConfig = {
      id: 'slot_' + Date.now(),
      name: template.label,
      placement: template.placement,
      type: template.type,
      adNetwork: template.network,
      adUnitId: '',
      enabled: false,
      order: config.adSlots.length,
      ...(template.network === 'direct' ? { sponsorName: '', sponsorImageUrl: '', sponsorClickUrl: '', sponsorBudget: 0 } : {}),
    };
    setConfig(prev => ({ ...prev, adSlots: [...prev.adSlots, newSlot] }));
  };

  const addCategory = () => {
    if (newCategoryName.trim() && !config.categories.includes(newCategoryName.trim())) {
      setConfig(prev => ({ ...prev, categories: [...prev.categories, newCategoryName.trim()] }));
      setNewCategoryName('');
      setShowCategoryInput(false);
    }
  };

  const removeCategory = (cat: string) => {
    setConfig(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-[500] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-t-4 border-[#ff1493] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Loading Admin Portal...</p>
      </div>
    );
  }

  const mon = config.monetization;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[500] overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-[#ff1493]/30 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 active:bg-white/20 min-h-[48px] min-w-[48px] flex items-center justify-center">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-lg font-black italic text-[#ff1493] leading-none">ADMIN PORTAL</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Total Platform Control</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-32 max-w-2xl mx-auto">
        <SectionCard title="Monetization" icon={DollarSign} badge={`${mon.creatorSplit}/${mon.platformSplit} split`}>
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-[#39ff14]/10 to-[#ff1493]/10 border border-[#39ff14]/20 rounded-xl p-4">
              <h4 className="text-sm font-black text-[#39ff14] uppercase mb-4">Revenue Split</h4>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Creator %</label>
                  <input type="number" value={mon.creatorSplit} onChange={e => { const v = parseInt(e.target.value) || 0; updateMonetization('creatorSplit', v); updateMonetization('platformSplit', 100 - v); }}
                    className="w-full bg-black/50 border border-[#39ff14]/30 rounded-xl px-4 py-3 text-[#39ff14] text-3xl font-black text-center focus:outline-none min-h-[56px]" />
                </div>
                <span className="text-gray-500 font-black text-3xl mt-6">/</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Platform %</label>
                  <div className="w-full bg-black/50 border border-[#ff1493]/30 rounded-xl px-4 py-3 text-[#ff1493] text-3xl font-black text-center min-h-[56px]">
                    {mon.platformSplit}
                  </div>
                </div>
              </div>
              <div className="h-4 w-full bg-black rounded-full overflow-hidden flex">
                <div className="h-full bg-[#39ff14] transition-all" style={{ width: `${mon.creatorSplit}%` }}></div>
                <div className="h-full bg-[#ff1493] transition-all" style={{ width: `${mon.platformSplit}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-bold mt-2">
                <span className="text-[#39ff14]">Creator: {mon.creatorSplit}%</span>
                <span className="text-[#ff1493]">Platform: {mon.platformSplit}%</span>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-black text-white uppercase mb-4">Payout Thresholds</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tier 1', field: 'payoutTier1', color: '#00ffff' },
                  { label: 'Tier 2', field: 'payoutTier2', color: '#39ff14' },
                  { label: 'Tier 3', field: 'payoutTier3', color: '#9b5de5' },
                ].map(t => (
                  <div key={t.field}>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-2">{t.label}</label>
                    <div className="flex items-center bg-black/50 border border-white/20 rounded-xl overflow-hidden min-h-[52px]">
                      <span className="px-3 font-black text-lg" style={{ color: t.color }}>$</span>
                      <input type="number" value={(mon as any)[t.field]} onChange={e => updateMonetization(t.field, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1 py-3 text-white text-xl font-black focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-500/80 leading-relaxed">Creators must earn at least Tier 1 (${mon.payoutTier1}) before they can request a payout. Higher tiers get faster processing.</p>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-black text-white uppercase mb-4">Earning Rates</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Per View', field: 'perViewRate', value: mon.perViewRate },
                  { label: 'Per Like', field: 'perLikeRate', value: mon.perLikeRate },
                  { label: 'Story View', field: 'perStoryViewRate', value: mon.perStoryViewRate },
                  { label: 'Show View', field: 'perShowViewRate', value: mon.perShowViewRate },
                  { label: 'Ad Boost', field: 'adBoostRate', value: mon.adBoostRate },
                ].map(r => (
                  <div key={r.field}>
                    <label className="text-xs text-gray-400 font-bold uppercase block mb-2">{r.label}</label>
                    <div className="flex items-center bg-black/50 border border-white/20 rounded-xl overflow-hidden min-h-[48px]">
                      <span className="px-3 text-gray-500 text-sm font-bold">$</span>
                      <input type="number" step="0.001" value={r.value} onChange={e => updateMonetization(r.field, parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent px-1 py-3 text-white text-base font-bold focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ad Placements" icon={Layout} badge={`${config.adSlots.filter(s => s.enabled).length} active`}>
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-bold mb-4">Quick Add — tap to instantly create a new ad slot:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_ADD_TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => quickAddSlot(t)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 active:bg-white/10 active:scale-95 transition-all min-h-[52px] text-left">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className="text-xs font-black text-white">{t.label}</p>
                    <p className="text-[10px] text-gray-500">{t.placement} / {t.type}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={addAdSlot} className="w-full flex items-center justify-center gap-2 text-sm font-black text-[#39ff14] bg-[#39ff14]/10 p-3 rounded-xl active:bg-[#39ff14] active:text-black transition-all min-h-[52px] border border-[#39ff14]/20">
              <Plus size={18} /> Add Custom Slot
            </button>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Your Ad Slots ({config.adSlots.length})</p>
          </div>
          {config.adSlots.map((slot, i) => (
            <DraggableAdSlot key={slot.id} slot={slot} index={i}
              onUpdate={(updated: AdSlotConfig) => updateAdSlot(i, updated)}
              onDelete={() => deleteAdSlot(i)}
              onMoveUp={() => moveAdSlot(i, 'up')}
              onMoveDown={() => moveAdSlot(i, 'down')}
              onDuplicate={duplicateAdSlot}
              isFirst={i === 0}
              isLast={i === config.adSlots.length - 1}
            />
          ))}
          {config.adSlots.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl">
              <Layout size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-bold">No ad slots yet</p>
              <p className="text-gray-600 text-xs mt-1">Use Quick Add above to get started</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Sponsors" icon={Users} defaultOpen={false} badge={`${config.adSlots.filter(s => s.adNetwork === 'direct' && s.enabled).length} live`}>
          <p className="text-xs text-gray-400 font-bold mb-4 leading-relaxed">Direct sponsor campaigns run alongside Google ads. Add sponsors via Ad Placements above — set network to "Direct Sponsor" and fill in the sponsor details.</p>
          {config.adSlots.filter(s => s.adNetwork === 'direct').map((s, i) => (
            <div key={s.id} className="bg-[#ff1493]/5 border border-[#ff1493]/20 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-white">{s.sponsorName || 'Unnamed Sponsor'}</p>
                  <p className="text-xs text-gray-500">{s.placement} / Budget: ${s.sponsorBudget || 0}</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${s.enabled ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'bg-gray-500/20 text-gray-500'}`}>
                  {s.enabled ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
              {s.sponsorImageUrl && <img src={s.sponsorImageUrl} alt="" className="w-full h-24 object-cover rounded-xl border border-white/10" />}
            </div>
          ))}
          {config.adSlots.filter(s => s.adNetwork === 'direct').length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-gray-600">No direct sponsors yet</p>
              <p className="text-xs text-gray-700 mt-1">Add one via Ad Placements section</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Content Moderation" icon={Shield} defaultOpen={false}>
          <ContentModeration />
        </SectionCard>

        <SectionCard title="Categories & Filters" icon={Settings} defaultOpen={false} badge={`${config.categories.length} active`}>
          <div className="flex flex-wrap gap-2 mb-4">
            {config.categories.map(cat => (
              <div key={cat} className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-full px-4 py-2.5 min-h-[44px]">
                <span className="text-sm font-bold text-white">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="text-gray-500 hover:text-red-400 p-1.5 min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={18} /></button>
              </div>
            ))}
          </div>
          {showCategoryInput ? (
            <div className="flex gap-2">
              <input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#00ffff] min-h-[48px]"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
              />
              <button onClick={addCategory} className="px-4 bg-[#00ffff] text-black font-black rounded-xl min-h-[48px] active:scale-95">Add</button>
              <button onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }} className="px-3 bg-white/10 text-white rounded-xl min-h-[48px]"><X size={18} /></button>
            </div>
          ) : (
            <button onClick={() => setShowCategoryInput(true)} className="flex items-center gap-2 text-sm font-bold text-[#00ffff] bg-[#00ffff]/10 px-4 py-3 rounded-xl active:bg-[#00ffff] active:text-black transition-all min-h-[48px]">
              <Plus size={16} /> Add Category
            </button>
          )}
        </SectionCard>

        <SectionCard title="Analytics Overview" icon={BarChart3} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-[#39ff14]">{config.adSlots.filter(s => s.enabled).length}</p>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1">Active Ad Slots</p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-[#ff1493]">{config.adSlots.filter(s => s.adNetwork === 'direct' && s.enabled).length}</p>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1">Live Sponsors</p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-[#00ffff]">{mon.creatorSplit}/{mon.platformSplit}</p>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1">Revenue Split</p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-[#9b5de5]">${mon.payoutTier1}</p>
              <p className="text-xs text-gray-500 font-bold uppercase mt-1">Min Payout</p>
            </div>
          </div>
          <div className="mt-4 bg-gradient-to-r from-[#9b5de5]/10 to-[#ff1493]/10 border border-[#9b5de5]/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 leading-relaxed">Full analytics dashboard with revenue tracking, user growth, and ad performance will be available when ad networks are connected. Configure your Google ad unit IDs above to start tracking.</p>
          </div>
        </SectionCard>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[510] bg-black/95 backdrop-blur-xl border-t border-[#ff1493]/30 px-4 py-3 safe-area-bottom">
        <button onClick={saveConfig} disabled={saving}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all min-h-[56px] active:scale-[0.98] ${saved ? 'bg-[#39ff14] text-black shadow-[0_0_30px_#39ff14]' : 'bg-gradient-to-r from-[#ff1493] to-[#9b5de5] text-white shadow-[0_0_20px_#ff1493]'} disabled:opacity-50`}>
          {saving ? (
            <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
          ) : saved ? (
            <><Check size={22} /> Changes Saved!</>
          ) : (
            <><Save size={22} /> Save All Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_CONFIG };
export type { PlatformConfig, AdSlotConfig, MonetizationConfig };
