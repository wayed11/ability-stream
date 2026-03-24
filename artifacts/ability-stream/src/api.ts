import PocketBase from 'pocketbase';

const pbUrl = typeof window !== 'undefined' ? window.location.origin : '';
const pb = new PocketBase(pbUrl);

pb.autoCancellation(false);

export { pb };

export const api = {
  signup: async (email: string, password: string, role: string = 'creator') => {
    const display_name = email.split('@')[0];
    const bcryptHash = await hashPassword(password);
    const record = await pb.collection('app_users').create({
      email,
      password_hash: bcryptHash,
      display_name,
      role,
      wallet_balance: 0,
    });
    return {
      user: {
        id: record.id,
        email: record.email,
        display_name: record.display_name,
        role: record.role,
        wallet_balance: record.wallet_balance || 0,
        created_at: record.created,
      },
    };
  },

  login: async (email: string, password: string) => {
    const records = await pb.collection('app_users').getList(1, 1, {
      filter: `email='${email}'`,
    });
    if (records.items.length === 0) throw new Error('Invalid email or password');
    const user = records.items[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');

    const posts = await pb.collection('posts').getList(1, 1000, {
      filter: `user_id='${user.id}'`,
    });
    let total_views = 0, total_likes = 0;
    posts.items.forEach(p => {
      total_views += p.views || 0;
      total_likes += p.likes || 0;
    });

    const earnings = await pb.collection('earnings').getList(1, 1000, {
      filter: `user_id='${user.id}'`,
    });
    let total_earnings = 0;
    earnings.items.forEach(e => {
      total_earnings += e.creator_share || 0;
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        wallet_balance: user.wallet_balance || 0,
        total_views,
        total_likes,
        total_posts: posts.totalItems,
        total_earnings,
        created_at: user.created,
      },
    };
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const tempRecord = await pb.collection('posts').create({
        user_id: 'temp_upload',
        type: 'post',
        media_file: file,
        content: '',
        views: 0,
        likes: 0,
      } as any);
      const url = pb.files.getURL(tempRecord, tempRecord.media_file);
      await pb.collection('posts').delete(tempRecord.id);
      return url;
    }
    const data = await res.json();
    return data.url;
  },

  getPosts: async (type?: string) => {
    const filter = type ? `type='${type}'` : '';
    const records = await pb.collection('posts').getList(1, 200, {
      filter,
      sort: '-created',
    });
    return records.items.map(r => ({
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      media_url: r.media_file ? pb.files.getURL(r, r.media_file) : r.media_url,
      type: r.type,
      views: r.views || 0,
      likes: r.likes || 0,
      author: r.author,
      title: r.title,
      filter_class: r.filter_class,
      thumbnail: r.thumbnail,
      episodes: r.episodes,
      description: r.description,
      categories: r.categories,
      avatar: r.avatar,
      created_at: r.created,
    }));
  },

  createPost: async (data: any) => {
    const record = await pb.collection('posts').create({
      user_id: data.user_id,
      content: data.content || '',
      media_url: data.media_url || '',
      type: data.type || 'post',
      views: 0,
      likes: 0,
      author: data.author || '',
      title: data.title || '',
      filter_class: data.filter_class || '',
      thumbnail: data.thumbnail || '',
      episodes: data.episodes || null,
      description: data.description || '',
      categories: data.categories || null,
      avatar: data.avatar || '',
    });
    return {
      id: record.id,
      user_id: record.user_id,
      content: record.content,
      media_url: record.media_url,
      type: record.type,
      views: record.views || 0,
      likes: record.likes || 0,
      author: record.author,
      title: record.title,
      filter_class: record.filter_class,
      thumbnail: record.thumbnail,
      episodes: record.episodes,
      description: record.description,
      categories: record.categories,
      avatar: record.avatar,
      created_at: record.created,
    };
  },

  updatePost: async (id: string, data: any) => {
    const record = await pb.collection('posts').update(id, data);
    return {
      id: record.id,
      user_id: record.user_id,
      content: record.content,
      media_url: record.media_url,
      type: record.type,
      views: record.views || 0,
      likes: record.likes || 0,
      author: record.author,
      title: record.title,
      created_at: record.created,
    };
  },

  deletePost: async (id: string) => {
    await pb.collection('posts').delete(id);
    return { success: true };
  },

  likePost: async (postId: string, userId: string) => {
    try {
      await pb.collection('likes').create({
        post_id: postId,
        user_id: userId,
      });
    } catch {
    }

    const post = await pb.collection('posts').getOne(postId);
    const newLikes = (post.likes || 0) + 1;
    await pb.collection('posts').update(postId, { likes: newLikes });

    const config = await api.getAdminConfig();
    const likeRate = config?.monetization?.like_rate || 0.01;
    const creatorSplit = (config?.monetization?.creator_split || 70) / 100;
    const earning = likeRate;

    await pb.collection('earnings').create({
      user_id: post.user_id,
      type: 'like',
      amount: earning,
      creator_share: earning * creatorSplit,
      platform_share: earning * (1 - creatorSplit),
    });

    const user = await pb.collection('app_users').getOne(post.user_id);
    await pb.collection('app_users').update(post.user_id, {
      wallet_balance: (user.wallet_balance || 0) + earning * creatorSplit,
    });

    return { success: true, likes: newLikes };
  },

  viewPost: async (postId: string) => {
    try {
      const post = await pb.collection('posts').getOne(postId);
      const newViews = (post.views || 0) + 1;
      await pb.collection('posts').update(postId, { views: newViews });

      const config = await api.getAdminConfig();
      const viewRate = config?.monetization?.view_rate || 0.001;
      const creatorSplit = (config?.monetization?.creator_split || 70) / 100;

      await pb.collection('earnings').create({
        user_id: post.user_id,
        type: 'view',
        amount: viewRate,
        creator_share: viewRate * creatorSplit,
        platform_share: viewRate * (1 - creatorSplit),
      });

      const user = await pb.collection('app_users').getOne(post.user_id);
      await pb.collection('app_users').update(post.user_id, {
        wallet_balance: (user.wallet_balance || 0) + viewRate * creatorSplit,
      });

      return { success: true, views: newViews };
    } catch {
      return { success: false, views: 0 };
    }
  },

  sendTip: async (data: { creator_id: string; supporter_id: string; amount: number }) => {
    const tip = await pb.collection('tips').create({
      creator_id: data.creator_id,
      supporter_id: data.supporter_id,
      amount: data.amount,
      status: 'completed',
    });

    const config = await api.getAdminConfig();
    const creatorSplit = (config?.monetization?.creator_split || 70) / 100;

    await pb.collection('earnings').create({
      user_id: data.creator_id,
      type: 'tip',
      amount: data.amount,
      creator_share: data.amount * creatorSplit,
      platform_share: data.amount * (1 - creatorSplit),
    });

    const creator = await pb.collection('app_users').getOne(data.creator_id);
    await pb.collection('app_users').update(data.creator_id, {
      wallet_balance: (creator.wallet_balance || 0) + data.amount * creatorSplit,
    });

    return tip;
  },

  getWallet: async (userId: string) => {
    const user = await pb.collection('app_users').getOne(userId);
    const earnings = await pb.collection('earnings').getList(1, 100, {
      filter: `user_id='${userId}'`,
      sort: '-created',
    });
    const posts = await pb.collection('posts').getList(1, 1000, {
      filter: `user_id='${userId}'`,
    });

    let total_views = 0, total_likes = 0, total_earnings = 0;
    posts.items.forEach(p => {
      total_views += p.views || 0;
      total_likes += p.likes || 0;
    });
    earnings.items.forEach(e => {
      total_earnings += e.creator_share || 0;
    });

    return {
      user: {
        ...user,
        wallet_balance: user.wallet_balance || 0,
      },
      earnings: earnings.items,
      stats: {
        total_views,
        total_likes,
        total_posts: posts.totalItems,
        total_earnings,
      },
    };
  },

  getAdminConfig: async () => {
    try {
      const records = await pb.collection('admin_config').getList(1, 1, {
        filter: `config_key='platform'`,
      });
      if (records.items.length > 0) {
        const r = records.items[0];
        return {
          id: r.id,
          monetization: r.monetization || { view_rate: 0.001, like_rate: 0.01, creator_split: 70, platform_split: 30 },
          ad_slots: r.ad_slots || [],
          featured_show_ids: r.featured_show_ids || [],
          categories: r.categories || [],
        };
      }
    } catch {}
    return {
      monetization: { view_rate: 0.001, like_rate: 0.01, creator_split: 70, platform_split: 30 },
      ad_slots: [],
      featured_show_ids: [],
      categories: [],
    };
  },

  saveAdminConfig: async (data: any) => {
    const records = await pb.collection('admin_config').getList(1, 1, {
      filter: `config_key='platform'`,
    });
    if (records.items.length > 0) {
      return await pb.collection('admin_config').update(records.items[0].id, {
        monetization: data.monetization,
        ad_slots: data.ad_slots,
        featured_show_ids: data.featured_show_ids,
        categories: data.categories,
      });
    } else {
      return await pb.collection('admin_config').create({
        config_key: 'platform',
        ...data,
      });
    }
  },
  saveLiveSession: async (data: {
    user_id: string;
    room_name: string;
    display_name: string;
    duration_seconds: number;
    participant_count: number;
    captions_used: boolean;
    notes?: string;
  }) => {
    const record = await pb.collection('live_saves').create(data);
    return {
      id: record.id,
      user_id: record.user_id,
      room_name: record.room_name,
      display_name: record.display_name,
      duration_seconds: record.duration_seconds,
      participant_count: record.participant_count,
      captions_used: record.captions_used,
      notes: record.notes,
      created_at: record.created,
    };
  },

  getLiveSaves: async (userId: string) => {
    const records = await pb.collection('live_saves').getList(1, 50, {
      filter: `user_id='${userId}'`,
      sort: '-created',
    });
    return records.items.map(r => ({
      id: r.id,
      user_id: r.user_id,
      room_name: r.room_name,
      display_name: r.display_name,
      duration_seconds: r.duration_seconds,
      participant_count: r.participant_count,
      captions_used: r.captions_used,
      notes: r.notes,
      created_at: r.created,
    }));
  },

  deleteLiveSave: async (id: string) => {
    await pb.collection('live_saves').delete(id);
    return { success: true };
  },

  lumaGenerate: async (prompt: string, model: string = 'ray-2', duration: string = '5s', resolution: string = '720p', userId: string = '') => {
    const res = await fetch('/api/luma/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, duration, resolution, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok && !data.id) throw new Error(data.error || `Luma API error (${res.status})`);
    return data;
  },

  lumaPollStatus: async (genId: string) => {
    const res = await fetch(`/api/luma/status/${genId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Poll error (${res.status})`);
    return data;
  },

  saveVideoGen: async (data: {
    user_id: string;
    prompt: string;
    luma_gen_id: string;
    status: string;
    video_url?: string;
    thumbnail_url?: string;
    model: string;
    duration: string;
    resolution: string;
    captions_on?: boolean;
    error_msg?: string;
    daily_date: string;
  }) => {
    const record = await pb.collection('video_gens').create(data);
    return record;
  },

  updateVideoGen: async (id: string, data: Record<string, any>) => {
    const record = await pb.collection('video_gens').update(id, data);
    return record;
  },

  getVideoGens: async (userId: string) => {
    const records = await pb.collection('video_gens').getList(1, 50, {
      filter: `user_id = "${userId}" && status = "completed"`,
      sort: '-created',
    });
    return records.items;
  },

  getDailyGenCount: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const records = await pb.collection('video_gens').getList(1, 100, {
      filter: `user_id = "${userId}" && daily_date = "${today}"`,
    });
    return records.totalItems;
  },
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return '$sha256$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('$sha256$')) {
    const computed = await hashPassword(password);
    return computed === storedHash;
  }
  return false;
}
